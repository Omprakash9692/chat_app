import React, { useState } from 'react';
import { X, Mail, Phone, UserX, UserPlus, AlertTriangle, LogOut, Trash, Pencil, Star, StarOff, ArrowLeft, Search, MoreVertical, Shield, FileText, ChevronRight } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar, Badge, Modal, Button } from '../../components/ui/ui';
import { SharedMediaTab } from './components/SharedMediaTab';
import { GroupMembersList } from './components/GroupMembersList';
import { EditGroupDetailsModal } from './components/EditGroupDetailsModal';
import { AddGroupMembersModal } from './components/AddGroupMembersModal';
import { SidebarRightModals } from './components/SidebarRightModals';

export const SidebarRight = ({ onClose }) => {
  const {
    activeChatId, getActiveChat, getChatMessages, groups, blockUser, unblockUser, blockedUserIds, reportUser, leaveGroup, deleteGroup,
    makeGroupAdmin, dismissGroupAdmin, removeFromGroup, addMembersToGroup, updateGroupProfile, uploadFile, createDirectChat, updateGroupPermissions,
    handleJoinRequest, selectChat, starredMsgIds, toggleStarMessage, clearAllStarredMessages
  } = useChat();
  const { user: authUser, allUsers } = useAuth();
  const { showToast } = useNotifications();

  // Dialog triggers
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);

  // Add members & Edit group modal state
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);

  // Starred Messages view states
  const [showStarredView, setShowStarredView] = useState(false);
  const [starredSearchQuery, setStarredSearchQuery] = useState('');
  const [isUnstarMenuOpen, setIsUnstarMenuOpen] = useState(false);
  const [isUnstarConfirmModalOpen, setIsUnstarConfirmModalOpen] = useState(false);

  const activeChat = getActiveChat();
  const messages = getChatMessages(activeChatId);

  if (!activeChat) return null;

  const isDirect = activeChat.type === 'direct';

  const recipient = isDirect
    ? allUsers.find(u => u.id === activeChat.participants.find(p => p !== 'user_me'))
    : null;
  const group = !isDirect
    ? groups.find(g => g.id === activeChat.groupId || g.id === activeChat.id)
    : null;

  const title = isDirect ? recipient?.name : group?.name;

  const handleBlockToggle = () => {
    if (isDirect && recipient) {
      const isBlocked = blockedUserIds.includes(recipient.id);
      if (isBlocked) {
        unblockUser(recipient.id);
        showToast("Access Restored", `${recipient.name} is now unblocked.`, "success");
      } else {
        blockUser(recipient.id);
        showToast("Access Revoked", `${recipient.name} has been blocked.`, "warning");
      }
      setIsBlockModalOpen(false);
    }
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (isDirect && recipient) {
      reportUser(recipient.id, messages[messages.length - 1]?.text || 'No message history', `${reportReason}: ${reportDetails}`);
      showToast("Report Submitted", "Your complaint has been queued for administrator review.", "success");
      setIsReportModalOpen(false);
      setReportDetails('');
    }
  };

  const handleLeaveGroup = async () => {
    if (group) {
      const success = await leaveGroup(group.id);
      if (success) {
        showToast("Space Left", `You exited the "${group.name}" group.`, "info");
      } else {
        showToast("Action Failed", "Could not leave group space. If you are sole admin, appoint another admin first.", "danger");
      }
      setIsLeaveModalOpen(false);
      if (onClose) onClose();
    }
  };

  const handleMakeAdminAndLeave = async (targetUserId) => {
    if (!group) return;
    const promoted = await makeGroupAdmin(group.id, targetUserId);
    if (promoted) {
      const success = await leaveGroup(group.id);
      if (success) {
        showToast("Admin Assigned & Exited", `New admin assigned and you exited "${group.name}".`, "success");
        setIsLeaveModalOpen(false);
        if (onClose) onClose();
      } else {
        showToast("Action Failed", "Assigned admin but could not leave space.", "danger");
      }
    } else {
      showToast("Action Failed", "Could not assign new admin.", "danger");
    }
  };

  const handleDeleteGroup = async () => {
    if (group) {
      const success = await deleteGroup(group.id);
      if (success) {
        showToast("Group Deleted", `The "${group.name}" group has been fully deleted.`, "warning");
      } else {
        showToast("Action Failed", "Could not delete group.", "danger");
      }
      setIsDeleteGroupModalOpen(false);
      if (onClose) onClose();
    }
  };

  const myRealId = authUser?.id || authUser?._id?.toString();
  const amIAdmin = !isDirect && group && (group.adminIds || []).some(id => {
    const idStr = typeof id === 'object' ? (id?._id?.toString() || id?.id) : id?.toString();
    const myStr = authUser?._id?.toString() || authUser?.id;
    return idStr === 'user_me' || idStr === myRealId || (myStr && idStr === myStr);
  });

  const handleTogglePermission = async (key, newValue) => {
    if (!group || !amIAdmin) return;
    const currentPermissions = group.permissions || { sendMessages: true, addMembers: true, approveMembers: false };
    const updatedPermissions = { ...currentPermissions, [key]: newValue };
    const success = await updateGroupPermissions(group.id, updatedPermissions);
    if (success) {
      showToast("Permissions Updated", "Group space permissions updated.", "success");
    } else {
      showToast("Update Failed", "Could not update group permissions.", "danger");
    }
  };

  const isBlocked = isDirect && recipient ? blockedUserIds.includes(recipient.id) : false;

  const starredMessagesList = messages.filter(m => starredMsgIds.includes(m.id)).filter(m => {
    if (!starredSearchQuery.trim()) return true;
    const query = starredSearchQuery.toLowerCase();
    const sender = allUsers.find(u => u.id === m.senderId);
    return (m.text && m.text.toLowerCase().includes(query)) || (sender && sender.name.toLowerCase().includes(query));
  });

  // Render Full-page Starred Messages View
  if (showStarredView) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f0f4f8] border-l border-slate-200/80">
        {/* Top Header */}
        <div className="h-16 px-4 border-b border-[#e9edef] flex items-center justify-between shrink-0 select-none bg-[#f0f2f5]">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowStarredView(false)} className="p-1.5 rounded-lg text-[#54656f] hover:text-[#111b21] hover:bg-slate-200/60 cursor-pointer transition-colors" title="Back to Contact Info">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h4 className="text-sm font-bold text-[#111b21]">Starred messages</h4>
          </div>

          <div className="relative">
            <button onClick={() => setIsUnstarMenuOpen(!isUnstarMenuOpen)} className="p-1.5 rounded-lg text-[#54656f] hover:text-[#111b21] hover:bg-slate-200/60 cursor-pointer transition-colors" title="More options">
              <MoreVertical className="h-5 w-5" />
            </button>

            {isUnstarMenuOpen && (
              <div className="absolute right-0 top-10 z-50 bg-white text-[#111b21] rounded-xl shadow-2xl border border-slate-200 py-1.5 w-40 text-xs font-semibold select-none animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setIsUnstarMenuOpen(false);
                    if (starredMsgIds.length === 0) {
                      showToast("No Starred Messages", "You have no starred messages to remove.", "info");
                      return;
                    }
                    setIsUnstarConfirmModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition-colors text-left text-[#111b21] cursor-pointer"
                >
                  <StarOff className="h-4 w-4 text-[#667781]" /> Unstar all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-200/80 bg-[#f0f4f8]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667781]" />
            <input
              type="text" placeholder="Search starred messages..." value={starredSearchQuery} onChange={(e) => setStarredSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-full bg-[#dce4ec] text-xs font-semibold text-[#111b21] placeholder-[#667781] border border-transparent focus:border-[#008069] focus:outline-none transition-all"
            />
            {starredSearchQuery && (
              <button onClick={() => setStarredSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[#667781] hover:text-[#111b21]">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Messages List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#f0f4f8]">
          {starredMessagesList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="h-14 w-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1">
                <Star className="h-7 w-7 fill-amber-500/20 text-amber-500" />
              </div>
              <h5 className="text-sm font-bold text-[#111b21]">No starred messages</h5>
              <p className="text-xs text-[#667781] max-w-xs leading-relaxed">
                {starredSearchQuery ? "No starred messages match your search filter." : "Hover over any message and select Star to save it here."}
              </p>
            </div>
          ) : (
            starredMessagesList.map((msg) => {
              const isMe = msg.senderId === 'user_me';
              const sender = isMe ? authUser : (allUsers.find(u => u.id === msg.senderId) || { name: 'Unknown User' });
              const recipientName = isDirect ? recipient?.name : group?.name;
              const dateStr = new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
              const timeStr = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={msg.id} className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-left transition-all hover:border-[#008069]/40 shadow-2xs relative group">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={sender.avatar} name={sender.name} size="xs" color={sender.avatarColor} />
                      <span className="text-xs font-bold text-[#111b21] truncate">
                        {sender.name} <span className="text-[#667781] font-normal">▸</span> {isMe ? recipientName : 'You'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-[#667781] font-semibold">{dateStr}</span>
                      <button onClick={() => toggleStarMessage(msg.id)} className="p-1 rounded-md text-[#667781] hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer" title="Unstar Message">
                        <StarOff className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#f0f4f8] p-3 rounded-xl border border-slate-200/60 text-xs text-[#111b21] leading-relaxed relative">
                    {msg.text && <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word]">{msg.text}</p>}
                    {msg.attachmentName && (
                      <div className="flex items-center gap-2 mt-1 text-indigo-600 font-semibold">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{msg.attachmentName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] text-slate-400 font-bold">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span>{timeStr}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Unstar All Confirmation Modal */}
        <Modal isOpen={isUnstarConfirmModalOpen} onClose={() => setIsUnstarConfirmModalOpen(false)} title="Unstar all messages?">
          <div className="space-y-4 py-2 text-left">
            <p className="text-xs text-slate-600 font-medium leading-relaxed">Are you sure you want to unstar all messages? This action will clear all saved starred messages.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsUnstarConfirmModalOpen(false)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={() => { clearAllStarredMessages(); setIsUnstarConfirmModalOpen(false); showToast("Messages Unstarred", "All starred messages cleared.", "success"); }}>Unstar all</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f0f4f8] border-l border-slate-200/80 select-none">
        {/* Top Header Bar */}
        <div className="h-16 px-4 border-b border-[#e9edef] bg-[#f0f2f5] flex items-center justify-between shrink-0 select-none">
          <h4 className="text-sm font-bold text-[#111b21] uppercase tracking-wider">{isDirect ? "Contact Details" : "Group Details"}</h4>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#54656f] hover:text-[#111b21] hover:bg-slate-200/60 cursor-pointer">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Main Details Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Profile Info Summary */}
          <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center bg-white border-b border-slate-200/80">
            <div className="mb-3.5 relative inline-block">
              <Avatar
                src={isDirect ? recipient?.avatar : group?.avatar} name={title} size="xl"
                color={isDirect ? recipient?.avatarColor : group?.avatarColor} className="shadow-sm ring-4 ring-slate-100"
              />
            </div>

            <div className="flex items-center justify-center gap-2 max-w-full">
              <h3 className="text-lg font-bold text-[#111b21] flex items-center gap-1.5 truncate">
                {title}
                {isDirect && recipient?.role === 'Admin' && <Badge variant="primary">Admin</Badge>}
              </h3>



              {amIAdmin && (
                <button
                  onClick={() => setIsEditGroupModalOpen(true)} title="Edit Group Profile"
                  className="p-1.5 rounded-full bg-[#f0f4f8] text-[#008069] hover:bg-[#e9edef] cursor-pointer transition-all shrink-0 hover:scale-110"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isDirect && <p className="text-[11px] text-[#008069] mt-1 font-bold uppercase tracking-wider">{recipient?.statusText || "Active Member"}</p>}
            <p className="text-xs text-[#54656f] mt-3 max-w-xs leading-relaxed font-medium">
              {isDirect ? recipient?.bio || "No biography available." : group?.description || "No space description provided."}
            </p>
          </div>

          {/* Direct Contact Detailed Parameters */}
          {isDirect && recipient && (
            <div className="p-4 bg-white border-b border-slate-200/80 text-left text-xs font-medium space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#008069]" />
                <div>
                  <span className="text-[10px] text-[#667781] block uppercase font-bold tracking-wider">Email Address</span>
                  <span className="text-[#111b21] font-bold select-all">{recipient.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <Phone className="h-4 w-4 text-[#008069]" />
                <div>
                  <span className="text-[10px] text-[#667781] block uppercase font-bold tracking-wider">Phone Number</span>
                  <span className="text-[#111b21] font-bold select-all">{recipient.phone || "Not provided"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Group Permissions Section */}
          {!isDirect && group && (
            <div className="p-4 bg-[#f0f4f8] border-b border-slate-200/80 text-left space-y-3.5 select-none">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111b21] flex items-center gap-1.5 tracking-wide uppercase">
                  <Shield className="h-4 w-4 text-[#008069]" /> Group permissions
                </h4>
                {!amIAdmin && <span className="text-[10px] font-bold text-[#667781] uppercase tracking-wider">Read-only</span>}
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="text-[10px] font-bold uppercase text-[#008069] tracking-wider">Members can</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#111b21] block truncate">Send new messages</span>
                    <span className="text-[10px] text-[#667781] block font-medium truncate mt-0.5">
                      {(group.permissions?.sendMessages !== false) ? "All members can send messages" : "Only admins can send messages"}
                    </span>
                  </div>
                  <button
                    type="button" disabled={!amIAdmin}
                    onClick={() => handleTogglePermission('sendMessages', (group.permissions?.sendMessages === false))}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${(group.permissions?.sendMessages !== false) ? 'bg-[#008069]' : 'bg-slate-300'} ${!amIAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#ffffff] shadow-md ring-0 transition duration-200 ease-in-out ${(group.permissions?.sendMessages !== false) ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Group Member List Sub-component */}
          {!isDirect && group && (
            <GroupMembersList
              group={group} allUsers={allUsers} user={authUser} makeGroupAdmin={makeGroupAdmin}
              dismissGroupAdmin={dismissGroupAdmin} removeFromGroup={removeFromGroup} createDirectChat={createDirectChat}
              selectChat={selectChat} showToast={showToast} onClose={onClose} handleJoinRequest={handleJoinRequest}
              setIsAddMembersModalOpen={setIsAddMembersModalOpen}
            />
          )}

          {/* Shared Media, Files & Links Section */}
          <div className="p-4 border-b border-slate-200/80 bg-white">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Shared Media & Docs</h4>
            <SharedMediaTab messages={messages} allUsers={allUsers} authUser={authUser} showToast={showToast} />
          </div>

          {/* Starred Messages Trigger Button */}
          <div className="p-4 border-b border-slate-200/80 bg-white">
            <button onClick={() => setShowStarredView(true)} className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors cursor-pointer text-left">
              <div className="flex items-center gap-2.5">
                <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                <span className="text-xs font-bold text-[#111b21]">Starred Messages</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="warning">{starredMessagesList.length}</Badge>
                <ChevronRight className="h-4 w-4 text-[#667781]" />
              </div>
            </button>
          </div>

          {/* Action Buttons: Block / Leave / Report */}
          <div className="p-4 bg-[#f0f4f8] space-y-2">
            {!isDirect ? (
              <button onClick={() => setIsLeaveModalOpen(true)} className="w-full py-3 rounded-2xl bg-rose-50 text-rose-600 font-extrabold text-xs border border-rose-200/80 hover:bg-rose-100 transition-all cursor-pointer flex items-center justify-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Leave Group Space</span>
              </button>
            ) : (
              <>
                <button onClick={() => setIsBlockModalOpen(true)} className={`w-full py-3 rounded-2xl font-extrabold text-xs border transition-all cursor-pointer flex items-center justify-center gap-2 ${isBlocked ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-200/80 hover:bg-rose-100'}`}>
                  <UserX className="h-4 w-4" />
                  <span>{isBlocked ? 'Unblock Contact' : 'Block Contact'}</span>
                </button>
                <button onClick={() => setIsReportModalOpen(true)} className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-200/80 hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Report Contact</span>
                </button>
              </>
            )}

            {!isDirect && amIAdmin && (
              <button onClick={() => setIsDeleteGroupModalOpen(true)} className="w-full py-3 rounded-2xl bg-rose-600 text-white font-extrabold text-xs hover:bg-rose-700 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md mt-2">
                <Trash className="h-4 w-4" />
                <span>Delete Group</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Modals */}
      <SidebarRightModals
        isBlockModalOpen={isBlockModalOpen} setIsBlockModalOpen={setIsBlockModalOpen} isBlocked={isBlocked} recipientName={recipient?.name || 'Contact'} handleBlockToggle={handleBlockToggle}
        isLeaveModalOpen={isLeaveModalOpen} setIsLeaveModalOpen={setIsLeaveModalOpen} groupName={group?.name || 'Group'} groupMembersCount={group?.memberIds?.length || 0} amIAdmin={amIAdmin}
        otherAdminsCount={!isDirect && group ? (group.adminIds || []).filter(id => id !== 'user_me' && id !== myRealId).length : 0}
        groupOtherMembers={!isDirect && group ? (group.memberIds || []).filter(id => id !== 'user_me' && id !== myRealId).map(id => allUsers.find(u => u.id === id || u._id?.toString() === id) || { id, name: "Member" }) : []}
        handleLeaveGroup={handleLeaveGroup} handleMakeAdminAndLeave={handleMakeAdminAndLeave} isDeleteGroupModalOpen={isDeleteGroupModalOpen} setIsDeleteGroupModalOpen={setIsDeleteGroupModalOpen}
        handleDeleteGroup={handleDeleteGroup} isReportModalOpen={isReportModalOpen} setIsReportModalOpen={setIsReportModalOpen} handleReportSubmit={handleReportSubmit}
        reportReason={reportReason} setReportReason={setReportReason} reportDetails={reportDetails} setReportDetails={setReportDetails}
      />

      <EditGroupDetailsModal isOpen={isEditGroupModalOpen} onClose={() => setIsEditGroupModalOpen(false)} group={group} updateGroupProfile={updateGroupProfile} uploadFile={uploadFile} showToast={showToast} />
      <AddGroupMembersModal isOpen={isAddMembersModalOpen} onClose={() => setIsAddMembersModalOpen(false)} group={group} allUsers={allUsers} user={authUser} addMembersToGroup={addMembersToGroup} showToast={showToast} />
    </>
  );
};

export default SidebarRight;

