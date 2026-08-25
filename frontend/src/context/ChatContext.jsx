import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useChatSocket } from "../hooks/useChatSocket";
import { useChatMessages } from "../hooks/useChatMessages";
import { useChatOperations } from "../hooks/useChatOperations";
import { useChatGroups } from "../hooks/useChatGroups";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, allUsers, fetchDbUsers, logout, authFetch } = useAuth();

  // Call State
  const [incomingCall, setIncomingCall] = useState(null); // { roomID, callType, callerName, callerAvatar, chatId, fromUserId }
  const [activeCallRoom, setActiveCallRoom] = useState(null); // { roomID, callType, peerUser }

  // 1. Operations Hook (handles chat listing, active chat state, user blocking, reports, pinning/archiving)
  const {
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
    deleteChat,
  } = useChatOperations({ user, authFetch, logout, fetchDbUsers });

  // 2. Messages Hook (handles messages list, sending/editing/deleting messages, pinning, reactions, clearing)
  const {
    messages,
    setMessages,
    getChatMessages,
    sendMessage,
    uploadFile,
    editMessage,
    deleteMessageForMe,
    deleteMessageForEveryone,
    togglePinnedMessage,
    addReaction,
    clearChatMessages,
  } = useChatMessages({
    user,
    authFetch,
    logout,
    activeChatId,
    chats,
    setChats,
  });

  // 3. Groups Hook (handles group creation, admin roles, member updates, join requests)
  const {
    groups,
    setGroups,
    createGroup,
    updateGroup,
    updateGroupProfile,
    updateGroupPermissions,
    handleJoinRequest,
    leaveGroup,
    deleteGroup,
    makeGroupAdmin,
    dismissGroupAdmin,
    removeFromGroup,
    addMembersToGroup,
  } = useChatGroups({
    authFetch,
    logout,
    chats,
    setChats,
    setActiveChatId,
  });

  // Call Signaling Callbacks
  const handleIncomingCall = useCallback((data) => {
    setIncomingCall(data);
  }, []);

  const handleCallAccepted = useCallback((data) => {
    console.log("Call accepted on remote end:", data);
  }, []);

  const handleCallDeclined = useCallback((data) => {
    setActiveCallRoom(null);
  }, []);

  const handleCallEnded = useCallback((data) => {
    setActiveCallRoom(null);
    setIncomingCall(null);
  }, []);

  // 4. Socket Hook (handles real-time WebSocket connection, notifications, typing indicators, calls)
  const socket = useChatSocket({
    user,
    activeChatId,
    chats,
    allUsers,
    deletedChatIdsRef,
    setMessages,
    setChats,
    setGroups,
    setTypingUsers,
    setActiveChatId,
    setBlockedUserIds,
    loadChats,
    selectChat,
    logout,
    onIncomingCall: handleIncomingCall,
    onCallAccepted: handleCallAccepted,
    onCallDeclined: handleCallDeclined,
    onCallEnded: handleCallEnded,
  });

  // Call Methods
  const startCall = useCallback(
    (callType = "video") => {
      const activeChat = chats.find(
        (c) =>
          String(c.id) === String(activeChatId) ||
          String(c._id) === String(activeChatId),
      );
      if (!activeChat || !socket) return;

      const roomID = "call_" + Math.random().toString(36).substring(2, 10);
      const isDirect = activeChat.type === "direct";

      let targetUserId = null;
      let targetParticipantIds = null;
      let peerUser = null;

      if (isDirect) {
        const myId = (user?.id || user?._id)?.toString();
        targetUserId = activeChat.participants?.find(
          (p) => p !== "user_me" && p?.toString() !== myId,
        );
        peerUser = allUsers.find(
          (u) => (u.id || u._id)?.toString() === targetUserId?.toString(),
        );
      } else {
        targetParticipantIds = activeChat.participantIds || activeChat.participants;
      }

      socket.emit("start-call", {
        targetUserId,
        targetParticipantIds,
        roomID,
        callType,
        callerName: user?.name || "User",
        callerAvatar: user?.avatar || "",
        chatId: activeChatId,
        fromUserId: user?.id || user?._id,
      });

      setActiveCallRoom({
        roomID,
        callType,
        peerUser: peerUser || { name: activeChat.name },
      });
    },
    [chats, activeChatId, socket, user, allUsers],
  );

  const acceptCall = useCallback(() => {
    if (!incomingCall || !socket) return;

    socket.emit("accept-call", {
      targetUserId: incomingCall.fromUserId,
      roomID: incomingCall.roomID,
    });

    setActiveCallRoom({
      roomID: incomingCall.roomID,
      callType: incomingCall.callType,
      peerUser: {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      },
    });

    setIncomingCall(null);
  }, [incomingCall, socket]);

  const declineCall = useCallback(() => {
    if (!incomingCall || !socket) return;

    socket.emit("decline-call", {
      targetUserId: incomingCall.fromUserId,
      roomID: incomingCall.roomID,
    });

    setIncomingCall(null);
  }, [incomingCall, socket]);

  const endCall = useCallback(() => {
    if (socket && activeCallRoom) {
      const activeChat = chats.find(
        (c) =>
          String(c.id) === String(activeChatId) ||
          String(c._id) === String(activeChatId),
      );
      const myId = (user?.id || user?._id)?.toString();
      const targetUserId = activeChat?.participants?.find(
        (p) => p !== "user_me" && p?.toString() !== myId,
      );

      socket.emit("end-call", {
        targetUserId,
        targetParticipantIds: activeChat?.type === "group" ? activeChat.participants : null,
        roomID: activeCallRoom.roomID,
      });
    }
    setActiveCallRoom(null);
    setIncomingCall(null);
  }, [socket, activeCallRoom, chats, activeChatId, user]);

  // 5. Memoized provider value for optimal performance and zero unnecessary re-renders
  const value = useMemo(
    () => ({
      chats,
      messages,
      groups,
      activeChatId,
      typingUsers,
      blockedUserIds,
      reports,
      socket,
      incomingCall,
      activeCallRoom,
      startCall,
      acceptCall,
      declineCall,
      endCall,
      selectChat,
      getActiveChat,
      getChatMessages,
      sendMessage,
      uploadFile,
      editMessage,
      deleteMessage: deleteMessageForEveryone,
      deleteMessageForMe,
      deleteMessageForEveryone,
      togglePinnedMessage,
      addReaction,
      createDirectChat,
      createGroup,
      updateGroup,
      updateGroupProfile,
      updateGroupPermissions,
      handleJoinRequest,
      leaveGroup,
      deleteGroup,
      blockUser,
      unblockUser,
      reportUser,
      updateReportStatus,
      makeGroupAdmin,
      dismissGroupAdmin,
      removeFromGroup,
      addMembersToGroup,
      togglePinChat,
      toggleArchiveChat,
      toggleFavoriteChat,
      clearChatMessages,
      deleteChat,
    }),
    [
      chats,
      messages,
      groups,
      activeChatId,
      typingUsers,
      blockedUserIds,
      reports,
      socket,
      incomingCall,
      activeCallRoom,
      startCall,
      acceptCall,
      declineCall,
      endCall,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
