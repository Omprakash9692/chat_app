/* eslint-disable no-unused-vars */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import {
  Send, Smile, Mic, Image as ImageIcon, FileText, X, Reply, Edit2, UserX,
  AlertTriangle, Lock, Plus, Loader2
} from 'lucide-react';
import { Tooltip } from '../../../components/ui/ui';

export const ChatInputBar = ({
  inputText, setInputText, handleInputChange, handleKeyPress, handleSend, replyMessage, setReplyMessage, editingMessage, setEditingMessage,
  isRecording, startRecording, stopRecording, cancelRecording, recordTimer, showEmojiPicker, setShowEmojiPicker, emojiPickerRef,
  showAttachmentMenu, setShowAttachmentMenu, attachmentMenuRef, handleSimulateAttachment, pendingAttachment, handleRemovePendingAttachment,
  isUploadingAttachment, uploadingFileName, uploadingFileType, imageInputRef, fileInputRef, handleImageSelection, handleFileSelection,
  isBlocked, isGroupBlocked, isMessagingRestricted, targetUnblockId, unblockUser, recipient, showToast, getSenderProfile
}) => {
  return (
    <div className="border-t border-slate-200/80 bg-white/86 backdrop-blur-xl shrink-0">
      <div className="max-w-3xl md:max-w-4xl mx-auto p-3 flex flex-col gap-2 w-full">

        {/* Hidden inputs */}
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

        {/* Reply preview bar active */}
        {replyMessage && (
          <div className="bg-slate-50 px-3 py-2 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Reply className="h-4 w-4 text-indigo-500 shrink-0" />
              <div className="truncate text-left">
                <span className="font-bold text-slate-700 block">
                  Replying to {replyMessage.senderId === 'user_me' ? 'You' : (getSenderProfile ? getSenderProfile(replyMessage.senderId).name : 'User')}
                </span>
                <span className="text-[11px] text-slate-450 truncate">{replyMessage.text || 'Media attachment'}</span>
              </div>
            </div>
            <button onClick={() => setReplyMessage(null)} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Editing indicator bar active */}
        {editingMessage && (
          <div className="bg-indigo-500/5 px-3 py-2 rounded-xl flex items-center justify-between border border-indigo-500/10 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Edit2 className="h-4 w-4 text-indigo-500 shrink-0" />
              <div className="truncate text-left text-indigo-650">
                <span className="font-bold block">Editing message</span>
                <span className="text-[11px] truncate opacity-90">{editingMessage.text}</span>
              </div>
            </div>
            <button onClick={() => { setEditingMessage(null); setInputText(''); }} className="p-1 rounded-md text-slate-400 hover:text-slate-650">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Recorder bar panel */}
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
                  if (targetUnblockId && typeof unblockUser === 'function') {
                    unblockUser(targetUnblockId);
                    if (showToast) showToast("Contact Unblocked", `${recipient?.name || 'Contact'} is now unblocked.`, "success");
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
            <span>This group has been suspended by the administrator. Sending messages is disabled.</span>
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
                Recording: {Math.floor(recordTimer / 60)}:{(recordTimer % 60).toString().padStart(2, '0')}
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

            {/* Pending Selected Attachment Preview Banner */}
            <AnimatePresence>
              {pendingAttachment && !isUploadingAttachment && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="mb-2.5 p-2.5 rounded-2xl bg-white border border-emerald-500/40 shadow-md flex items-center justify-between gap-3 text-xs select-none relative"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {pendingAttachment.type === 'image' && pendingAttachment.previewUrl ? (
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
                        <span className="font-extrabold text-[#111b21] truncate max-w-[220px]">
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

            {/* Active File Upload Progress Loader */}
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
                      {uploadingFileType === 'image' ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#111b21] truncate">
                          Uploading {uploadingFileType === 'image' ? 'Image' : 'PDF / Document'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#008069]/15 text-[#008069] animate-pulse shrink-0">
                          Uploading...
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-[#667781] truncate mt-0.5">
                        {uploadingFileName || 'Processing attachment...'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pr-1">
                    <Loader2 className="h-5 w-5 animate-spin text-[#008069]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Single Unified Pill Capsule */}
            <div className="flex items-center gap-1.5 w-full bg-white rounded-full px-3 py-1.5 border border-slate-200/80 shadow-2xs">

              {/* 1. Plus (+) Attachments trigger */}
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
                        onClick={() => handleSimulateAttachment('image')}
                        className="flex items-center gap-2.5 px-3 py-2 w-full text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors font-semibold"
                      >
                        <ImageIcon className="h-4 w-4 text-emerald-600" /> Share Image
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateAttachment('pdf')}
                        className="flex items-center gap-2.5 px-3 py-2 w-full text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors font-semibold"
                      >
                        <FileText className="h-4 w-4 text-rose-500" /> Share PDF Document
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. Emoji menu trigger */}
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
                        onEmojiClick={(emojiData) => {
                          setInputText(prev => prev + emojiData.emoji);
                        }}
                        skinTonesDisabled={false}
                        searchPlaceholder="Search emoji..."
                        height={320}
                        width={Math.min(300, typeof window !== 'undefined' ? window.innerWidth - 32 : 300)}
                        previewConfig={{ showPreview: false }}
                        theme="light"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Text Input Field inside pill */}
              <div className="flex-1 min-w-0 flex items-center px-1">
                <textarea
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message"
                  className="w-full bg-transparent text-xs outline-none text-[#111b21] placeholder-[#667781] max-h-[100px] min-h-[20px] resize-none leading-relaxed no-scrollbar font-medium py-1"
                  rows={1}
                />
              </div>

              {/* 4. Mic / Send Icon on far right inside pill */}
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

export default ChatInputBar;
