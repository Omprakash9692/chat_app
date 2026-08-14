import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Plus, Check, Users, MessageSquare, MoreVertical,
  X, Mail, UserPlus, Archive, Trash2, Eraser
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar, Badge, BrandLogo } from '../../components/ui/ui';
import { NewContactModal } from './components/NewContactModal';
import { CreateGroupModal } from './components/CreateGroupModal';

export const SidebarLeft = ({ closeMobileSidebar }) => {
  const {
    chats, groups, selectChat, activeChatId, createGroup, createDirectChat, uploadFile,
    togglePinChat, toggleArchiveChat, toggleFavoriteChat, clearChatMessages, deleteChat
  } = useChat();
  const { user, allUsers } = useAuth();
  const { showToast } = useNotifications();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'favorites' | 'groups' | 'archived'

  // Context menu state for chat items
  const [openMenuChatId, setOpenMenuChatId] = useState(null);
  const menuContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setOpenMenuChatId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Floating plus menu state
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // Modal open states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);

  // Fetch target info of a direct chat (recipient user profile)
  const getDirectChatInfo = (chat) => {
    if (!chat || !chat.participants) {
      return { name: chat?.name || "Unknown User", status: "offline", avatar: "", avatarColor: "from-slate-500 to-slate-600" };
    }
    const myIdStr = user?._id?.toString() || user?.id;
    const recipientId = chat.participants.find(p => {
      const pStr = typeof p === 'object' ? (p._id?.toString() || p.id) : String(p);
      return pStr !== 'user_me' && pStr !== myIdStr;
    });
    const recipient = allUsers.find(u => u.id === recipientId || u._id?.toString() === recipientId);
    if (!recipient) {
      return { name: chat.name || "Unknown User", status: "offline", avatar: "", avatarColor: "from-slate-500 to-slate-600" };
    }
    return {
      name: recipient.name || chat.name || "Unknown User",
      ...recipient,
      status: recipient.isOnline ? 'online' : 'offline'
    };
  };

  // Fetch target info of a group chat
  const getGroupChatInfo = (chat) => {
    if (!chat) return { name: "Unknown Group", description: "", avatar: "", avatarColor: "from-indigo-650 to-indigo-650" };
    const group = groups.find(g => g.id === chat.groupId || g.id === chat.id);
    return {
      name: group?.name || chat.name || "Unknown Group",
      description: group?.description || chat.description || "",
      avatar: group?.avatar || chat.avatar || "",
      avatarColor: group?.avatarColor || chat.avatarColor || "from-indigo-650 to-indigo-650"
    };
  };

  // Get last message text snippet
  const getLastMessageText = (chat) => {
    if (chat.lastMessage) {
      const msg = chat.lastMessage;
      if (msg.isDeleted) return "This message was deleted.";
      if (msg.type === 'image') return "📷 Photo";
      if (msg.type === 'audio') return "🎤 Voice message";
      if (msg.type === 'file') return `📄 ${msg.attachmentName || 'Document'}`;
      return msg.text || (msg.attachmentUrl ? "📎 Attachment" : "");
    }
    return "No messages yet";
  };

  // Handle direct chat creation from new contact modal
  const handleStartDirectChat = async (targetUser) => {
    setIsNewContactModalOpen(false);
    const targetUserId = targetUser.id || targetUser._id?.toString();

    // Check if chat already exists
    const existing = chats.find(c => c.type === 'direct' && c.participants.includes(targetUserId));
    if (existing) {
      selectChat(existing.id);
      if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
      return;
    }

    const newChatId = await createDirectChat(targetUserId);
    if (newChatId) {
      selectChat(newChatId);
      showToast("Chat Started", `Conversation started with ${targetUser.name}`, "success");
      if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
    }
  };

  // Filter conversations list
  const filteredChats = chats.filter(chat => {
    if (!chat) return false;
    // 1. Search Query filter
    const info = chat.type === 'group' ? getGroupChatInfo(chat) : getDirectChatInfo(chat);
    const title = (info?.name || chat?.name || '').toString();
    const query = (searchQuery || '').toString().toLowerCase();
    const matchesSearch = title.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // 2. Active Tab filter
    if (activeFilter === 'archived') return !!chat.archived;
    if (chat.archived) return false; // Hide archived chats from normal tabs

    if (activeFilter === 'unread') return (chat.unreadCount > 0) || !!chat.isUnread;
    if (activeFilter === 'favorites') return !!chat.favorite;
    if (activeFilter === 'groups') return chat.type === 'group';

    return true;
  });

  // Sort chats: pinned chats first, then by last message timestamp or update time
  const sortedChats = [...filteredChats].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const timeA = new Date(a.lastMessage?.timestamp || a.updatedAt || a.createdTime || 0).getTime();
    const timeB = new Date(b.lastMessage?.timestamp || b.updatedAt || b.createdTime || 0).getTime();
    return timeB - timeA;
  });

  const archivedCount = chats.filter(c => c.archived).length;
  const unreadTotal = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <>
      <div className="flex flex-col h-full bg-[#ffffff] select-none relative w-full border-r border-slate-200/80">

        {/* 1. Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#ffffff] border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showSubtitle={false} />
          </div>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="p-3 bg-[#ffffff] border-b border-slate-200/80 space-y-2.5">
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 h-4 w-4 my-auto" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-xl bg-[#f0f4f8] border border-slate-200/80 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-xs py-2 pl-9 pr-8 outline-none text-slate-800 placeholder-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 my-auto cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-slate-600">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread', badge: unreadTotal },
              { id: 'favorites', label: 'Favorites' },
              { id: 'groups', label: 'Groups' },
              { id: 'archived', label: 'Archived', badge: archivedCount }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 border ${activeFilter === f.id
                  ? 'bg-[#008069] text-white border-[#008069] shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 border-slate-200/80 hover:bg-slate-200/60'
                  }`}
              >
                <span>{f.label}</span>
                {f.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${activeFilter === f.id ? 'bg-white text-[#008069]' : 'bg-[#008069] text-white'
                    }`}>
                    {f.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
          {sortedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-64">
              <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-xs font-semibold">No conversations found</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {searchQuery ? "Try a different search term" : "Click '+' to start a new chat"}
              </p>
            </div>
          ) : (
            sortedChats.map(chat => {
              const isGroup = chat.type === 'group';
              const info = isGroup ? getGroupChatInfo(chat) : getDirectChatInfo(chat);
              const isActive = activeChatId === chat.id;
              const isMenuOpen = openMenuChatId === chat.id;
              const lastText = getLastMessageText(chat);
              const isUnread = (chat.unreadCount > 0) || !!chat.isUnread;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    selectChat(chat.id);
                    if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                  }}
                  className={`group relative flex items-center justify-between p-3.5 cursor-pointer transition-all border-l-3 ${isActive
                    ? 'bg-[#f0f4f8] border-l-[#008069]'
                    : 'bg-white hover:bg-slate-50/80 border-l-transparent'
                    }`}
                >
                  {/* Left info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={info.avatar}
                        name={info.name}
                        size="md"
                        status={!isGroup ? (info.isOnline ? 'online' : 'offline') : undefined}
                        color={info.avatarColor}
                      />
                      {isGroup && (
                        <div className="absolute -bottom-1 -right-1 bg-[#008069] text-white p-0.5 rounded-full border border-white">
                          <Users className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs font-bold truncate ${isActive ? 'text-[#008069]' : 'text-slate-800'}`}>
                          {info.name}
                        </h4>
                        {chat.lastMessage && (
                          <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
                            {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className={`text-[11px] truncate flex-1 ${isUnread ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}`}>
                          {lastText}
                        </p>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {chat.pinned && (
                            <span className="text-amber-500 text-[10px]" title="Pinned Chat">📌</span>
                          )}
                          {chat.favorite && (
                            <span className="text-amber-400 text-[10px]" title="Favorite Chat">⭐</span>
                          )}
                          {isUnread && (
                            <Badge variant="unread" className="h-5 min-w-[1.25rem] text-[10px] px-1.5 flex-shrink-0">
                              {chat.unreadCount || 1}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Context Menu Trigger */}
                  <div className="relative ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuChatId(isMenuOpen ? null : chat.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Context Dropdown Menu */}
                    {isMenuOpen && (
                      <div
                        ref={menuContainerRef}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-40 text-xs font-semibold text-slate-700 space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          onClick={() => { togglePinChat(chat.id); setOpenMenuChatId(null); }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                        >
                          <span>{chat.pinned ? '📌 Unpin Chat' : '📌 Pin Chat'}</span>
                        </button>
                        <button
                          onClick={() => { toggleFavoriteChat(chat.id); setOpenMenuChatId(null); }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                        >
                          <span>{chat.favorite ? '⭐ Remove Favorite' : '⭐ Mark Favorite'}</span>
                        </button>
                        <button
                          onClick={() => { toggleArchiveChat(chat.id); setOpenMenuChatId(null); }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2 cursor-pointer text-slate-600"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          <span>{chat.archived ? 'Unarchive' : 'Archive'}</span>
                        </button>
                        <button
                          onClick={() => { clearChatMessages(chat.id); setOpenMenuChatId(null); }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2 cursor-pointer text-amber-600"
                        >
                          <Eraser className="h-3.5 w-3.5" />
                          <span>Clear Messages</span>
                        </button>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button
                          onClick={() => { deleteChat(chat.id); setOpenMenuChatId(null); }}
                          className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 cursor-pointer text-rose-600 font-bold"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Floating Action Button (+) */}
        <div className="absolute bottom-5 right-5 z-30">
          {isPlusMenuOpen && (
            <div className="mb-3 space-y-2 flex flex-col items-end animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => { setIsPlusMenuOpen(false); setIsGroupModalOpen(true); }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-lg text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
              >
                <span>New Group</span>
                <Users className="h-4 w-4 text-[#008069]" />
              </button>
              <button
                onClick={() => { setIsPlusMenuOpen(false); setIsNewContactModalOpen(true); }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-lg text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
              >
                <span>New Direct Message</span>
                <UserPlus className="h-4 w-4 text-[#008069]" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
            className={`h-13 w-13 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform active:scale-95 cursor-pointer ${isPlusMenuOpen ? 'bg-slate-800 rotate-45' : 'bg-gradient-to-r from-[#008069] to-[#00a884] hover:scale-105'
              }`}
            title="Create New Chat or Group"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

      </div>

      {/* Reusable Modals */}
      <NewContactModal
        isOpen={isNewContactModalOpen}
        onClose={() => setIsNewContactModalOpen(false)}
        allUsers={allUsers}
        user={user}
        handleStartDirectChat={handleStartDirectChat}
      />

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        allUsers={allUsers}
        user={user}
        uploadFile={uploadFile}
        createGroup={createGroup}
        showToast={showToast}
      />
    </>
  );
};

export default SidebarLeft;
