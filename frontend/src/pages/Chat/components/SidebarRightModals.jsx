import React, { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { Modal, Button, Avatar } from '../../../components/ui/ui';

export const SidebarRightModals = ({
  isBlockModalOpen, setIsBlockModalOpen, isBlocked, recipientName, handleBlockToggle,
  isLeaveModalOpen, setIsLeaveModalOpen, groupName, groupMembersCount, amIAdmin, otherAdminsCount, groupOtherMembers, handleLeaveGroup, handleMakeAdminAndLeave,
  isDeleteGroupModalOpen, setIsDeleteGroupModalOpen, handleDeleteGroup,
  isReportModalOpen, setIsReportModalOpen, handleReportSubmit, reportReason, setReportReason, reportDetails, setReportDetails
}) => {
  const [selectedPromoteAdminId, setSelectedPromoteAdminId] = useState('');
  const [isAdminPickerOpen, setIsAdminPickerOpen] = useState(false);
  const [isConfirmAssignLeaveOpen, setIsConfirmAssignLeaveOpen] = useState(false);
  const selectedMember = groupOtherMembers.find(m => (m.id || m._id) === selectedPromoteAdminId) || null;
  return (
    <>
      {/* Block User Modal */}
      <Modal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} title={isBlocked ? "Unblock Contact" : "Block Contact"} size="sm">
        <div className="space-y-4 text-left p-1 select-none">
          <p className="text-xs text-slate-600 font-medium">
            {isBlocked
              ? `Are you sure you want to unblock ${recipientName}? They will be able to send you direct messages.`
              : `Are you sure you want to block ${recipientName}? They will no longer be able to send you direct messages.`}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsBlockModalOpen(false)}>Cancel</Button>
            <Button variant={isBlocked ? "primary" : "danger"} onClick={handleBlockToggle}>
              {isBlocked ? "Unblock Contact" : "Block Contact"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Leave Group Modal */}
      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title={`Leave "${groupName}" Group`} size="md">
        <div className="space-y-4 text-left p-1 select-none">
          <p className="text-xs text-slate-600 font-medium">
            Are you sure you want to leave this group space? You will no longer receive new messages from group members.
          </p>

          {amIAdmin && otherAdminsCount === 0 && groupMembersCount > 1 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> You are the sole group admin!
              </p>
              <p className="text-[11px] text-amber-700 font-medium">Please assign a new admin before leaving:</p>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAdminPickerOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-amber-300"
                >
                  {selectedMember ? (
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Avatar src={selectedMember.avatar || selectedMember.profileImage} name={selectedMember.name} size="sm" color={selectedMember.avatarColor || 'from-emerald-500 to-teal-600'} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{selectedMember.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{selectedMember.phone || 'No phone number'}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">Select a member to make admin...</span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isAdminPickerOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAdminPickerOpen && (
                  <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {groupOtherMembers.map(m => {
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
                          className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${isSelected ? 'bg-amber-50' : 'hover:bg-slate-50'}`}
                        >
                          <Avatar src={m.avatar || m.profileImage} name={m.name} size="sm" color={m.avatarColor || 'from-emerald-500 to-teal-600'} />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">{m.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{m.phone || 'No phone number'}</div>
                          </div>
                          {isSelected && <span className="text-[10px] font-black text-amber-700">Selected</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
            {amIAdmin && otherAdminsCount === 0 && groupMembersCount > 1 ? (
              <Button
                variant="danger"
                disabled={!selectedPromoteAdminId}
                onClick={() => setIsConfirmAssignLeaveOpen(true)}
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

      {/* Confirm Assign & Exit Modal */}
      <Modal isOpen={isConfirmAssignLeaveOpen} onClose={() => setIsConfirmAssignLeaveOpen(false)} title="Confirm Admin Assignment & Exit" size="sm">
        <div className="space-y-4 text-left p-1 select-none">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Are you sure you want to assign <span className="font-extrabold text-slate-900">{selectedMember?.name}</span> as the new group admin and exit <span className="font-extrabold text-slate-900">"{groupName}"</span>?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsConfirmAssignLeaveOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={async () => {
                setIsConfirmAssignLeaveOpen(false);
                await handleMakeAdminAndLeave(selectedPromoteAdminId);
                setSelectedPromoteAdminId('');
              }}
            >
              Confirm & Exit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Group Modal */}
      <Modal isOpen={isDeleteGroupModalOpen} onClose={() => setIsDeleteGroupModalOpen(false)} title={`Delete "${groupName}" Group`} size="sm">
        <div className="space-y-4 text-left p-1 select-none">
          <p className="text-xs text-slate-600 font-medium">
            Are you sure you want to permanently delete the "{groupName}" group? All message history will be deleted for all members.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteGroupModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteGroup}>Delete Group</Button>
          </div>
        </div>
      </Modal>

      {/* Report User Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={`Report ${recipientName}`} size="sm">
        <form onSubmit={handleReportSubmit} className="space-y-4 text-left p-1 select-none">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Reason</label>
            <select
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
            >
              <option value="spam">Spam & Unsolicited Messages</option>
              <option value="harassment">Harassment & Bullying</option>
              <option value="hate">Hate Speech & Abuse</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Additional Details</label>
            <textarea
              value={reportDetails}
              onChange={e => setReportDetails(e.target.value)}
              placeholder="Provide extra details for admin reviewer..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none min-h-[70px] resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="danger">Submit Report</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
