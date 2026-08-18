import React from "react";
import EmojiPicker from "emoji-picker-react";
import {
  Check,
  CheckCheck,
  Edit2,
  Reply,
  Forward,
  Pin,
  Copy,
  Trash2,
  Download,
  Smile,
  ChevronDown,
  Plus,
  AlertTriangle,
  Info,
  FileText,
  Phone,
} from "lucide-react";
import { Avatar } from "../../../components/ui/ui";
import { SimulatedVoicePlayer } from "./SimulatedVoicePlayer";

const renderTextWithLinks = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
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
}) => {
  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const isDirect = activeChat.type === "direct";

  return (
    <div
      id={msg.id}
      className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[70%] transition-colors duration-500 rounded-xl p-0.5 ${isMe ? "ml-auto flex-row-reverse text-right" : "mr-auto text-left"}`}
    >
      {/* Avatar */}
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
        {/* Sender Name tag */}
        {!isMe && activeChat.type !== "direct" && (
          <span className="text-[11px] font-bold text-[#008069] tracking-tight block ml-0.5 mb-0.5">
            {sender.name}
          </span>
        )}

        {/* Message Bubble Container */}
        <div className="relative group flex flex-col max-w-full">
          {/* Hover / Touch action dropdown trigger button */}
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
              className={`
              absolute top-1.5 right-1.5 p-1 rounded-md transition-all z-20 cursor-pointer shadow-xs pointer-events-auto
              ${
                activeMsgMenuId === msg.id
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100"
              }
              ${
                isMe
                  ? "text-slate-500 hover:text-slate-900 hover:bg-black/10 bg-emerald-100/50"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 bg-white/70"
              }
            `}
              title="Message Options"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Standalone Full Emoji Picker Popover for this specific message */}
          {showFullEmojiPickerMsgId === msg.id &&
            (() => {
              const isNearBottom =
                filteredMessagesCount >= 4 &&
                index >= filteredMessagesCount - 2;
              return (
                <>
                  <div
                    className="fixed inset-0 z-[95] bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullEmojiPickerMsgId(null);
                    }}
                  />
                  <div
                    className={`
                  absolute z-[100] ${isMe ? "right-0" : "left-0"} 
                  ${isNearBottom ? "bottom-full mb-2 top-auto" : "top-full mt-2 bottom-auto"} 
                  shadow-2xl rounded-2xl overflow-hidden border border-slate-200/90 bg-white animate-in fade-in zoom-in-95
                `}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EmojiPicker
                      theme="light"
                      onEmojiClick={(emojiData) => {
                        addReaction(msg.id, emojiData.emoji);
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
              );
            })()}

          {/* WhatsApp Context Dropdown Menu */}
          {activeMsgMenuId === msg.id &&
            (() => {
              const isNearBottom =
                filteredMessagesCount >= 4 &&
                index >= filteredMessagesCount - 2;
              return (
                <div
                  ref={msgMenuRef}
                  onClick={(e) => e.stopPropagation()}
                  className={`
                absolute z-50 bg-white text-[#111b21] rounded-xl shadow-2xl border border-slate-200/90 py-1.5 w-48 text-xs font-semibold select-none animate-in fade-in zoom-in-95 max-h-[70vh] overflow-y-auto no-scrollbar
                ${isMe ? "right-0" : "left-0"}
                ${isNearBottom ? "bottom-full mb-1 top-auto" : "top-full mt-1 bottom-auto"}
              `}
                >
                  {/* Quick reaction bar toggle */}
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

                  <button
                    onClick={() => {
                      setReplyMessage(msg);
                      setActiveMsgMenuId(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition-colors text-left text-[#111b21]"
                  >
                    <Reply className="h-4 w-4 text-[#667781]" />
                    Reply
                  </button>

                  {msg.text && (
                    <button
                      onClick={() => {
                        handleCopyMsgText(msg.text);
                        setActiveMsgMenuId(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition-colors text-left text-[#111b21]"
                    >
                      <Copy className="h-4 w-4 text-[#667781]" />
                      Copy
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowEmojiPickerMsgId(
                        showEmojiPickerMsgId === msg.id ? null : msg.id,
                      );
                      setShowFullEmojiPickerMsgId(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition-colors text-left text-[#111b21]"
                  >
                    <Smile className="h-4 w-4 text-[#667781]" />
                    React
                  </button>

                  <button
                    onClick={() => {
                      setForwardMessage(msg);
                      setActiveMsgMenuId(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition-colors text-left text-[#111b21]"
                  >
                    <Forward className="h-4 w-4 text-[#667781]" />
                    Forward
                  </button>

                  <button
                    onClick={() => {
                      handleTogglePinMessage(msg);
                      setActiveMsgMenuId(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition-colors text-left text-[#111b21]"
                  >
                    <Pin className="h-4 w-4 text-[#667781]" />
                    {(activeChat?.pinnedMessageIds || []).some(
                      (p) => p.id === msg.id,
                    )
                      ? "Unpin"
                      : "Pin"}
                  </button>

                  {!isMe && (
                    <button
                      onClick={() => {
                        setActiveMsgMenuId(null);
                        const targetUser = getSenderProfile(msg.senderId);
                        if (typeof reportUser === "function" && targetUser) {
                          reportUser(
                            targetUser.id || targetUser._id,
                            msg.text || "[media attachment]",
                            "message",
                          );
                        }
                        showToast(
                          "Report Submitted",
                          "Message reported to administrator for review.",
                          "warning",
                        );
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition-colors text-left text-amber-600 font-bold"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Report
                    </button>
                  )}

                  {isMe && !isDirect && (
                    <button
                      onClick={() => {
                        setMsgInfoTarget(msg);
                        setActiveMsgMenuId(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition-colors text-left text-[#008069] font-bold"
                    >
                      <Info className="h-4 w-4" />
                      Message Info
                    </button>
                  )}

                  {isMe &&
                    Date.now() - new Date(msg.timestamp).getTime() <=
                      24 * 60 * 60 * 1000 && (
                      <button
                        onClick={() => {
                          setEditingMessage(msg);
                          setInputText(msg.text);
                          setActiveMsgMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition-colors text-left text-[#111b21]"
                      >
                        <Edit2 className="h-4 w-4 text-[#667781]" />
                        Edit
                      </button>
                    )}

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      setTargetDeleteMessage(msg);
                      setDeleteModalOpen(true);
                      setActiveMsgMenuId(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition-colors text-left text-rose-600 font-bold"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              );
            })()}

          {/* Bubble background classes */}
          <div
            className={`
        pl-3.5 pr-8 py-2 rounded-2xl text-xs sm:text-xs leading-relaxed max-w-full text-left shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] relative break-words [overflow-wrap:anywhere] [word-break:break-word]
        ${
          isMe
            ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-xs"
            : "bg-white text-[#111b21] rounded-tl-xs border border-slate-200/50"
        }
        ${msg.isDeleted ? "italic text-slate-400 bg-slate-50 border-dashed pr-3.5" : ""}
        ${msg.emojiReactions && msg.emojiReactions.length > 0 ? "pb-3.5 mb-1" : ""}
      `}
          >
            {/* Forwarded indicator */}
            {msg.isForwarded && (
              <div
                className={`flex items-center gap-1 mb-1 text-[9px] font-bold tracking-wide uppercase italic ${isMe ? "text-indigo-300" : "text-slate-400"}`}
              >
                <Forward className="h-2.5 w-2.5" />
                <span>Forwarded</span>
              </div>
            )}

            {/* Reply preview row */}
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

            {/* Text content */}
            {msg.text && (
              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word]">
                {renderTextWithLinks(msg.text)}
              </p>
            )}

            {/* Image attachment rendering */}
            {msg.type === "image" && msg.attachmentUrl && (
              <div className="relative mt-1 max-w-full sm:max-w-[240px] overflow-hidden rounded-lg cursor-zoom-in border-0">
                <img
                  src={msg.attachmentUrl}
                  alt={msg.attachmentName || "Attachment"}
                  className="object-cover h-40 w-full hover:scale-105 transition-transform duration-300"
                  onClick={() => setLightboxImage(msg.attachmentUrl)}
                />
              </div>
            )}

            {/* PDF / Document Attachment card */}
            {msg.type === "file" && (
              <a
                href={msg.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={msg.attachmentName}
                onClick={(e) =>
                  handleDownloadFile(e, msg.attachmentUrl, msg.attachmentName)
                }
                className="flex items-center justify-between gap-3 p-3 mt-1.5 rounded-xl border-0 bg-black/5 hover:bg-black/10 transition-colors duration-200 cursor-pointer max-w-full sm:max-w-[260px] group/file text-slate-800 decoration-transparent"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 group-hover/file:bg-red-500/20 transition-colors">
                    <FileText className="h-5.5 w-5.5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h5 className="text-xs font-bold truncate text-slate-800 group-hover/file:text-indigo-600 transition-colors">
                      {msg.attachmentName}
                    </h5>
                    <p className="text-[10px] text-slate-450 font-semibold mt-0.5">
                      {msg.attachmentSize}
                    </p>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-200/50 shrink-0 transition-colors">
                  <Download className="h-4 w-4" />
                </div>
              </a>
            )}

            {/* Voice waveform player */}
            {msg.type === "audio" && (
              <SimulatedVoicePlayer
                duration={msg.attachmentDuration}
                url={msg.attachmentUrl}
              />
            )}

            {/* Voice Call History Card */}
            {msg.type === "call" && (
              <div className="flex items-center gap-3 p-3 mt-1.5 rounded-xl border-0 bg-black/5 text-slate-800 max-w-[245px]">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.text.includes("Missed")
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-emerald-500/10 text-emerald-500"
                  }`}
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

            {/* WhatsApp style Reaction Badge under message / photo */}
            {msg.emojiReactions &&
              msg.emojiReactions.length > 0 &&
              (() => {
                const totalReactionCount = msg.emojiReactions.reduce(
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
                    }}
                    className={`
                    absolute -bottom-3 ${isMe ? "right-2" : "left-2"} z-20
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                    bg-[#ffffff] border border-[#d1d7db] text-[#111b21]
                    shadow-[0_1px_3px_rgba(11,20,26,0.18)] select-none cursor-pointer
                    hover:scale-105 active:scale-95 transition-all duration-150
                  `}
                    title={
                      myReaction
                        ? `Reacted with ${myReaction.emoji} - Click to see all`
                        : "View reactions"
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
                    {totalReactionCount > 1 && (
                      <span className="text-[10px] font-extrabold text-[#54656f] pl-0.5">
                        {totalReactionCount}
                      </span>
                    )}
                  </div>
                );
              })()}
          </div>

          {/* Timestamp & read receipt info */}
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

export default MessageBubble;
