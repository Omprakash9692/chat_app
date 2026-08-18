import React from "react";
import { ArrowLeft, Search, Info, X } from "lucide-react";
import { Avatar } from "../../../components/ui/ui";

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
}) => {
  return (
    <div className="h-16 px-3 sm:px-4 border-b border-[#e9edef] bg-[#f0f2f5] flex items-center justify-between z-10 shrink-0 select-none">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              selectChat(null);
            }
          }}
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
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              selectChat(null);
            }
          }}
          className="hidden sm:flex p-2 rounded-xl cursor-pointer text-slate-450 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-200/60 ml-1"
          title="Close chat"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeaderBar;
