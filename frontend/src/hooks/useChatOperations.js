import { useState, useEffect, useRef } from 'react';
import { chatApi } from '../services/chatApi';

export const useChatOperations = ({ user, authFetch, logout, fetchDbUsers, setMessages, setGroups }) => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [reports, setReports] = useState([]);
  const deletedChatIdsRef = useRef(new Set());
  const chatOrderRef = useRef(new Map());

  const getChatOrderKey = (chat) => {
    if (!chat) return '';
    return String(chat.id ?? chat._id ?? chat.groupId ?? '');
  };

  const syncChatOrder = (nextChats) => {
    const nextOrder = new Map();
    (nextChats || []).forEach((chat, index) => {
      const key = getChatOrderKey(chat);
      if (key) nextOrder.set(key, index);
    });
    chatOrderRef.current = nextOrder;
    return nextChats;
  };

  const loadChats = async () => {
    try {
      const res = await chatApi.fetchChats(authFetch);
      if (res.status === 401) {
        if (typeof logout === 'function') logout();
        return;
      }
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chats) {
          const activeChats = (result.data.chats || []).filter(
            c => !deletedChatIdsRef.current.has(c.id) && !deletedChatIdsRef.current.has(c._id)
          );

          setChats(prevChats => {
            const mapped = [...activeChats].map(c => {
              const isActive = activeChatId && (
                String(c.id) === String(activeChatId) ||
                String(c._id) === String(activeChatId) ||
                (c.groupId && String(c.groupId) === String(activeChatId))
              );
              return isActive ? { ...c, unreadCount: 0, isUnread: false } : c;
            });
            const orderedChats = mapped.sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;

              const aTime = new Date(a.lastMessage?.timestamp ?? a.updatedAt ?? a.createdTime ?? 0).getTime();
              const bTime = new Date(b.lastMessage?.timestamp ?? b.updatedAt ?? b.createdTime ?? 0).getTime();
              return bTime - aTime;
            });

            return syncChatOrder(orderedChats);
          });
        }
      }
    } catch (err) {
      console.error("Failed to load backend chats:", err);
    }
  };

  const loadReports = async () => {
    try {
      const res = await chatApi.fetchReports(authFetch);
      if (res.status === 401) {
        if (typeof logout === 'function') logout();
        return;
      }
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.reports) {
          setReports(result.data.reports);
        }
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  const selectChat = (chatId) => {
    setActiveChatId(chatId);
    setChats(prevChats =>
      prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, unreadCount: 0, isUnread: false } : c))
    );
  };

  const getActiveChat = () => chats.find(c => c.id === activeChatId);

  // Sync browser desktop notification permissions & window title
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    document.title = totalUnread > 0 ? `(${totalUnread}) ChitChat` : "ChitChat";
  }, [chats]);

  // Admin reports effect
  useEffect(() => {
    if (user && user.role === 'Admin') {
      loadReports();
    } else {
      setReports([]);
    }
  }, [user]);

  // Periodic polling for backend chats & active chat messages refresh
  useEffect(() => {
    if (!user) {
      setChats([]);
      if (typeof setMessages === 'function') setMessages([]);
      if (typeof setGroups === 'function') setGroups([]);
      setActiveChatId(null);
      return;
    }

    loadChats();
    if (typeof fetchDbUsers === 'function') fetchDbUsers();
    if (user?.role === 'Admin') loadReports();

    const interval = setInterval(() => {
      loadChats();
      if (typeof fetchDbUsers === 'function') fetchDbUsers();
      if (user?.role === 'Admin') loadReports();
    }, 4000);

    return () => clearInterval(interval);
  }, [user]);

  // Clear unread count when chat becomes active
  useEffect(() => {
    if (activeChatId) {
      setChats(prevChats =>
        prevChats.map(c => (c.id === activeChatId || c.groupId === activeChatId ? { ...c, unreadCount: 0, isUnread: false } : c))
      );
    }
  }, [activeChatId]);

  const createDirectChat = async (userId) => {
    try {
      const res = await chatApi.createDirectChat(authFetch, userId);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chat) {
          const newChat = result.data.chat;
          const chatKey = getChatOrderKey(newChat);
          if (chatKey) {
            deletedChatIdsRef.current.delete(chatKey);
            chatOrderRef.current.delete(chatKey);
          }
          setChats(prev => {
            const filtered = prev.filter(c => getChatOrderKey(c) !== chatKey);
            const updated = [newChat, ...filtered];
            return syncChatOrder(updated);
          });
          setActiveChatId(newChat.id || newChat._id);
          return newChat.id || newChat._id;
        }
      }
    } catch (err) {
      console.error("Failed to create backend direct chat:", err);
    }
  };

  const toggleBlockUserOnBackend = async (targetUserId) => {
    if (!targetUserId) return;
    const targetStr = targetUserId.toString();

    setBlockedUserIds(prev => {
      const prevStrings = (prev || []).map(id => id.toString());
      return prevStrings.includes(targetStr)
        ? prevStrings.filter(id => id !== targetStr)
        : [...prevStrings, targetStr];
    });

    try {
      const res = await chatApi.toggleBlockUser(authFetch, targetStr);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.blockedUsers) {
          setBlockedUserIds(result.data.blockedUsers);
        }
      }
    } catch (err) {
      console.error("Failed to toggle block user:", err);
    }
  };

  const blockUser = (userId) => toggleBlockUserOnBackend(userId);
  const unblockUser = (userId) => toggleBlockUserOnBackend(userId);

  const reportUser = async (reportedUserId, messageText, reason) => {
    try {
      const res = await chatApi.reportUser(authFetch, { reportedUserId, messageText, reason });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.report && user?.role === 'Admin') {
          loadReports();
        }
      }
    } catch (err) {
      console.error("Failed to submit report:", err);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const res = await chatApi.updateReportStatus(authFetch, reportId, newStatus);
      if (res.ok) {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.error("Failed to update report status:", err);
    }
  };

  const togglePinChat = async (chatId) => {
    setChats(prevChats =>
      prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, pinned: !c.pinned } : c))
    );
    try {
      const res = await chatApi.togglePinChat(authFetch, chatId);
      if (res.ok) {
        const result = await res.json();
        if (result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prevChats =>
            prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c))
          );
        }
      }
    } catch (err) {
      console.error("Failed to toggle pin chat:", err);
    }
  };

  const toggleArchiveChat = async (chatId) => {
    setChats(prevChats =>
      prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, archived: !c.archived } : c))
    );
    try {
      const res = await chatApi.toggleArchiveChat(authFetch, chatId);
      if (res.ok) {
        const result = await res.json();
        if (result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prevChats =>
            prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c))
          );
        }
      }
    } catch (err) {
      console.error("Failed to toggle archive chat:", err);
    }
  };

  const toggleFavoriteChat = async (chatId) => {
    setChats(prevChats =>
      prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, favorite: !c.favorite } : c))
    );
    try {
      const res = await chatApi.toggleFavoriteChat(authFetch, chatId);
      if (res.ok) {
        const result = await res.json();
        if (result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prevChats =>
            prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c))
          );
        }
      }
    } catch (err) {
      console.error("Failed to toggle favorite chat:", err);
    }
  };

  const deleteChat = async (chatId) => {
    if (!chatId) return;
    const chatKey = String(chatId);
    deletedChatIdsRef.current.add(chatKey);
    chatOrderRef.current.delete(chatKey);
    if (typeof setMessages === 'function') {
      setMessages(prev => prev.filter(m => m.chatId !== chatId));
    }
    setChats(prevChats => syncChatOrder(prevChats.filter(c => getChatOrderKey(c) !== chatKey)));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
    try {
      const res = await chatApi.deleteChat(authFetch, chatId);
      if (!res.ok) {
        deletedChatIdsRef.current.delete(chatId.toString());
        loadChats();
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
      deletedChatIdsRef.current.delete(chatId.toString());
      loadChats();
    }
  };

  return {
    chats,
    setChats,
    activeChatId,
    setActiveChatId,
    typingUsers,
    setTypingUsers,
    blockedUserIds,
    setBlockedUserIds,
    reports,
    deletedChatIdsRef,
    loadChats,
    selectChat,
    getActiveChat,
    createDirectChat,
    blockUser,
    unblockUser,
    reportUser,
    updateReportStatus,
    togglePinChat,
    toggleArchiveChat,
    toggleFavoriteChat,
    deleteChat
  };
};
