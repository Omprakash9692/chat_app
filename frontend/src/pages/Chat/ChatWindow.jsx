import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ChatHeaderBar } from './components/ChatHeaderBar';
import { PinnedMessagesBar } from './components/PinnedMessagesBar';
import { MessageBubble } from './components/MessageBubble';
import { ChatInputBar } from './components/ChatInputBar';
import { ForwardMessageModal, PinDurationModal } from './components/ChatModals';
import { Modal, Button, MessageInfoPanel } from '../../components/ui/ui';

const getMsgDateKey = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const formatDateSeparator = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
};

export const ChatWindow = ({ toggleRightSidebar, isRightSidebarOpen, onBack }) => {
  const {
    chats, activeChatId, getActiveChat, getChatMessages, sendMessage, uploadFile,
    editMessage, deleteMessage, deleteMessageForMe, deleteMessageForEveryone, togglePinnedMessage, addReaction, typingUsers, groups,
    blockUser, unblockUser, reportUser, socket, blockedUserIds, selectChat, starredMsgIds, toggleStarMessage
  } = useChat();
  const { user, allUsers } = useAuth();
  const { showToast } = useNotifications();

  // Scroll management
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const prevLastMessageIdRef = useRef(null);
  const prevActiveChatIdRef = useRef(null);
  const prevTypingUsersCountRef = useRef(0);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const [inputText, setInputText] = useState('');
  const [replyMessage, setReplyMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [searchInChatQuery, setSearchInChatQuery] = useState('');
  const [showSearchInChat, setShowSearchInChat] = useState(false);

  // Pin Duration Modal states
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [targetPinMessage, setTargetPinMessage] = useState(null);
  const [selectedDurationHours, setSelectedDurationHours] = useState(168);

  // Delete Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeleteMessage, setTargetDeleteMessage] = useState(null);

  // Media uploads states
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [uploadingFileType, setUploadingFileType] = useState('image');
  const [pendingAttachment, setPendingAttachment] = useState(null);

  useEffect(() => {
    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }
    setPendingAttachment(null);
  }, [activeChatId]);

  // Message Info panel state (group chats only)
  const [msgInfoTarget, setMsgInfoTarget] = useState(null);

  // Message dropdown menu states
  const [activeMsgMenuId, setActiveMsgMenuId] = useState(null);
  const [showEmojiPickerMsgId, setShowEmojiPickerMsgId] = useState(null);
  const [showFullEmojiPickerMsgId, setShowFullEmojiPickerMsgId] = useState(null);
  const msgMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutsideMsgMenu = (e) => {
      if (msgMenuRef.current && !msgMenuRef.current.contains(e.target)) {
        setActiveMsgMenuId(null);
        setShowEmojiPickerMsgId(null);
        setShowFullEmojiPickerMsgId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideMsgMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideMsgMenu);
  }, []);

  const handleToggleStarMsg = (msgId) => {
    const isStarred = starredMsgIds.includes(msgId);
    toggleStarMessage(msgId);
    showToast(isStarred ? "Message Unstarred" : "Message Starred", isStarred ? "Removed from starred" : "Saved to starred messages", "info");
  };

  const handleCopyMsgText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("Copied to Clipboard", "Message text copied", "success");
  };

  const activeChat = getActiveChat();
  if (!activeChat) return null;

  const myRealId = user?.id?.toString() || user?._id?.toString();
  const isDirect = activeChat.type === 'direct';

  const getPId = (p) => {
    if (!p) return null;
    if (typeof p === 'string') return p;
    return (p._id || p.id)?.toString() || p.toString();
  };

  const recipientParticipant = isDirect
    ? activeChat.participants?.find(p => {
      const pId = getPId(p);
      return pId && pId !== 'user_me' && pId !== myRealId;
    })
    : null;

  const recipientId = getPId(recipientParticipant);
  const recipient = isDirect && recipientId
    ? allUsers.find(u => (u.id || u._id)?.toString() === recipientId)
    : null;

  const group = !isDirect
    ? groups.find(g => g.id === activeChat.groupId || g.id === activeChat.id)
    : null;

  const targetUnblockId = recipientId || recipient?.id?.toString() || recipient?._id?.toString();
  const isBlocked = isDirect && targetUnblockId && (
    (blockedUserIds || []).map(id => id.toString()).includes(targetUnblockId.toString())
  );
  const isGroupBlocked = !isDirect && (activeChat?.isBlocked || group?.isBlocked);

  const amIAdmin = !isDirect && group && (group?.adminIds || []).some(
    id => id === 'user_me' || id === myRealId
  );
  const isMessagingRestricted = !isDirect && group && !amIAdmin && (group?.permissions?.sendMessages === false);

  const [isRecording, setIsRecording] = useState(false);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (isTypingRef.current && socket) {
        const oldChat = getActiveChat();
        if (oldChat) {
          const oldIsDirect = oldChat.type === 'direct';
          const payload = { fromUserId: user.id || user._id, chatId: activeChatId };
          if (oldIsDirect) {
            const oldRecipientId = oldChat.participants.find(p => p !== 'user_me');
            if (oldRecipientId) payload.toUserId = oldRecipientId;
          } else {
            const oldGroup = groups.find(g => g.id === oldChat.groupId);
            if (oldGroup) payload.participantIds = oldGroup.memberIds;
          }
          socket.emit("stop-typing", payload);
        }
      }
      isTypingRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeChatId, socket, groups, user, getActiveChat]);

  const [recordTimer, setRecordTimer] = useState(0);
  const recordIntervalRef = useRef(null);

  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👀"];

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const attachmentMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) setShowEmojiPicker(false);
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) setShowAttachmentMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const messages = getChatMessages(activeChatId);
  const lastMessageId = messages[messages.length - 1]?.id;
  const typingUsersCount = typingUsers[activeChatId]?.length || 0;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const chatSwitched = prevActiveChatIdRef.current !== activeChatId;
    const lastMsg = messages[messages.length - 1];
    const newMsgArrived = lastMsg && prevLastMessageIdRef.current !== lastMsg.id;
    const typingIncreased = typingUsersCount > prevTypingUsersCountRef.current;

    prevActiveChatIdRef.current = activeChatId;
    prevLastMessageIdRef.current = lastMsg ? lastMsg.id : null;
    prevTypingUsersCountRef.current = typingUsersCount;

    if (chatSwitched) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
      return;
    }

    const threshold = 150;
    const isCloseToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    if (newMsgArrived) {
      const isMe = lastMsg.senderId === 'user_me';
      if (isMe || isCloseToBottom) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } else if (typingIncreased && isCloseToBottom) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [activeChatId, lastMessageId, messages.length, typingUsersCount]);

  useEffect(() => {
    if (isRecording) {
      setRecordTimer(0);
      recordIntervalRef.current = setInterval(() => setRecordTimer(prev => prev + 1), 1000);
    } else if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }
    return () => { if (recordIntervalRef.current) clearInterval(recordIntervalRef.current); };
  }, [isRecording]);

  const formatLastSeen = (lastSeenTime) => {
    if (!lastSeenTime) return "Offline";
    const date = new Date(lastSeenTime);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return "Just left";
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  const chatTitle = isDirect ? recipient?.name : group?.name;
  const chatSubtitle = isDirect
    ? (recipient?.isOnline ? 'Active now' : formatLastSeen(recipient?.lastSeen))
    : `${group?.memberIds?.length || 0} participants`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.start();
      setIsRecording(true);
      showToast("Voice Recorder", "Recording voice message...", "info");
    } catch (err) {
      console.error("Microphone access denied:", err);
      showToast("Access Denied", "Could not access microphone.", "error");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const durationMin = Math.floor(recordTimer / 60);
      const durationSec = (recordTimer % 60).toString().padStart(2, '0');
      const finalDuration = `${durationMin}:${durationSec}`;
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });

      showToast("Sending Voice Note", "Uploading voice message...", "info");
      const uploaded = await uploadFile(audioFile);
      if (uploaded) {
        sendMessage(activeChatId, '', 'audio', { attachmentUrl: uploaded.url, attachmentDuration: finalDuration });
        showToast("Voice Sent", `Voice note (${finalDuration}) sent.`, "success");
      } else {
        showToast("Error", "Failed to upload voice note.", "error");
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    showToast("Recording Canceled", "Voice note discarded.", "warning");
  };

  const handleDownloadFile = async (e, url, name) => {
    e.preventDefault();
    if (!url || url === '#') {
      showToast("File Saved", "Mock download initiated.", "success");
      return;
    }
    try {
      showToast("Downloading File", "Preparing download...", "info");
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast("Download Complete", "File saved to your device", "success");
    } catch (error) {
      console.error("Direct download failed, opening in new tab:", error);
      window.open(url, '_blank', 'noopener,noreferrer');
      showToast("Opening File", "Opened file in new window", "info");
    }
  };

  const emitTyping = (isTyping) => {
    if (!socket || !activeChat) return;
    const payload = { fromUserId: user.id || user._id, chatId: activeChatId };
    if (isDirect) { if (recipient) payload.toUserId = recipient.id; }
    else { if (group) payload.participantIds = group.memberIds; }
    socket.emit(isTyping ? "typing" : "stop-typing", payload);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emitTyping(false);
    }, 3000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const handleRemovePendingAttachment = () => {
    if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
    setPendingAttachment(null);
  };

  const handleImageSelection = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingAttachment({ file, previewUrl: URL.createObjectURL(file), type: 'image', name: file.name, size: formatFileSize(file.size) });
    setUploadingFileType('image');
    e.target.value = '';
  };

  const handleFileSelection = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    setPendingAttachment({ file, previewUrl: isImage ? URL.createObjectURL(file) : null, type: isImage ? 'image' : 'file', name: file.name, size: formatFileSize(file.size) });
    setUploadingFileType(isImage ? 'image' : 'file');
    e.target.value = '';
  };

  const handleSimulateAttachment = (type) => {
    setShowAttachmentMenu(false);
    if (type === 'image') imageInputRef.current?.click();
    else if (type === 'pdf') fileInputRef.current?.click();
  };

  const handleSend = async () => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTyping(false);
    }

    if (!inputText.trim() && !pendingAttachment) return;

    if (editingMessage) {
      const cleanNew = inputText.trim();
      const cleanOld = (editingMessage.text || "").trim();
      if (cleanNew !== cleanOld) {
        editMessage(editingMessage.id, cleanNew);
        showToast("Message Edited", "Your message was updated.", "info");
      }
      setEditingMessage(null);
      setInputText('');
      return;
    }

    let attachmentData = null;
    let messageType = 'text';

    if (pendingAttachment) {
      setIsUploadingAttachment(true);
      setUploadingFileName(pendingAttachment.name);
      setUploadingFileType(pendingAttachment.type);

      try {
        const uploaded = await uploadFile(pendingAttachment.file);
        if (uploaded) {
          attachmentData = {
            attachmentUrl: uploaded.url,
            attachmentName: uploaded.name || pendingAttachment.name,
            attachmentSize: formatFileSize(uploaded.size || pendingAttachment.file.size)
          };
          messageType = pendingAttachment.type;
        } else {
          showToast("Upload Failed", "Could not upload file attachment.", "error");
          setIsUploadingAttachment(false);
          return;
        }
      } catch (err) {
        console.error("Attachment upload error:", err);
        showToast("Upload Error", "Failed to upload media.", "error");
        setIsUploadingAttachment(false);
        return;
      } finally {
        setIsUploadingAttachment(false);
      }
    }

    sendMessage(activeChatId, inputText.trim(), messageType, attachmentData, replyMessage?.id);
    if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
    setPendingAttachment(null);
    if (replyMessage) setReplyMessage(null);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredMessages = messages.filter(m => {
    if (!searchInChatQuery) return true;
    return m.text && m.text.toLowerCase().includes(searchInChatQuery.toLowerCase());
  });

  const getSenderProfile = (senderId) => {
    if (senderId === 'user_me' || senderId === user?.id || senderId === user?._id) {
      return { name: 'You', avatar: user?.avatar, avatarColor: user?.avatarColor || 'from-[#008069] to-[#00a884]' };
    }
    const found = allUsers.find(u => u.id === senderId || u._id === senderId);
    if (found) return found;
    return { name: 'User', avatar: null, avatarColor: 'from-[#54656f] to-[#667781]' };
  };

  const handleTogglePinMessage = (msg) => {
    const currentPins = activeChat?.pinnedMessageIds || [];
    const isCurrentlyPinned = currentPins.some(p => p.id === msg.id);

    if (isCurrentlyPinned) {
      togglePinnedMessage(activeChatId, msg.id);
      showToast("Message Unpinned", "Pinned message removed.", "info");
    } else {
      setTargetPinMessage(msg);
      setSelectedDurationHours(168);
      setPinModalOpen(true);
    }
  };

  const confirmPinMessage = () => {
    if (!targetPinMessage) return;
    togglePinnedMessage(activeChatId, targetPinMessage.id, selectedDurationHours);
    showToast("Message Pinned", "Message pinned successfully.", "success");
    setPinModalOpen(false);
    setTargetPinMessage(null);
  };

  const handleSendForward = (selectedChatIds) => {
    if (!forwardMessage || selectedChatIds.length === 0) return;
    selectedChatIds.forEach(targetId => {
      sendMessage(targetId, forwardMessage.text || '', forwardMessage.type, {
        attachmentUrl: forwardMessage.attachmentUrl,
        attachmentName: forwardMessage.attachmentName,
        attachmentSize: forwardMessage.attachmentSize,
        isForwarded: true
      });
    });
    showToast("Message Forwarded", `Forwarded to ${selectedChatIds.length} chat(s).`, "success");
    setForwardMessage(null);
  };

  const pinnedMessageIds = activeChat?.pinnedMessageIds || [];
  const pinnedMessages = pinnedMessageIds
    .map(p => {
      const msg = messages.find(m => m.id === p.id);
      return msg ? { ...msg, pinnedUntil: p.pinnedUntil } : null;
    })
    .filter(Boolean);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#efeae2] relative font-sans select-text">

      {/* Top Header Bar */}
      <ChatHeaderBar
        chatTitle={chatTitle} chatSubtitle={chatSubtitle} isDirect={isDirect} recipient={recipient} group={group}
        showSearchInChat={showSearchInChat} setShowSearchInChat={setShowSearchInChat} isRightSidebarOpen={isRightSidebarOpen}
        toggleRightSidebar={toggleRightSidebar} onBack={onBack} selectChat={selectChat}
      />

      {/* Multi-Pin Banner */}
      <PinnedMessagesBar pinnedMessages={pinnedMessages} handleTogglePinMessage={handleTogglePinMessage} />

      {/* Embedded Search Box in active chat */}
      <AnimatePresence>
        {showSearchInChat && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white/88 border-b border-slate-200 shrink-0">
            <div className="max-w-3xl md:max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-3 w-full">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text" autoFocus placeholder="Search words within this chat history..." value={searchInChatQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInChatQuery(val);
                  if (val === '') setShowSearchInChat(false);
                }}
                className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-800"
              />
              {searchInChatQuery && (
                <button onClick={() => { setSearchInChatQuery(''); setShowSearchInChat(false); }} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase">Clear</button>
              )}
              <button onClick={() => { setShowSearchInChat(false); setSearchInChatQuery(''); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Window timeline scroll */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar bg-whatsapp-wallpaper">
        <div className="max-w-3xl md:max-w-4xl mx-auto px-2.5 py-3 sm:p-4 space-y-3.5 w-full">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-450 dark:text-slate-500 text-xs py-20">
              {searchInChatQuery ? "No search results match." : "No messages. Send a message to start conversation."}
            </div>
          ) : (
            filteredMessages.map((msg, index) => {
              const isMe = msg.senderId === 'user_me' || msg.senderId === myRealId;
              const sender = getSenderProfile(msg.senderId);
              const replyCtx = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;
              const currentDateKey = getMsgDateKey(msg.timestamp);
              const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
              const prevDateKey = prevMsg ? getMsgDateKey(prevMsg.timestamp) : null;
              const showDateSeparator = currentDateKey !== prevDateKey;

              return (
                <React.Fragment key={msg.id || index}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-3 select-none w-full">
                      <span className="px-3 py-1 rounded-lg bg-white text-[#667781] text-[11px] font-semibold tracking-wide shadow-xs border border-slate-200/40 uppercase">
                        {formatDateSeparator(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    msg={msg} index={index} filteredMessagesCount={filteredMessages.length} isMe={isMe} sender={sender} activeChat={activeChat}
                    replyCtx={replyCtx} starredMsgIds={starredMsgIds} handleCopyMsgText={handleCopyMsgText} handleToggleStarMsg={handleToggleStarMsg}
                    setReplyMessage={setReplyMessage} setEditingMessage={setEditingMessage} setInputText={setInputText} setForwardMessage={setForwardMessage}
                    handleTogglePinMessage={handleTogglePinMessage} handleDownloadFile={handleDownloadFile} setLightboxImage={setLightboxImage}
                    setMsgInfoTarget={setMsgInfoTarget} setTargetDeleteMessage={setTargetDeleteMessage} setDeleteModalOpen={setDeleteModalOpen}
                    addReaction={addReaction} quickEmojis={quickEmojis} activeMsgMenuId={activeMsgMenuId} setActiveMsgMenuId={setActiveMsgMenuId}
                    showEmojiPickerMsgId={showEmojiPickerMsgId} setShowEmojiPickerMsgId={setShowEmojiPickerMsgId} showFullEmojiPickerMsgId={showFullEmojiPickerMsgId}
                    setShowFullEmojiPickerMsgId={setShowFullEmojiPickerMsgId} msgMenuRef={msgMenuRef} reportUser={reportUser} getSenderProfile={getSenderProfile} showToast={showToast}
                  />
                </React.Fragment>
              );
            })
          )}

          {/* Typing indicator bubble */}
          {typingUsers[activeChatId] && typingUsers[activeChatId].length > 0 && (
            <div className="flex gap-3 mr-auto items-start max-w-[70%]">
              <Avatar src={recipient?.avatar} name={chatTitle} size="sm" color={recipient?.avatarColor} />
              <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-white border border-slate-250 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Text Input Bar area */}
      <ChatInputBar
        inputText={inputText} setInputText={setInputText} handleInputChange={handleInputChange} handleKeyPress={handleKeyPress} handleSend={handleSend}
        replyMessage={replyMessage} setReplyMessage={setReplyMessage} editingMessage={editingMessage} setEditingMessage={setEditingMessage}
        isRecording={isRecording} startRecording={startRecording} stopRecording={stopRecording} cancelRecording={cancelRecording} recordTimer={recordTimer}
        showEmojiPicker={showEmojiPicker} setShowEmojiPicker={setShowEmojiPicker} emojiPickerRef={emojiPickerRef} showAttachmentMenu={showAttachmentMenu}
        setShowAttachmentMenu={setShowAttachmentMenu} attachmentMenuRef={attachmentMenuRef} handleSimulateAttachment={handleSimulateAttachment}
        pendingAttachment={pendingAttachment} handleRemovePendingAttachment={handleRemovePendingAttachment} isUploadingAttachment={isUploadingAttachment}
        uploadingFileName={uploadingFileName} uploadingFileType={uploadingFileType} imageInputRef={imageInputRef} fileInputRef={fileInputRef}
        handleImageSelection={handleImageSelection} handleFileSelection={handleFileSelection} isBlocked={isBlocked} isGroupBlocked={isGroupBlocked}
        isMessagingRestricted={isMessagingRestricted} targetUnblockId={targetUnblockId} unblockUser={unblockUser} recipient={recipient} showToast={showToast} getSenderProfile={getSenderProfile}
      />

      {/* Full image lightbox modal view */}
      <Modal isOpen={!!lightboxImage} onClose={() => setLightboxImage(null)} title="Image Preview" size="lg">
        <div className="flex flex-col items-center justify-center p-2">
          {lightboxImage && (
            <img src={lightboxImage} alt="Lightbox View" className="max-h-[60vh] max-w-full rounded-lg object-contain border-0 shadow-lg" />
          )}
          <div className="mt-4 flex gap-3 w-full justify-end">
            <Button variant="outline" onClick={() => setLightboxImage(null)}>Close</Button>
            <Button onClick={(e) => handleDownloadFile(e, lightboxImage, lightboxImage.split('/').pop())}>Download file</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Message Options Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setTargetDeleteMessage(null); }} title="Delete Message" size="sm">
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Choose whether to delete this message for everyone or only for yourself.</p>
          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                if (targetDeleteMessage) {
                  deleteMessageForMe(targetDeleteMessage.id);
                  showToast("Message Deleted", "Message deleted for you.", "info");
                }
                setDeleteModalOpen(false);
                setTargetDeleteMessage(null);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Delete for Me
            </button>

            {targetDeleteMessage && (targetDeleteMessage.senderId === 'user_me' || targetDeleteMessage.senderId === myRealId) && (
              <button
                onClick={() => {
                  deleteMessageForEveryone(targetDeleteMessage.id);
                  showToast("Message Deleted", "Message deleted for everyone in this chat.", "info");
                  setDeleteModalOpen(false);
                  setTargetDeleteMessage(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Delete for Everyone
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Forward Message Modal */}
      <ForwardMessageModal
        forwardMessage={forwardMessage} chats={chats} allUsers={allUsers} user={user}
        onClose={() => setForwardMessage(null)} onSendForward={handleSendForward}
      />

      {/* Pin Duration Selection Modal */}
      <PinDurationModal
        isOpen={pinModalOpen} onClose={() => { setPinModalOpen(false); setTargetPinMessage(null); }}
        selectedDurationHours={selectedDurationHours} setSelectedDurationHours={setSelectedDurationHours} onConfirmPin={confirmPinMessage}
      />

      {/* Message Info Side Panel (Group Admin / Message Details) */}
      {msgInfoTarget && (
        <MessageInfoPanel message={msgInfoTarget} group={group} allUsers={allUsers} onClose={() => setMsgInfoTarget(null)} />
      )}
    </div>
  );
};

export default ChatWindow;

