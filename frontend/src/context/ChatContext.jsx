import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useChatSocket } from '../hooks/useChatSocket';
import { useChatMessages } from '../hooks/useChatMessages';
import { useChatOperations } from '../hooks/useChatOperations';
import { useChatGroups } from '../hooks/useChatGroups';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, allUsers, fetchDbUsers, logout, authFetch } = useAuth();

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
    toggleUnreadChat,
    clearChatMessages,
    deleteChat
  } = useChatOperations({ user, authFetch, logout, fetchDbUsers });

  // 2. Messages Hook (handles messages list, sending/editing/deleting messages, pinning, reactions, starring)
  const {
    messages,
    setMessages,
    starredMsgIds,
    toggleStarMessage,
    clearAllStarredMessages,
    getChatMessages,
    sendMessage,
    uploadFile,
    editMessage,
    deleteMessageForMe,
    deleteMessageForEveryone,
    togglePinnedMessage,
    addReaction
  } = useChatMessages({
    user,
    authFetch,
    logout,
    activeChatId,
    chats,
    setChats
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
    addMembersToGroup
  } = useChatGroups({
    authFetch,
    logout,
    chats,
    setChats,
    setActiveChatId
  });

  // 4. Socket Hook (handles real-time WebSocket connection, notifications, typing indicators)
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
    logout
  });

  // 5. Memoized provider value for optimal performance and zero unnecessary re-renders
  const value = useMemo(() => ({
    chats,
    messages,
    groups,
    activeChatId,
    typingUsers,
    blockedUserIds,
    reports,
    socket,
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
    toggleUnreadChat,
    clearChatMessages,
    deleteChat,
    starredMsgIds,
    toggleStarMessage,
    clearAllStarredMessages
  }), [
    chats, messages, groups, activeChatId, typingUsers, blockedUserIds, reports, socket, starredMsgIds
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
