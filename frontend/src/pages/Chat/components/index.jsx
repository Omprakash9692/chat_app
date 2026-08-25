/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "emoji-picker-react";
import {
  ArrowLeft,
  Search,
  Info,
  X,
  Forward,
  Pin,
  Camera,
  ChevronRight,
  Users,
  ChevronDown,
  MessageSquare,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Check,
  ImageIcon,
  FileText,
  Link as LinkIcon,
  Download,
  AlertTriangle,
  Play,
  Pause,
  Send,
  Smile,
  Mic,
  Reply,
  Edit2,
  UserX,
  Lock,
  Plus,
  Loader2,
  CheckCheck,
  Copy,
  Trash2,
  Phone,
  Video,
} from "lucide-react";
import {
  Avatar,
  Modal,
  Tabs,
  Button,
  Tooltip,
} from "../../../components/ui/ui";

//  UTILITY FUNCTIONS & HELPERS
const getMsgDateKey = (dateString) => {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const formatDateSeparator = (dateString) => {
  const d = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const renderTextWithLinks = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline underline-offset-2 hover:text-blue-600 break-all relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
};

const filterCandidateUsers = (
  allUsers,
  currentUserId,
  query,
  excludeIds = [],
) => {
  const q = (query || "").toLowerCase();
  return allUsers.filter((u) => {
    if (!u) return false;
    const uId = u.id || u._id?.toString();
    const isAdmin = u.role === "admin" || u.role === "Admin";
    const nameStr = (u.name || "").toLowerCase();
    return (
      !excludeIds.includes(uId) &&
      uId !== "user_me" &&
      uId !== currentUserId &&
      !isAdmin &&
      (nameStr.includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)))
    );
  });
};

//  SIMULATED VOICE PLAYER
export const SimulatedVoicePlayer = ({ duration, url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  // Parse total duration seconds from prop string (e.g. "0:03" -> 3)
  const parseDurationSec = (durStr) => {
    if (!durStr) return 0;
    const parts = String(durStr).split(":").map(Number);
    if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
    if (parts.length === 1) return parts[0] || 0;
    return 0;
  };

  const propDurationSec = parseDurationSec(duration);

  useEffect(() => {
    if (url && url !== "#") {
      const audio = new Audio(url);
      audioRef.current = audio;

      const updateProgress = () => {
        if (!audio) return;
        const cur = audio.currentTime || 0;
        let dur = audio.duration;

        // Fallback if audio.duration is Infinity, NaN, or 0 (common for Cloudinary WebM files)
        if (!dur || !isFinite(dur) || dur === 0) {
          dur = propDurationSec || 1;
        }

        const validCur = isFinite(cur) && cur < 86400 ? cur : 0;
        setCurrentTime(validCur);
        const pct = Math.min(100, Math.max(0, (validCur / dur) * 100));
        setProgress(pct);
      };

      const onTimeUpdate = () => {
        updateProgress();
      };

      const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setProgress(0);
      };

      audio.addEventListener("timeupdate", onTimeUpdate);
      audio.addEventListener("ended", onEnded);

      return () => {
        audio.pause();
        audio.removeEventListener("timeupdate", onTimeUpdate);
        audio.removeEventListener("ended", onEnded);
      };
    }
  }, [url, propDurationSec]);

  // Smooth animation frame loop while playing
  useEffect(() => {
    let animationId;
    const step = () => {
      if (audioRef.current && isPlaying) {
        const audio = audioRef.current;
        const cur = audio.currentTime || 0;
        let dur = audio.duration;
        if (!dur || !isFinite(dur) || dur === 0) {
          dur = propDurationSec || 1;
        }
        const validCur = isFinite(cur) && cur < 86400 ? cur : 0;
        setCurrentTime(validCur);
        setProgress(Math.min(100, Math.max(0, (validCur / dur) * 100)));
        animationId = requestAnimationFrame(step);
      }
    };

    if (isPlaying) {
      animationId = requestAnimationFrame(step);
    }
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isPlaying, propDurationSec]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Audio playback failed:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width || 1;
    const pct = Math.max(0, Math.min(1, clickX / width));

    let dur = audioRef.current.duration;
    if (!dur || !isFinite(dur) || dur === 0) {
      dur = propDurationSec || 1;
    }

    const newTime = pct * dur;
    try {
      audioRef.current.currentTime = newTime;
    } catch (err) {
      console.error("Seek error:", err);
    }
    setCurrentTime(newTime);
    setProgress(pct * 100);
  };

  const waveBars = [
    15, 24, 18, 30, 42, 20, 12, 28, 35, 22, 10, 18, 25, 32, 40, 26, 12, 18, 30,
    38, 22, 14, 26, 32, 18, 10,
  ];

  const formatSec = (sec) => {
    if (!sec || isNaN(sec) || !isFinite(sec) || sec >= 86400) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#111b21] text-white max-w-68 shadow-md select-none">
      <button
        type="button"
        onClick={togglePlay}
        className="h-9 w-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0 shadow-xs"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="h-4.5 w-4.5 fill-current" />
        ) : (
          <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div
          onClick={handleSeek}
          className="flex items-end gap-1 h-8 w-full overflow-hidden select-none cursor-pointer py-1"
          title="Click to seek"
        >
          {waveBars.map((h, i) => {
            const barPct = (i / (waveBars.length - 1)) * 100;
            const isFilled = progress >= barPct;
            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-full transition-colors duration-75 ${
                  isFilled ? "bg-[#00a884]" : "bg-slate-600/60"
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1 select-none font-semibold">
          <span>{formatSec(currentTime)}</span>
          <span>{duration || formatSec(propDurationSec) || "0:00"}</span>
        </div>
      </div>
    </div>
  );
};
//CHAT HEADER BAR
export const ChatHeaderBar = ({
  chatTitle,
  chatSubtitle,
  isDirect,
  recipient,
  group,
  showSearchInChat,
  setShowSearchInChat,
  isRightSidebarOpen,
  toggleRightSidebar,
  onBack,
  selectChat,
  onStartCall,
}) => {
  const handleBack = () => (onBack ? onBack() : selectChat(null));

  return (
    <div className="h-16 px-3 sm:px-4 border-b border-[#e9edef] bg-[#f0f2f5] flex items-center justify-between z-20 shrink-0 select-none">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          type="button"
          onClick={handleBack}
          className="sm:hidden p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition-colors cursor-pointer flex items-center justify-center shrink-0"
          title="Back to chats"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar
          src={isDirect ? recipient?.avatar : group?.avatar}
          name={chatTitle}
          size="md"
          status={
            isDirect ? (recipient?.isOnline ? "online" : "offline") : null
          }
          color={isDirect ? recipient?.avatarColor : group?.avatarColor}
        />
        <div className="text-left min-w-0">
          <h4 className="text-sm font-bold text-[#111b21] truncate">
            {chatTitle}
          </h4>
          <p
            className={`text-[10px] truncate ${isDirect && recipient?.isOnline ? "text-[#00a884] font-semibold" : "text-[#667781]"}`}
          >
            {chatSubtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onStartCall && onStartCall("audio")}
          className="p-2 rounded-xl cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
          title="Voice Call"
        >
          <Phone className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          onClick={() => onStartCall && onStartCall("video")}
          className="p-2 rounded-xl cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
          title="Video Call"
        >
          <Video className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={() => setShowSearchInChat(!showSearchInChat)}
          className={`p-2 rounded-xl cursor-pointer ${showSearchInChat ? "bg-slate-900 text-white" : "text-slate-450 hover:text-slate-750 hover:bg-slate-100"}`}
        >
          <Search className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={toggleRightSidebar}
          className={`p-2 rounded-xl cursor-pointer ${isRightSidebarOpen ? "bg-slate-900 text-white" : "text-slate-450 hover:text-slate-750 hover:bg-slate-100"}`}
        >
          <Info className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={handleBack}
          className="hidden sm:flex p-2 rounded-xl cursor-pointer text-slate-450 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-200/60 ml-1"
          title="Close chat"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
};

//  PINNED MESSAGES BAR
export const PinnedMessagesBar = ({
  pinnedMessages,
  handleTogglePinMessage,
}) => {
  const [pinnedBannerIndex, setPinnedBannerIndex] = useState(0);
  const [pinnedDropdownOpen, setPinnedDropdownOpen] = useState(false);
  const pinnedDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutsidePin = (e) => {
      if (
        pinnedDropdownRef.current &&
        !pinnedDropdownRef.current.contains(e.target)
      )
        setPinnedDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutsidePin);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsidePin);
  }, []);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;
  const safePinnedIndex = pinnedBannerIndex % pinnedMessages.length;
  const currentPinnedMsg = pinnedMessages[safePinnedIndex] || null;

  const getPinnedPreview = (msg) => {
    if (!msg) return "";
    if (msg.type === "image") return "📷 Photo";
    if (msg.type === "audio") return "🎤 Voice message";
    if (msg.type === "file") return `📄 ${msg.attachmentName || "Document"}`;
    return msg.text || "Attachment";
  };

  const scrollToMsg = (msgId) => {
    const el = document.getElementById(msgId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("bg-yellow-200/60");
    setTimeout(() => el?.classList.remove("bg-yellow-200/60"), 1500);
  };

  if (!currentPinnedMsg) return null;

  return (
    <div className="border-b border-[#e9edef] bg-[#f0f2f5] shrink-0 select-none relative">
      <div
        className="flex items-stretch cursor-pointer hover:bg-black/5 transition-colors"
        onClick={() => {
          const nextIdx = (safePinnedIndex + 1) % pinnedMessages.length;
          setPinnedBannerIndex(nextIdx);
          if (pinnedMessages[nextIdx]) scrollToMsg(pinnedMessages[nextIdx].id);
        }}
      >
        <div
          className={`w-1 shrink-0 rounded-sm my-1 ml-2 ${safePinnedIndex % 3 === 0 ? "bg-indigo-500" : safePinnedIndex % 3 === 1 ? "bg-emerald-500" : "bg-amber-500"}`}
        />
        <div className="flex-1 min-w-0 px-3 py-2 flex items-center gap-2">
          <Pin className="h-3.5 w-3.5 text-[#54656f] shrink-0 transform rotate-45" />
          <p className="text-xs text-[#111b21] font-semibold truncate leading-none">
            {getPinnedPreview(currentPinnedMsg)}
          </p>
        </div>
        <div
          ref={pinnedDropdownRef}
          className="relative flex items-center px-3 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="p-1.5 rounded-full hover:bg-black/10 transition-colors text-[#54656f]"
            onClick={() => setPinnedDropdownOpen((prev) => !prev)}
            title="Pinned message options"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${pinnedDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>
          {pinnedDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-lg border border-slate-200/80 py-1 w-44 text-xs font-semibold select-none animate-in fade-in zoom-in-95">
              <button
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left text-slate-800"
                onClick={() => {
                  setPinnedDropdownOpen(false);
                  scrollToMsg(currentPinnedMsg.id);
                }}
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                Go to message
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left text-slate-800"
                onClick={() => {
                  setPinnedDropdownOpen(false);
                  handleTogglePinMessage(currentPinnedMsg);
                  if (pinnedMessages.length <= 1) setPinnedBannerIndex(0);
                }}
              >
                <Pin className="h-4 w-4 shrink-0 text-slate-500" />
                Unpin
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// CHAT INPUT BAR
export const ChatInputBar = ({
  inputText,
  setInputText,
  handleInputChange,
  handleKeyPress,
  handleSend,
  replyMessage,
  setReplyMessage,
  editingMessage,
  setEditingMessage,
  isRecording,
  startRecording,
  stopRecording,
  cancelRecording,
  recordTimer,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiPickerRef,
  showAttachmentMenu,
  setShowAttachmentMenu,
  attachmentMenuRef,
  handleSimulateAttachment,
  pendingAttachment,
  handleRemovePendingAttachment,
  isUploadingAttachment,
  uploadingFileName,
  uploadingFileType,
  imageInputRef,
  fileInputRef,
  handleImageSelection,
  handleFileSelection,
  isBlocked,
  isGroupBlocked,
  isMessagingRestricted,
  targetUnblockId,
  unblockUser,
  recipient,
  showToast,
  getSenderProfile,
}) => {
  return (
    <div className="border-t border-slate-200/80 bg-white shrink-0 z-20">
      <div className="max-w-3xl md:max-w-4xl mx-auto p-3 flex flex-col gap-2 w-full">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelection}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip"
          className="hidden"
          onChange={handleFileSelection}
        />

        {replyMessage && (
          <div className="bg-slate-50 px-3 py-2 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Reply className="h-4 w-4 text-indigo-500 shrink-0" />
              <div className="truncate text-left">
                <span className="font-bold text-slate-700 block">
                  Replying to{" "}
                  {replyMessage.senderId === "user_me"
                    ? "You"
                    : getSenderProfile
                      ? getSenderProfile(replyMessage.senderId).name
                      : "User"}
                </span>
                <span className="text-[11px] text-slate-450 truncate">
                  {replyMessage.text || "Media attachment"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setReplyMessage(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {editingMessage && (
          <div className="bg-indigo-500/5 px-3 py-2 rounded-xl flex items-center justify-between border border-indigo-500/10 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Edit2 className="h-4 w-4 text-indigo-500 shrink-0" />
              <div className="truncate text-left text-indigo-650">
                <span className="font-bold block">Editing message</span>
                <span className="text-[11px] truncate opacity-90">
                  {editingMessage.text}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingMessage(null);
                setInputText("");
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-650"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isBlocked ? (
          <div className="p-1 select-none w-full">
            <div className="flex items-center justify-between gap-3 w-full bg-[#f0f2f5] rounded-full px-4 py-2.5 border border-[#e9edef] shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-full bg-rose-500/10 text-rose-600 shrink-0">
                  <UserX className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-[#111b21] truncate">
                  You blocked this contact. Tap Unblock to resume conversation.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (targetUnblockId && typeof unblockUser === "function") {
                    unblockUser(targetUnblockId);
                    if (showToast)
                      showToast(
                        "Contact Unblocked",
                        `${recipient?.name || "Contact"} is now unblocked.`,
                        "success",
                      );
                  }
                }}
                className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
              >
                Unblock
              </button>
            </div>
          </div>
        ) : isGroupBlocked ? (
          <div className="bg-amber-50/80 p-3.5 rounded-2xl flex items-center justify-center text-center text-xs font-bold text-amber-700 border border-amber-200/80 select-none shadow-2xs leading-relaxed gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              This group has been suspended by the administrator. Sending
              messages is disabled.
            </span>
          </div>
        ) : isMessagingRestricted ? (
          <div className="bg-[#f0f2f5] p-3.5 rounded-2xl flex items-center justify-center text-center text-xs font-medium text-[#54656f] border border-[#e9edef] select-none shadow-2xs leading-relaxed gap-2">
            <Lock className="h-4 w-4 text-[#667781] shrink-0" />
            <span>Only admins can send messages to this group.</span>
          </div>
        ) : isRecording ? (
          <div className="bg-rose-500/5 dark:bg-rose-500/5 p-2 rounded-xl flex items-center justify-between border border-rose-500/20">
            <div className="flex items-center gap-3.5 pl-3.5">
              <span className="h-2.5 w-2.5 bg-rose-500 rounded-full animate-ping shrink-0" />
              <span className="text-xs font-bold font-mono text-rose-500">
                Recording: {Math.floor(recordTimer / 60)}:
                {(recordTimer % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelRecording}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-bold cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={stopRecording}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Stop & Send
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-transparent border-0 select-none w-full">
            <AnimatePresence>
              {pendingAttachment && !isUploadingAttachment && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="mb-2.5 p-2.5 rounded-2xl bg-white border border-emerald-500/40 shadow-md flex items-center justify-between gap-3 text-xs select-none relative"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {pendingAttachment.type === "image" &&
                    pendingAttachment.previewUrl ? (
                      <img
                        src={pendingAttachment.previewUrl}
                        alt="Selected preview"
                        className="h-12 w-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#111b21] truncate max-w-55">
                          {pendingAttachment.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                          Ready to send
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-[#667781] truncate mt-0.5">
                        {pendingAttachment.size} • Click send button to share
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePendingAttachment}
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                    title="Remove attachment"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isUploadingAttachment && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="mb-2.5 p-3 rounded-2xl bg-white border border-[#008069]/30 shadow-md flex items-center justify-between gap-3 text-xs select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-[#008069]/10 text-[#008069] shrink-0">
                      {uploadingFileType === "image" ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#111b21] truncate">
                          Uploading{" "}
                          {uploadingFileType === "image"
                            ? "Image"
                            : "PDF / Document"}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#008069]/15 text-[#008069] animate-pulse shrink-0">
                          Uploading...
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-[#667781] truncate mt-0.5">
                        {uploadingFileName || "Processing attachment..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pr-1">
                    <Loader2 className="h-5 w-5 animate-spin text-[#008069]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-1.5 w-full bg-white rounded-full px-3 py-1.5 border border-slate-200/80 shadow-2xs">
              <div className="relative shrink-0" ref={attachmentMenuRef}>
                <Tooltip content="Attach File">
                  <button
                    type="button"
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className="p-1.5 rounded-full text-[#54656f] hover:text-[#111b21] hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-center h-8 w-8"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </Tooltip>
                <AnimatePresence>
                  {showAttachmentMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute bottom-12 left-0 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-30 text-xs text-left"
                    >
                      <button
                        type="button"
                        onClick={() => handleSimulateAttachment("image")}
                        className="flex items-center gap-2.5 px-3 py-2 w-full text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors font-semibold"
                      >
                        <ImageIcon className="h-4 w-4 text-emerald-600" /> Share
                        Image
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateAttachment("pdf")}
                        className="flex items-center gap-2.5 px-3 py-2 w-full text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors font-semibold"
                      >
                        <FileText className="h-4 w-4 text-rose-500" /> Share PDF
                        Document
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative shrink-0" ref={emojiPickerRef}>
                <Tooltip content="Emoji menu">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 rounded-full text-[#54656f] hover:text-[#111b21] hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-center h-8 w-8"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                </Tooltip>
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute bottom-12 left-0 z-30 max-w-[calc(100vw-2rem)]"
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData) =>
                          setInputText((prev) => prev + emojiData.emoji)
                        }
                        skinTonesDisabled={false}
                        searchPlaceholder="Search emoji..."
                        height={320}
                        width={Math.min(
                          300,
                          typeof window !== "undefined"
                            ? window.innerWidth - 32
                            : 300,
                        )}
                        previewConfig={{ showPreview: false }}
                        theme="light"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 min-w-0 flex items-center px-1">
                <textarea
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message"
                  className="w-full bg-transparent text-xs outline-none text-[#111b21] placeholder-[#667781] max-h-25 min-h-5 resize-none leading-relaxed no-scrollbar font-medium py-1"
                  rows={1}
                />
              </div>

              <div className="shrink-0 flex items-center">
                {inputText.trim() || pendingAttachment ? (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isUploadingAttachment}
                    className="p-2 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white cursor-pointer transition-all shadow-xs flex items-center justify-center h-8 w-8 transform active:scale-95 ml-1 disabled:opacity-50"
                  >
                    {isUploadingAttachment ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Send className="h-3.5 w-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                ) : (
                  <Tooltip content="Hold to Record">
                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-1.5 rounded-full text-[#54656f] hover:text-[#111b21] hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-center h-8 w-8"
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// MESSAGE BUBBLE
export const MessageBubble = ({
  msg,
  index,
  filteredMessagesCount,
  isMe,
  sender,
  activeChat,
  replyCtx,
  handleCopyMsgText,
  setReplyMessage,
  setEditingMessage,
  setInputText,
  setForwardMessage,
  handleTogglePinMessage,
  handleDownloadFile,
  setLightboxImage,
  setMsgInfoTarget,
  setTargetDeleteMessage,
  setDeleteModalOpen,
  addReaction,
  quickEmojis,
  activeMsgMenuId,
  setActiveMsgMenuId,
  showEmojiPickerMsgId,
  setShowEmojiPickerMsgId,
  showFullEmojiPickerMsgId,
  setShowFullEmojiPickerMsgId,
  msgMenuRef,
  reportUser,
  getSenderProfile,
  showToast,
  setReactionDetailsTarget,
}) => {
  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const isDirect = activeChat.type === "direct";
  const isNearBottom =
    filteredMessagesCount >= 4 && index >= filteredMessagesCount - 2;

  const menuItems = [
    {
      label: "Reply",
      icon: Reply,
      onClick: () => setReplyMessage(msg),
      condition: true,
    },
    {
      label: "Copy",
      icon: Copy,
      onClick: () => handleCopyMsgText(msg.text),
      condition: !!msg.text,
    },
    {
      label: "React",
      icon: Smile,
      onClick: () => {
        setShowEmojiPickerMsgId(
          showEmojiPickerMsgId === msg.id ? null : msg.id,
        );
        setShowFullEmojiPickerMsgId(null);
      },
      condition: true,
    },
    {
      label: "Forward",
      icon: Forward,
      onClick: () => setForwardMessage(msg),
      condition: true,
    },
    {
      label: (activeChat?.pinnedMessageIds || []).some((p) => p.id === msg.id)
        ? "Unpin"
        : "Pin",
      icon: Pin,
      onClick: () => handleTogglePinMessage(msg),
      condition: true,
    },
    {
      label: "Report",
      icon: AlertTriangle,
      className: "text-amber-600 font-bold",
      onClick: () => {
        const u = getSenderProfile(msg.senderId);
        if (typeof reportUser === "function" && u)
          reportUser(
            u.id || u._id,
            msg.text || "[media attachment]",
            "message",
          );
        showToast(
          "Report Submitted",
          "Message reported for review.",
          "warning",
        );
      },
      condition: !isMe,
    },
    {
      label: "Message Info",
      icon: Info,
      className: "text-[#008069] font-bold",
      onClick: () => setMsgInfoTarget(msg),
      condition: isMe && !isDirect,
    },
    {
      label: "Edit",
      icon: Edit2,
      onClick: () => {
        setEditingMessage(msg);
        setInputText(msg.text);
      },
      condition:
        isMe && Date.now() - new Date(msg.timestamp).getTime() <= 86400000,
    },
  ];

  return (
    <div
      id={msg.id}
      className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[70%] transition-colors duration-500 rounded-xl p-0.5 ${isMe ? "ml-auto flex-row-reverse text-right" : "mr-auto text-left"}`}
    >
      {!isMe && (
        <div className="shrink-0">
          <Avatar
            src={sender.avatar}
            name={sender.name}
            size="sm"
            color={sender.avatarColor}
          />
        </div>
      )}
      <div
        className={`space-y-1 flex flex-col w-full ${isMe ? "items-end" : "items-start"}`}
      >
        {!isMe && !isDirect && (
          <span className="text-[11px] font-bold text-[#008069] tracking-tight block ml-0.5 mb-0.5">
            {sender.name}
          </span>
        )}
        <div className="relative group flex flex-col max-w-full">
          {!msg.isDeleted && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveMsgMenuId(activeMsgMenuId === msg.id ? null : msg.id);
                setShowEmojiPickerMsgId(null);
                setShowFullEmojiPickerMsgId(null);
              }}
              className={`absolute top-1.5 right-1.5 p-1 rounded-md transition-all z-20 cursor-pointer shadow-xs pointer-events-auto ${activeMsgMenuId === msg.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100"} ${isMe ? "text-slate-500 hover:text-slate-900 hover:bg-black/10 bg-emerald-100/50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 bg-white/70"}`}
              title="Message Options"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}

          {showFullEmojiPickerMsgId === msg.id && (
            <>
              <div
                className="fixed inset-0 z-95 bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullEmojiPickerMsgId(null);
                }}
              />
              <div
                className={`absolute z-100 ${isMe ? "right-0" : "left-0"} ${isNearBottom ? "bottom-full mb-2 top-auto" : "top-full mt-2 bottom-auto"} shadow-2xl rounded-2xl overflow-hidden border border-slate-200/90 bg-white animate-in fade-in zoom-in-95`}
                onClick={(e) => e.stopPropagation()}
              >
                <EmojiPicker
                  theme="light"
                  onEmojiClick={(eData) => {
                    addReaction(msg.id, eData.emoji);
                    setShowFullEmojiPickerMsgId(null);
                    setShowEmojiPickerMsgId(null);
                    setActiveMsgMenuId(null);
                  }}
                  searchPlaceholder="Search emoji..."
                  width={Math.min(
                    300,
                    typeof window !== "undefined"
                      ? window.innerWidth - 32
                      : 300,
                  )}
                  height={320}
                />
              </div>
            </>
          )}

          {activeMsgMenuId === msg.id && (
            <div
              ref={msgMenuRef}
              onClick={(e) => e.stopPropagation()}
              className={`absolute z-50 bg-white text-[#111b21] rounded-xl shadow-2xl border border-slate-200/90 py-1.5 w-48 text-xs font-semibold select-none animate-in fade-in zoom-in-95 max-h-[70vh] overflow-y-auto no-scrollbar ${isMe ? "right-0" : "left-0"} ${isNearBottom ? "bottom-full mb-1 top-auto" : "top-full mt-1 bottom-auto"}`}
            >
              {showEmojiPickerMsgId === msg.id && (
                <div className="flex items-center justify-around p-2 border-b border-slate-100 relative">
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        addReaction(msg.id, emoji);
                        setShowEmojiPickerMsgId(null);
                        setShowFullEmojiPickerMsgId(null);
                        setActiveMsgMenuId(null);
                      }}
                      className="hover:scale-125 transition-transform text-sm cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullEmojiPickerMsgId(
                        showFullEmojiPickerMsgId === msg.id ? null : msg.id,
                      );
                      setActiveMsgMenuId(null);
                    }}
                    className={`p-1 rounded-full text-slate-600 hover:text-[#111b21] transition-colors cursor-pointer flex items-center justify-center shrink-0 ${showFullEmojiPickerMsgId === msg.id ? "bg-[#008069] text-white" : "bg-slate-100 hover:bg-slate-200"}`}
                    title="All Emojis"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {menuItems
                .filter((item) => item.condition)
                .map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      item.onClick();
                      if (item.label !== "React") setActiveMsgMenuId(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition-colors text-left ${item.className || "text-[#111b21]"}`}
                  >
                    <item.icon className="h-4 w-4 text-[#667781]" />
                    <span>{item.label}</span>
                  </button>
                ))}

              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={() => {
                  setTargetDeleteMessage(msg);
                  setDeleteModalOpen(true);
                  setActiveMsgMenuId(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition-colors text-left text-rose-600 font-bold"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}

          <div
            className={`pl-3.5 pr-8 py-2 rounded-2xl text-xs sm:text-xs leading-relaxed max-w-full text-left shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] relative wrap-anywhere [word-break:break-word] ${isMe ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-xs" : "bg-white text-[#111b21] rounded-tl-xs border border-slate-200/50"} ${msg.isDeleted ? "italic text-slate-400 bg-slate-50 border-dashed pr-3.5" : ""} ${msg.emojiReactions && msg.emojiReactions.length > 0 ? "pb-3.5 mb-1" : ""}`}
          >
            {msg.isForwarded && (
              <div
                className={`flex items-center gap-1 mb-1 text-[9px] font-bold tracking-wide uppercase italic ${isMe ? "text-indigo-300" : "text-slate-400"}`}
              >
                <Forward className="h-2.5 w-2.5" />
                <span>Forwarded</span>
              </div>
            )}
            {replyCtx && (
              <div className="mb-2 p-2 rounded-lg bg-black/5 border-l-[3px] border-indigo-500 text-[10px] text-slate-700 truncate max-w-full">
                <span className="font-bold block text-indigo-500">
                  {replyCtx.senderId === "user_me"
                    ? "You"
                    : getSenderProfile(replyCtx.senderId).name}
                </span>
                {replyCtx.text || "File Attachment"}
              </div>
            )}

            {msg.text && (
              <p className="whitespace-pre-wrap wrap-anywhere [word-break:break-word]">
                {renderTextWithLinks(msg.text)}
              </p>
            )}
            {msg.type === "image" && msg.attachmentUrl && (
              <div className="relative mt-1 max-w-full sm:max-w-60 overflow-hidden rounded-lg cursor-zoom-in border-0">
                <img
                  src={msg.attachmentUrl}
                  alt={msg.attachmentName || "Attachment"}
                  className="object-cover h-40 w-full hover:scale-105 transition-transform duration-300"
                  onClick={() => setLightboxImage(msg.attachmentUrl)}
                />
              </div>
            )}
            {msg.type === "file" && (
              <a
                href={msg.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={msg.attachmentName}
                onClick={(e) =>
                  handleDownloadFile(e, msg.attachmentUrl, msg.attachmentName)
                }
                className="flex items-center justify-between gap-3 p-3 mt-1.5 rounded-xl border-0 bg-black/5 hover:bg-black/10 transition-colors duration-200 cursor-pointer max-w-full sm:max-w-65 group/file text-slate-800 decoration-transparent"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 group-hover/file:bg-red-500/20 transition-colors">
                    <FileText className="h-5.5 w-5.5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h5 className="text-xs font-bold truncate text-slate-800 group-hover/file:text-indigo-600 transition-colors">
                      {msg.attachmentName}
                    </h5>
                    <p className="text-[10px] text-slate-455 font-semibold mt-0.5">
                      {msg.attachmentSize}
                    </p>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-200/50 shrink-0 transition-colors">
                  <Download className="h-4 w-4" />
                </div>
              </a>
            )}
            {msg.type === "audio" && (
              <SimulatedVoicePlayer
                duration={msg.attachmentDuration}
                url={msg.attachmentUrl}
              />
            )}
            {msg.type === "call" && (
              <div className="flex items-center gap-3 p-3 mt-1.5 rounded-xl border-0 bg-black/5 text-slate-800 max-w-61.25">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${msg.text.includes("Missed") ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"}`}
                >
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 text-left">
                  <h5 className="text-xs font-bold text-slate-800">
                    {msg.text}
                  </h5>
                  <p className="text-[10px] text-slate-455 font-semibold mt-0.5">
                    {msg.attachmentDuration || "0:00"}
                  </p>
                </div>
              </div>
            )}

            {msg.emojiReactions &&
              msg.emojiReactions.length > 0 &&
              (() => {
                const totalCount = msg.emojiReactions.reduce(
                  (acc, r) =>
                    acc + (r.count || (r.userIds ? r.userIds.length : 0)),
                  0,
                );
                const myReaction = msg.emojiReactions.find((r) =>
                  (r.userIds || []).includes("user_me"),
                );
                return (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof setReactionDetailsTarget === "function")
                        setReactionDetailsTarget(msg);
                    }}
                    className={`absolute -bottom-3 ${isMe ? "right-2" : "left-2"} z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffffff] border border-[#d1d7db] text-[#111b21] shadow-[0_1px_3px_rgba(11,20,26,0.18)] select-none cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150`}
                    title={
                      myReaction
                        ? `Reacted with ${myReaction.emoji} - Click to see all reactions`
                        : "Click to see all reactions"
                    }
                  >
                    <div className="flex items-center gap-0.5">
                      {msg.emojiReactions.slice(0, 3).map((r, i) => (
                        <span
                          key={i}
                          className="text-xs sm:text-[13px] leading-none shrink-0 drop-shadow-2xs"
                        >
                          {r.emoji}
                        </span>
                      ))}
                    </div>
                    {totalCount > 1 && (
                      <span className="text-[10px] font-extrabold text-[#54656f] pl-0.5">
                        {totalCount}
                      </span>
                    )}
                  </div>
                );
              })()}
          </div>

          <div
            className={`flex items-center gap-1.5 mt-1 text-[9px] text-slate-400 font-medium ${isMe ? "justify-end" : "justify-start"}`}
          >
            <span>{time}</span>
            {msg.edited && (
              <span className="text-slate-400/70 select-none">(edited)</span>
            )}
            {isMe && (
              <>
                {msg.status === "sent" && (
                  <Check className="h-3 w-3 text-slate-400" />
                )}
                {msg.status === "delivered" && (
                  <CheckCheck className="h-3 w-3 text-slate-400" />
                )}
                {msg.status === "seen" && (
                  <CheckCheck className="h-3 w-3 text-sky-500" />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// MODAL COMPONENTS
export const AddGroupMembersModal = ({
  isOpen,
  onClose,
  group,
  allUsers,
  user,
  addMembersToGroup,
  showToast,
}) => {
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen || !group) return null;
  const candidateUsers = filterCandidateUsers(
    allUsers,
    user?.id || user?._id?.toString(),
    searchQuery,
    group.memberIds || [],
  );

  const toggleSelectMember = (uId) =>
    setSelectedMemberIds((prev) =>
      prev.includes(uId) ? prev.filter((id) => id !== uId) : [...prev, uId],
    );

  const handleConfirmAdd = async () => {
    if (selectedMemberIds.length === 0) return;
    const result = await addMembersToGroup(group.id, selectedMemberIds);
    if (result?.success) {
      showToast(
        result.isPending ? "Request Sent" : "Members Added",
        result.isPending
          ? `Join request sent for ${selectedMemberIds.length} member(s).`
          : `Added ${selectedMemberIds.length} member(s) to group.`,
        result.isPending ? "info" : "success",
      );
      setSelectedMemberIds([]);
      onClose();
    } else {
      showToast("Error", result?.message || "Could not add members.", "danger");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Members to ${group.name}`}
      size="md"
    >
      <div className="space-y-4 text-left p-1 select-none">
        <div className="relative">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 h-4 w-4 my-auto" />
          <input
            type="text"
            placeholder="Search contact by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs outline-none text-slate-800 font-medium"
          />
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1.5 no-scrollbar">
          {candidateUsers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-semibold">
              No contacts available to add.
            </div>
          ) : (
            candidateUsers.map((u) => {
              const uId = u.id || u._id?.toString();
              const isSelected = selectedMemberIds.includes(uId);
              return (
                <div
                  key={uId}
                  onClick={() => toggleSelectMember(uId)}
                  className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${isSelected ? "bg-indigo-50/70 border-indigo-200" : "bg-white border-slate-100 hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={u.avatar}
                      name={u.name}
                      size="sm"
                      color={u.avatarColor}
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {u.phone || "No phone"}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmAdd}
            disabled={selectedMemberIds.length === 0}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs disabled:opacity-50"
          >
            Add Selected ({selectedMemberIds.length})
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const ForwardMessageModal = ({
  forwardMessage,
  chats,
  allUsers,
  user,
  onClose,
  onSendForward,
}) => {
  const [selectedChatIds, setSelectedChatIds] = useState([]);
  const [forwardSearch, setForwardSearch] = useState("");

  if (!forwardMessage) return null;
  const toggleSelectChat = (id) =>
    setSelectedChatIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id],
    );

  const filteredChats = chats.filter((c) => {
    const name =
      c.name ||
      allUsers.find(
        (u) => u.id === c.participants?.find((p) => p !== "user_me"),
      )?.name;
    return name?.toLowerCase().includes(forwardSearch.toLowerCase());
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Forward className="h-5 w-5 text-indigo-600" /> Forward Message
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs italic text-slate-600 mb-4 truncate">
            "{forwardMessage.text || "Shared Attachment"}"
          </div>
          <input
            type="text"
            placeholder="Search contacts or groups..."
            value={forwardSearch}
            onChange={(e) => setForwardSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none mb-4"
          />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {filteredChats.map((c) => {
              const isDirect = c.type === "direct";
              const recipientId = isDirect
                ? c.participants?.find((p) => p !== "user_me")
                : null;
              const recipient = isDirect
                ? allUsers.find((u) => u.id === recipientId)
                : null;
              const title = isDirect ? recipient?.name || c.name : c.name;
              const isSelected = selectedChatIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleSelectChat(c.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${isSelected ? "bg-indigo-50/70 border-indigo-200" : "bg-white border-slate-100 hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={isDirect ? recipient?.avatar : c.avatar}
                      name={title}
                      size="sm"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      {title}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => onSendForward(selectedChatIds)}
              disabled={selectedChatIds.length === 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs disabled:opacity-50"
            >
              Send ({selectedChatIds.length})
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const PinDurationModal = ({
  isOpen,
  onClose,
  selectedDurationHours,
  setSelectedDurationHours,
  onConfirmPin,
}) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-left space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Pin className="h-5 w-5 text-indigo-600 transform rotate-45" />{" "}
              Choose Pin Duration
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {[
              { hours: 24, label: "24 Hours" },
              { hours: 168, label: "7 Days (Default)" },
              { hours: 720, label: "30 Days" },
            ].map((item) => (
              <label
                key={item.hours}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-800"
              >
                <input
                  type="radio"
                  name="pinDuration"
                  checked={selectedDurationHours === item.hours}
                  onChange={() => setSelectedDurationHours(item.hours)}
                  className="text-indigo-600"
                />
                {item.label}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmPin}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md"
            >
              Pin Message
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const CreateGroupModal = ({
  isOpen,
  onClose,
  allUsers,
  user,
  uploadFile,
  createGroup,
  showToast,
}) => {
  const [groupStep, setGroupStep] = useState(1);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupAvatarUrl, setGroupAvatarUrl] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [isUploadingGroupAvatar, setIsUploadingGroupAvatar] = useState(false);
  const groupAvatarInputRef = useRef(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setGroupStep(1);
    setGroupName("");
    setGroupDesc("");
    setSelectedMembers([]);
    setGroupAvatarUrl("");
    setMemberSearchQuery("");
    onClose();
  };

  const handleToggleMember = (userId) =>
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );

  const handleGroupAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return showToast(
        "Invalid File Type",
        "Please select an image file.",
        "danger",
      );
    if (file.size > 5 * 1024 * 1024)
      return showToast(
        "File Too Large",
        "Max image size allowed is 5MB.",
        "danger",
      );
    setIsUploadingGroupAvatar(true);
    const uploadedData = await uploadFile(file);
    setIsUploadingGroupAvatar(false);
    if (uploadedData?.url) {
      setGroupAvatarUrl(uploadedData.url);
      showToast("Image Uploaded", "Group avatar icon ready.", "info");
    } else {
      setGroupAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim())
      return showToast(
        "Validation Error",
        "Please enter a group name.",
        "warning",
      );
    if (selectedMembers.length === 0)
      return showToast(
        "Validation Error",
        "Please select at least 1 member for the group.",
        "warning",
      );
    const newGroup = await createGroup({
      name: groupName.trim(),
      description: groupDesc.trim(),
      avatar: groupAvatarUrl,
      members: selectedMembers,
    });
    if (newGroup) {
      showToast(
        "Group Created",
        `Group "${groupName}" created successfully!`,
        "success",
      );
      handleClose();
    } else {
      showToast("Creation Failed", "Could not create group.", "danger");
    }
  };

  const candidateUsers = filterCandidateUsers(
    allUsers,
    user?.id || user?._id?.toString(),
    memberSearchQuery,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        groupStep === 1
          ? "Create Group - Select Members (1/2)"
          : "Create Group - Group Details (2/2)"
      }
      size="md"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5 text-left p-1 select-none"
      >
        {groupStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#54656f]">
                Select members to add to the group ({selectedMembers.length}{" "}
                selected)
              </span>
            </div>
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-[#f0f4f8] rounded-xl max-h-24 overflow-y-auto border border-slate-200/80">
                {selectedMembers.map((memberId) => {
                  const m = allUsers.find(
                    (u) => u.id === memberId || u._id?.toString() === memberId,
                  );
                  if (!m) return null;
                  return (
                    <div
                      key={memberId}
                      className="inline-flex items-center gap-1.5 bg-[#008069]/10 border border-[#008069]/30 pl-1.5 pr-2.5 py-1 rounded-full text-[11px] font-extrabold text-[#008069] shadow-2xs"
                    >
                      <Avatar
                        src={m.avatar}
                        name={m.name}
                        size="xs"
                        color={m.avatarColor}
                      />
                      <span>{m.name.split(" ")[0]}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleMember(memberId)}
                        className="text-[#008069] hover:text-rose-500 transition-colors ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="relative">
              <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667781] h-4.5 w-4.5 my-auto" />
              <input
                type="text"
                placeholder="Search user by name or phone number..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="block w-full rounded-xl bg-[#f0f4f8] border border-slate-200/80 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-xs py-2.5 pl-10 pr-4 outline-none text-[#111b21] placeholder-[#667781] font-medium"
              />
            </div>
            <div className="max-h-56 overflow-y-auto border border-slate-200/80 rounded-xl p-2 space-y-1.5 bg-[#f8fafc] no-scrollbar">
              {candidateUsers.map((u) => {
                const uId = u.id || u._id?.toString();
                const isSelected = selectedMembers.includes(uId);
                return (
                  <div
                    key={uId}
                    onClick={() => handleToggleMember(uId)}
                    className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${isSelected ? "bg-[#008069]/10 border-[#008069] shadow-2xs" : "bg-white border-slate-200/80 shadow-2xs hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={u.avatar}
                        name={u.name}
                        size="sm"
                        color={u.avatarColor}
                      />
                      <div className="text-left min-w-0">
                        <div className="text-xs font-bold text-[#111b21] truncate">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-[#667781] font-medium truncate mt-0.5">
                          {u.phone || "No phone number"}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="h-4 w-4 accent-[#008069] rounded cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedMembers.length === 0}
                onClick={() => setGroupStep(2)}
                className={`px-6 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all duration-200 shadow-sm ${selectedMembers.length > 0 ? "bg-linear-to-r from-[#008069] to-[#00a884] hover:from-[#006e5a] hover:to-[#008069] text-white shadow-md cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200/60"}`}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {groupStep === 2 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-2 mb-2">
              <div
                className="relative group cursor-pointer"
                onClick={() => groupAvatarInputRef.current?.click()}
              >
                <Avatar
                  src={groupAvatarUrl}
                  name={groupName || "New Group"}
                  size="xl"
                  className="h-20 w-20 border-2 border-slate-200 object-cover shadow-md rounded-full transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <input
                  type="file"
                  ref={groupAvatarInputRef}
                  onChange={handleGroupAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <span className="text-[10px] font-black uppercase text-[#667781] tracking-wider">
                {isUploadingGroupAvatar
                  ? "Uploading icon..."
                  : "Group Icon (Click to change)"}
              </span>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-[#54656f] uppercase tracking-wider">
                Group Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Developers, Marketing Team"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                className="block w-full rounded-xl bg-[#f0f4f8] border border-slate-200/80 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-xs py-3 px-4 outline-none font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-[#54656f] uppercase tracking-wider">
                Description (Optional)
              </label>
              <textarea
                placeholder="Provide a short summary..."
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                className="block w-full rounded-xl bg-[#f0f4f8] border border-slate-200/80 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-xs p-3.5 outline-none font-semibold min-h-17.5 resize-none"
              />
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-200/80">
              <label className="block text-[10px] font-black text-[#54656f] uppercase tracking-wider">
                Selected Members ({selectedMembers.length})
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {selectedMembers.map((memberId) => {
                  const m = allUsers.find(
                    (u) => u.id === memberId || u._id?.toString() === memberId,
                  );
                  if (!m) return null;
                  return (
                    <div
                      key={memberId}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={m.avatar}
                          name={m.name}
                          size="sm"
                          color={m.avatarColor}
                        />
                        <div className="min-w-0 text-left">
                          <span className="font-bold text-xs text-[#111b21] block truncate">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-[#667781] block truncate">
                            {m.phone || "No phone number"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleMember(memberId)}
                        className="p-1 rounded-lg text-[#667781] hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setGroupStep(1)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full text-xs font-extrabold bg-linear-to-r from-[#008069] to-[#00a884] hover:from-[#006e5a] hover:to-[#008069] text-white shadow-md cursor-pointer"
              >
                Create Group
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export const EditGroupDetailsModal = ({
  isOpen,
  onClose,
  group,
  updateGroupProfile,
  uploadFile,
  showToast,
}) => {
  const [groupName, setGroupName] = useState(group?.name || "");
  const [groupDesc, setGroupDesc] = useState(group?.description || "");
  const [groupAvatarUrl, setGroupAvatarUrl] = useState(group?.avatar || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !group) return null;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return showToast(
        "Invalid File",
        "Please select an image file.",
        "danger",
      );
    setIsUploadingAvatar(true);
    const uploaded = await uploadFile(file);
    setIsUploadingAvatar(false);
    if (uploaded?.url) {
      setGroupAvatarUrl(uploaded.url);
      showToast("Uploaded", "Group icon ready.", "info");
    } else {
      setGroupAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!groupName.trim())
      return showToast(
        "Validation Error",
        "Group name cannot be empty.",
        "warning",
      );
    const updated = await updateGroupProfile(group.id, {
      name: groupName.trim(),
      description: groupDesc.trim(),
      avatar: groupAvatarUrl,
    });
    if (updated) {
      showToast(
        "Group Updated",
        "Group details updated successfully.",
        "success",
      );
      onClose();
    } else {
      showToast("Error", "Could not update group profile.", "danger");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Group Profile"
      size="md"
    >
      <form
        onSubmit={handleSave}
        className="space-y-4 text-left p-1 select-none"
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar
              src={groupAvatarUrl}
              name={groupName || "Group"}
              size="xl"
              className="h-20 w-20 border-2 border-slate-200 object-cover rounded-full"
            />
            <div className="absolute inset-0 bg-slate-950/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-400">
            {isUploadingAvatar ? "Uploading icon..." : "Change Group Icon"}
          </span>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-900"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase">
            Description
          </label>
          <textarea
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-900 min-h-17.5 resize-none"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const GroupMembersList = ({
  group,
  allUsers,
  user,
  makeGroupAdmin,
  dismissGroupAdmin,
  removeFromGroup,
  createDirectChat,
  selectChat,
  showToast,
  onClose,
  handleJoinRequest,
  setIsAddMembersModalOpen,
}) => {
  const [activeMemberMenuId, setActiveMemberMenuId] = useState(null);
  if (!group) return null;

  const myRealId = user?.id || user?._id?.toString();
  const amIAdmin = (group.adminIds || []).some((id) => {
    const idStr =
      typeof id === "object" ? id?._id?.toString() || id?.id : id?.toString();
    const myStr = user?._id?.toString() || user?.id;
    return (
      idStr === "user_me" || idStr === myRealId || (myStr && idStr === myStr)
    );
  });

  return (
    <div className="p-4 bg-[#f0f4f8] border-b border-slate-200/80 text-left relative">
      {activeMemberMenuId && (
        <div
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setActiveMemberMenuId(null)}
        />
      )}

      {amIAdmin && group.joinRequests && group.joinRequests.length > 0 && (
        <div className="mb-4 p-3 rounded-2xl bg-[#008069]/5 border border-[#008069]/20 space-y-2">
          <h4 className="text-xs font-extrabold text-[#008069] flex items-center gap-1.5 tracking-wide uppercase">
            <Users className="h-4 w-4 text-[#008069]" /> Pending Join Requests (
            {group.joinRequests.length})
          </h4>
          <div className="space-y-2">
            {group.joinRequests.map((req) => {
              const reqUser =
                typeof req.user === "object"
                  ? req.user
                  : allUsers.find(
                      (u) =>
                        u.id === req.user || u._id?.toString() === req.user,
                    );
              if (!reqUser) return null;
              const reqUserRealId =
                reqUser.id || reqUser._id?.toString() || req.user;
              const requestedByObj =
                req.requestedBy === "user_me"
                  ? user
                  : allUsers.find(
                      (u) =>
                        u.id === req.requestedBy ||
                        u._id?.toString() === req.requestedBy,
                    );

              return (
                <div
                  key={req.id || reqUserRealId}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#008069]/25 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={reqUser.avatar}
                      name={reqUser.name}
                      size="sm"
                      color={reqUser.avatarColor}
                    />
                    <div className="text-xs min-w-0 text-left">
                      <span className="font-extrabold text-[#111b21] block truncate leading-tight">
                        {reqUser.name}
                      </span>
                      <span className="text-[11px] font-medium text-[#667781] block truncate mt-0.5">
                        Added by {requestedByObj?.name || "Member"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          await handleJoinRequest(
                            group.id,
                            reqUserRealId,
                            "approve",
                          )
                        )
                          showToast(
                            "Member Approved",
                            `${reqUser.name} has been added.`,
                            "success",
                          );
                      }}
                      className="p-2 rounded-xl bg-[#008069] text-white hover:bg-[#006e5a] transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                      title="Approve Member"
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          await handleJoinRequest(
                            group.id,
                            reqUserRealId,
                            "reject",
                          )
                        )
                          showToast(
                            "Request Rejected",
                            `Join request for ${reqUser.name} was rejected.`,
                            "info",
                          );
                      }}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                      title="Reject Request"
                    >
                      <X className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-3.5">
        <h4 className="text-xs font-bold text-[#111b21] flex items-center gap-1.5 tracking-wide uppercase">
          <Users className="h-4 w-4 text-[#008069]" /> Members list (
          {group.memberIds.length})
        </h4>
        <button
          type="button"
          onClick={() => setIsAddMembersModalOpen?.(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#008069]/10 text-[#008069] border border-[#008069]/20 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide hover:bg-[#008069]/15 transition-colors cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5" /> Add members
        </button>
      </div>

      <div className="space-y-2">
        {group.memberIds.map((mid) => {
          const isMe = mid === "user_me";
          const member = isMe
            ? user
            : allUsers.find((u) => u.id === mid || u._id?.toString() === mid);
          if (!member) return null;
          const memberRealId = member.id || member._id?.toString();
          const isTargetAdmin = (group.adminIds || []).some((id) => {
            const idStr =
              typeof id === "object"
                ? id?._id?.toString() || id?.id
                : id?.toString();
            return (
              idStr === mid ||
              idStr === memberRealId ||
              (isMe && idStr === "user_me") ||
              (member?._id && idStr === member._id.toString())
            );
          });
          const isMenuOpen = activeMemberMenuId === mid;

          return (
            <div
              key={mid}
              className={`relative ${isMenuOpen ? "z-50" : "z-1"}`}
            >
              <div
                onClick={() => {
                  if (!isMe) setActiveMemberMenuId(isMenuOpen ? null : mid);
                }}
                className={`flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-all ${!isMe ? "cursor-pointer hover:bg-slate-50 hover:border-[#008069]/40" : "cursor-default"} ${isMenuOpen ? "ring-2 ring-[#008069]/30 border-[#008069]" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={member.avatar}
                    name={member.name}
                    size="sm"
                    color={member.avatarColor}
                  />
                  <div className="text-xs text-left min-w-0">
                    <span className="font-bold text-[#111b21] block truncate text-xs leading-tight">
                      {member.name} {isMe && "(You)"}
                    </span>
                    <span className="text-[11px] font-medium text-[#667781] block truncate mt-0.5">
                      {member.phone || member.statusText || "No phone number"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isTargetAdmin && (
                    <span className="px-2 py-0.5 rounded-md bg-[#008069]/15 text-[#008069] border border-[#008069]/30 text-[10px] font-bold uppercase tracking-wider">
                      Group admin
                    </span>
                  )}
                  {!isMe && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMemberMenuId(isMenuOpen ? null : mid);
                      }}
                      className="p-1 rounded-lg text-[#667781] hover:text-[#111b21] hover:bg-slate-100 cursor-pointer transition-all shrink-0"
                      title="Member options"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? "rotate-180 text-[#008069]" : ""}`}
                      />
                    </button>
                  )}
                </div>
              </div>

              {isMenuOpen && !isMe && (
                <div className="absolute right-0 top-full mt-1.5 z-100 w-64 rounded-2xl bg-white text-[#111b21] border border-slate-200 shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 select-none">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActiveMemberMenuId(null);
                      const targetId = member._id?.toString() || member.id;
                      await createDirectChat(targetId);
                      showToast(
                        "Opening Direct Chat",
                        `Navigated to chat with ${member.name}.`,
                        "info",
                      );
                      if (onClose) onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl cursor-pointer transition-colors text-left"
                  >
                    <MessageSquare className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>Message {member.name}</span>
                  </button>
                  {amIAdmin && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setActiveMemberMenuId(null);
                        const targetId = member._id?.toString() || member.id;
                        if (isTargetAdmin) {
                          if (await dismissGroupAdmin(group.id, targetId))
                            showToast(
                              "Admin Dismissed",
                              `${member.name} is no longer admin.`,
                              "info",
                            );
                        } else {
                          if (await makeGroupAdmin(group.id, targetId))
                            showToast(
                              "Admin Assigned",
                              `${member.name} is now admin.`,
                              "success",
                            );
                        }
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl cursor-pointer transition-colors text-left"
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>
                        {isTargetAdmin
                          ? "Dismiss as group admin"
                          : "Make group admin"}
                      </span>
                    </button>
                  )}
                  {amIAdmin && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setActiveMemberMenuId(null);
                        const targetId = member._id?.toString() || member.id;
                        if (await removeFromGroup(group.id, targetId))
                          showToast(
                            "Member Removed",
                            `${member.name} was removed.`,
                            "warning",
                          );
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors text-left border-t border-slate-100 mt-1 pt-2.5"
                    >
                      <UserMinus className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>Remove {member.name}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const NewContactModal = ({
  isOpen,
  onClose,
  allUsers,
  user,
  handleStartDirectChat,
}) => {
  const [contactSearch, setContactSearch] = useState("");
  if (!isOpen) return null;
  const filteredUsers = filterCandidateUsers(
    allUsers,
    user?.id || user?._id?.toString(),
    contactSearch,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setContactSearch("");
        onClose();
      }}
      title="Start New Chat"
      size="md"
    >
      <div className="space-y-4 text-left p-1 select-none">
        <div className="relative">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667781] h-4.5 w-4.5 my-auto" />
          <input
            type="text"
            placeholder="Search user by name or phone number..."
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            className="block w-full rounded-xl bg-[#f0f4f8] border border-slate-200/80 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-xs py-2.5 pl-10 pr-4 outline-none text-[#111b21] placeholder-[#667781] font-medium"
          />
        </div>
        <div className="max-h-64 overflow-y-auto border border-slate-200/80 rounded-xl p-2 space-y-1.5 bg-[#f8fafc] no-scrollbar">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#667781] font-semibold">
              No users found
            </div>
          ) : (
            filteredUsers.map((u) => {
              const targetId = u.id || u._id?.toString();
              return (
                <div
                  key={targetId}
                  onClick={() => {
                    setContactSearch("");
                    handleStartDirectChat(u);
                  }}
                  className="p-3 rounded-2xl flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors border bg-white border-slate-200/80 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={u.avatar}
                      name={u.name}
                      size="sm"
                      color={u.avatarColor}
                    />
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold text-[#111b21] truncate">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-[#667781] font-medium truncate mt-0.5">
                        {u.phone || "No phone number"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setContactSearch("");
              onClose();
            }}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 active:scale-95 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const SharedMediaTab = ({ messages, allUsers, authUser, showToast }) => {
  const [activeMediaTab, setActiveMediaTab] = useState("media");
  const [lightboxImage, setLightboxImage] = useState(null);

  const sharedImages = messages.filter(
    (m) => m.type === "image" && !m.isDeleted,
  );
  const sharedDocs = messages.filter((m) => m.type === "file" && !m.isDeleted);
  const sharedLinks = [];

  const urlRegex = /(https?:\/\/[^\s\n\r]+)/gi;
  messages.forEach((m) => {
    if (m.text && !m.isDeleted) {
      const matches = m.text.match(urlRegex);
      if (matches) {
        matches.forEach((url) => {
          let cleanUrl = url;
          if (/[.,;:!?)]$/.test(cleanUrl)) cleanUrl = cleanUrl.slice(0, -1);
          let displayDomain = cleanUrl;
          try {
            const parsed = new URL(cleanUrl);
            displayDomain =
              parsed.hostname +
              (parsed.pathname !== "/" ? parsed.pathname : "");
          } catch {
            displayDomain = cleanUrl.replace(/^https?:\/\/(www\.)?/, "");
          }
          if (displayDomain.length > 35)
            displayDomain = displayDomain.substring(0, 32) + "...";
          const sender =
            allUsers.find(
              (u) => u.id === m.senderId || u._id?.toString() === m.senderId,
            ) || (m.senderId === "user_me" ? authUser : null);
          if (!sharedLinks.some((l) => l.url === cleanUrl)) {
            sharedLinks.push({
              url: cleanUrl,
              display: displayDomain,
              senderName: sender ? sender.name : "Someone",
              timestamp: new Date(m.timestamp).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              }),
            });
          }
        });
      }
    }
  });

  const handleDownloadFile = async (e, url, name) => {
    e.preventDefault();
    if (!url || url === "#")
      return showToast("File Saved", "Mock file downloaded.", "success");
    try {
      showToast("Downloading", "Downloading file...", "info");
      const res = await fetch(url);
      const blob = await res.blob();
      const bUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = bUrl;
      link.download = name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(bUrl);
      showToast("Downloaded", "File downloaded successfully.", "success");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
      showToast("Opened", "Opened file preview in a new tab.", "info");
    }
  };

  const mediaTabs = [
    { id: "media", label: `Media (${sharedImages.length})`, icon: ImageIcon },
    { id: "files", label: `Files (${sharedDocs.length})`, icon: FileText },
    { id: "links", label: `Links (${sharedLinks.length})`, icon: LinkIcon },
  ];

  return (
    <div className="space-y-3 text-left">
      <div className="flex justify-center border-b border-slate-200/80 pb-2">
        <Tabs
          tabs={mediaTabs}
          activeTab={activeMediaTab}
          onChange={setActiveMediaTab}
          variant="pill"
        />
      </div>
      {activeMediaTab === "media" &&
        (sharedImages.length === 0 ? (
          <div className="p-8 text-center text-[#667781] font-semibold text-xs">
            No media shared yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto no-scrollbar">
            {sharedImages.map((m, idx) => (
              <div
                key={m.id || idx}
                className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-slate-100 border border-slate-200/60"
                onClick={() => setLightboxImage(m.attachmentUrl)}
              >
                <img
                  src={m.attachmentUrl}
                  alt="Shared media"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ))}
      {activeMediaTab === "files" &&
        (sharedDocs.length === 0 ? (
          <div className="p-8 text-center text-[#667781] font-semibold text-xs">
            No files shared yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
            {sharedDocs.map((m, idx) => (
              <div
                key={m.id || idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-[#008069] text-white flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#111b21] truncate">
                      {m.attachmentName || "Document"}
                    </p>
                    <p className="text-[10px] text-[#667781] font-semibold">
                      {m.attachmentSize || "File"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) =>
                    handleDownloadFile(e, m.attachmentUrl, m.attachmentName)
                  }
                  className="p-2 rounded-xl text-[#008069] hover:bg-[#008069]/10 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ))}
      {activeMediaTab === "links" &&
        (sharedLinks.length === 0 ? (
          <div className="p-8 text-center text-[#667781] font-semibold text-xs">
            No links shared yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
            {sharedLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-[#008069] text-white flex items-center justify-center shrink-0">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#008069] truncate underline">
                      {link.display}
                    </p>
                    <p className="text-[10px] text-[#667781] font-semibold">
                      Shared by {link.senderName} • {link.timestamp}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ))}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Fullscreen preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export const SidebarRightModals = ({
  isBlockModalOpen,
  setIsBlockModalOpen,
  isBlocked,
  recipientName,
  handleBlockToggle,
  isLeaveModalOpen,
  setIsLeaveModalOpen,
  groupName,
  groupMembersCount,
  amIAdmin,
  otherAdminsCount,
  groupOtherMembers,
  handleLeaveGroup,
  handleMakeAdminAndLeave,
  isDeleteGroupModalOpen,
  setIsDeleteGroupModalOpen,
  handleDeleteGroup,
  isReportModalOpen,
  setIsReportModalOpen,
  handleReportSubmit,
  reportReason,
  setReportReason,
  reportDetails,
  setReportDetails,
}) => {
  const [selectedPromoteAdminId, setSelectedPromoteAdminId] = useState("");
  const [isAdminPickerOpen, setIsAdminPickerOpen] = useState(false);
  const selectedMember =
    groupOtherMembers.find((m) => (m.id || m._id) === selectedPromoteAdminId) ||
    null;

  return (
    <>
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title={isBlocked ? "Unblock Contact" : "Block Contact"}
        size="sm"
      >
        <div className="space-y-4 text-left p-1 select-none">
          <p className="text-xs text-slate-600 font-medium">
            {isBlocked
              ? `Are you sure you want to unblock ${recipientName}?`
              : `Are you sure you want to block ${recipientName}?`}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsBlockModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={isBlocked ? "primary" : "danger"}
              onClick={handleBlockToggle}
            >
              {isBlocked ? "Unblock Contact" : "Block Contact"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title={`Leave "${groupName}" Group`}
        size="md"
      >
        <div className="space-y-4 text-left p-1 select-none">
          <p className="text-xs text-slate-600 font-medium">
            Are you sure you want to leave this group space?
          </p>
          {amIAdmin && otherAdminsCount === 0 && groupMembersCount > 1 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> You are the
                sole group admin!
              </p>
              <p className="text-[11px] text-amber-700 font-medium">
                Please assign a new admin before leaving:
              </p>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAdminPickerOpen((p) => !p)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-left shadow-sm hover:border-amber-300"
                >
                  {selectedMember ? (
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Avatar
                        src={
                          selectedMember.avatar || selectedMember.profileImage
                        }
                        name={selectedMember.name}
                        size="sm"
                        color={
                          selectedMember.avatarColor ||
                          "from-emerald-500 to-teal-600"
                        }
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {selectedMember.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {selectedMember.phone || "No phone number"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">
                      Select a member to make admin...
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${isAdminPickerOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isAdminPickerOpen && (
                  <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {groupOtherMembers.map((m) => {
                      const memberId = m.id || m._id;
                      const isSelected = memberId === selectedPromoteAdminId;
                      return (
                        <button
                          key={memberId}
                          type="button"
                          onClick={() => {
                            setSelectedPromoteAdminId(memberId);
                            setIsAdminPickerOpen(false);
                          }}
                          className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${isSelected ? "bg-amber-50" : "hover:bg-slate-50"}`}
                        >
                          <Avatar
                            src={m.avatar || m.profileImage}
                            name={m.name}
                            size="sm"
                            color={
                              m.avatarColor || "from-emerald-500 to-teal-600"
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {m.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {m.phone || "No phone number"}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-black text-amber-700">
                              Selected
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsLeaveModalOpen(false)}
            >
              Cancel
            </Button>
            {amIAdmin && otherAdminsCount === 0 && groupMembersCount > 1 ? (
              <Button
                variant="danger"
                disabled={!selectedPromoteAdminId}
                onClick={async () => {
                  await handleMakeAdminAndLeave(selectedPromoteAdminId);
                  setSelectedPromoteAdminId("");
                }}
              >
                Assign & Leave
              </Button>
            ) : (
              <Button variant="danger" onClick={handleLeaveGroup}>
                Leave Group
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteGroupModalOpen}
        onClose={() => setIsDeleteGroupModalOpen(false)}
        title={`Delete "${groupName}" Group`}
        size="sm"
      >
        <div className="space-y-4 text-left p-1 select-none">
          <p className="text-xs text-slate-600 font-medium">
            Are you sure you want to permanently delete the "{groupName}" group?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteGroupModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteGroup}>
              Delete Group
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={`Report ${recipientName}`}
        size="sm"
      >
        <form
          onSubmit={handleReportSubmit}
          className="space-y-4 text-left p-1 select-none"
        >
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
              Reason
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
            >
              <option value="spam">Spam & Unsolicited Messages</option>
              <option value="harassment">Harassment & Bullying</option>
              <option value="hate">Hate Speech & Abuse</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
              Additional Details
            </label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Provide extra details..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none min-h-17.5 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export const ReactionDetailsModal = ({
  isOpen,
  message,
  onClose,
  getSenderProfile,
  addReaction,
}) => {
  const [selectedEmojiTab, setSelectedEmojiTab] = useState("all");

  if (
    !isOpen ||
    !message ||
    !message.emojiReactions ||
    message.emojiReactions.length === 0
  )
    return null;

  const reactions = message.emojiReactions;
  const totalCount = reactions.reduce(
    (sum, r) => sum + (r.count || (r.userIds ? r.userIds.length : 0)),
    0,
  );

  const allUserReactions = [];
  reactions.forEach((r) => {
    (r.userIds || []).forEach((uId) => {
      allUserReactions.push({ userId: uId, emoji: r.emoji });
    });
  });

  const displayedReactions =
    selectedEmojiTab === "all"
      ? allUserReactions
      : allUserReactions.filter((r) => r.emoji === selectedEmojiTab);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 10 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200/80 overflow-hidden text-left flex flex-col max-h-[75vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>Message Reactions</span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {totalCount}
              </span>
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Emoji Filter Tabs */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50/50">
            <button
              onClick={() => setSelectedEmojiTab("all")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedEmojiTab === "all"
                  ? "bg-[#008069] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              All ({totalCount})
            </button>
            {reactions.map((r, idx) => {
              const count = r.count || (r.userIds ? r.userIds.length : 0);
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedEmojiTab(r.emoji)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    selectedEmojiTab === r.emoji
                      ? "bg-[#008069] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  <span className="text-sm leading-none">{r.emoji}</span>
                  <span>{count}</span>
                </button>
              );
            })}
          </div>

          {/* List of Users */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar min-h-40">
            {displayedReactions.length === 0 ? (
              <div className="p-8 text-center text-xs font-semibold text-slate-400">
                No reactions found.
              </div>
            ) : (
              displayedReactions.map((item, idx) => {
                const profile =
                  typeof getSenderProfile === "function"
                    ? getSenderProfile(item.userId)
                    : { name: item.userId === "user_me" ? "You" : "User" };
                const isMe =
                  item.userId === "user_me" || profile.name === "You";

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isMe && typeof addReaction === "function") {
                        addReaction(message.id, item.emoji);
                        onClose();
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                      isMe
                        ? "bg-emerald-50/60 hover:bg-emerald-100/60 cursor-pointer"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={profile.avatar}
                        name={profile.name}
                        size="sm"
                        color={profile.avatarColor}
                      />
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {isMe ? "You" : profile.name}
                        </p>
                        {isMe && (
                          <p className="text-[10px] font-semibold text-[#008069]">
                            Tap to remove reaction
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xl shrink-0 pl-2">{item.emoji}</span>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ChatHeaderBar;
