import React, { useState } from 'react';
import { Users, ChevronDown, MessageSquare, ShieldCheck, UserMinus, UserPlus, Check, X } from 'lucide-react';
import { Avatar } from '../../../components/ui/ui';

export const GroupMembersList = ({
  group,
  allUsers,
  user,
  makeGroupAdmin,
  dismissGroupAdmin,
  removeFromGroup,
  createDirectChat,
  showToast,
  onClose,
  handleJoinRequest,
  setIsAddMembersModalOpen
}) => {
  const [activeMemberMenuId, setActiveMemberMenuId] = useState(null);

  if (!group) return null;

  const myRealId = user?.id || user?._id?.toString();
  const amIAdmin = (group.adminIds || []).some(id => {
    const idStr = typeof id === 'object' ? (id?._id?.toString() || id?.id) : id?.toString();
    const myStr = user?._id?.toString() || user?.id;
    return idStr === 'user_me' || idStr === myRealId || (myStr && idStr === myStr);
  });

  return (
    <div className="p-4 bg-[#f0f4f8] border-b border-slate-200/80 text-left relative">

      {/* Backdrop click outside to close popover menu */}
      {activeMemberMenuId && (
        <div
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setActiveMemberMenuId(null)}
        />
      )}

      {/* Pending Join Requests Section for Admins */}
      {amIAdmin && group.joinRequests && group.joinRequests.length > 0 && (
        <div className="mb-4 p-3 rounded-2xl bg-[#008069]/5 border border-[#008069]/20 space-y-2">
          <h4 className="text-xs font-extrabold text-[#008069] flex items-center gap-1.5 tracking-wide uppercase">
            <Users className="h-4 w-4 text-[#008069]" />
            Pending Join Requests ({group.joinRequests.length})
          </h4>
          <div className="space-y-2">
            {group.joinRequests.map((req) => {
              const reqUser = typeof req.user === 'object' ? req.user : allUsers.find(u => u.id === req.user || u._id?.toString() === req.user);
              if (!reqUser) return null;

              const reqUserRealId = reqUser.id || reqUser._id?.toString() || req.user;
              const requestedByObj = req.requestedBy === 'user_me' ? user : allUsers.find(u => u.id === req.requestedBy || u._id?.toString() === req.requestedBy);

              return (
                <div key={req.id || reqUserRealId} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#008069]/25 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={reqUser.avatar} name={reqUser.name} size="sm" color={reqUser.avatarColor} />
                    <div className="text-xs min-w-0 text-left">
                      <span className="font-extrabold text-[#111b21] block truncate leading-tight">
                        {reqUser.name}
                      </span>
                      <span className="text-[11px] font-medium text-[#667781] block truncate mt-0.5">
                        Added by {requestedByObj?.name || 'Member'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        const success = await handleJoinRequest(group.id, reqUserRealId, 'approve');
                        if (success) {
                          showToast("Member Approved", `${reqUser.name} has been added to the group.`, "success");
                        }
                      }}
                      className="p-2 rounded-xl bg-[#008069] text-white hover:bg-[#006e5a] transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                      title="Approve Member"
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const success = await handleJoinRequest(group.id, reqUserRealId, 'reject');
                        if (success) {
                          showToast("Request Rejected", `Join request for ${reqUser.name} was rejected.`, "info");
                        }
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
          <Users className="h-4 w-4 text-[#008069]" />
          Members list ({group.memberIds.length})
        </h4>

        <button
          type="button"
          onClick={() => setIsAddMembersModalOpen?.(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#008069]/10 text-[#008069] border border-[#008069]/20 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide hover:bg-[#008069]/15 transition-colors cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add members
        </button>
      </div>

      <div className="space-y-2">
        {group.memberIds.map(mid => {
          const isMe = mid === 'user_me';
          const member = isMe ? user : allUsers.find(u => u.id === mid || u._id?.toString() === mid);
          if (!member) return null;

          const memberRealId = member.id || member._id?.toString();

          const isTargetAdmin = (group.adminIds || []).some(id => {
            const idStr = typeof id === 'object' ? (id?._id?.toString() || id?.id) : id?.toString();
            return idStr === mid || idStr === memberRealId || (isMe && idStr === 'user_me') || (member?._id && idStr === member._id.toString());
          });

          const isMenuOpen = activeMemberMenuId === mid;

          return (
            <div key={mid} className={`relative ${isMenuOpen ? 'z-50' : 'z-1'}`}>
              <div
                onClick={() => {
                  if (!isMe) {
                    setActiveMemberMenuId(isMenuOpen ? null : mid);
                  }
                }}
                className={`flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-all ${!isMe ? 'cursor-pointer hover:bg-slate-50 hover:border-[#008069]/40' : 'cursor-default'
                  } ${isMenuOpen ? 'ring-2 ring-[#008069]/30 border-[#008069]' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={member.avatar} name={member.name} size="sm" color={member.avatarColor} />
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
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-[#008069]' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {/* WhatsApp style Member Context Action Dropdown Menu */}
              {isMenuOpen && !isMe && (
                <div className="absolute right-0 top-full mt-1.5 z-[100] w-64 rounded-2xl bg-white text-[#111b21] border border-slate-200 shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 select-none">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActiveMemberMenuId(null);
                      const targetId = member._id?.toString() || member.id;
                      await createDirectChat(targetId);
                      showToast("Opening Direct Chat", `Navigated to chat with ${member.name}.`, "info");
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
                          const success = await dismissGroupAdmin(group.id, targetId);
                          if (success) {
                            showToast("Admin Dismissed", `${member.name} is no longer a group admin.`, "info");
                          } else {
                            showToast("Action Failed", "Could not revoke admin status.", "danger");
                          }
                        } else {
                          const success = await makeGroupAdmin(group.id, targetId);
                          if (success) {
                            showToast("Admin Assigned", `${member.name} is now a group admin.`, "success");
                          } else {
                            showToast("Action Failed", "Could not assign admin permissions.", "danger");
                          }
                        }
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl cursor-pointer transition-colors text-left"
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isTargetAdmin ? "Dismiss as group admin" : "Make group admin"}</span>
                    </button>
                  )}

                  {amIAdmin && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setActiveMemberMenuId(null);
                        const targetId = member._id?.toString() || member.id;
                        const success = await removeFromGroup(group.id, targetId);
                        if (success) {
                          showToast("Member Removed", `${member.name} was removed from space.`, "warning");
                        } else {
                          showToast("Action Failed", "Could not remove member.", "danger");
                        }
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
