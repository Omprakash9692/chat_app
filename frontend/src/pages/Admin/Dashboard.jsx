import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, AlertTriangle, ShieldAlert, Shield, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Tabs } from '../../components/ui/ui';
import { chatApi } from '../../services/chatApi';
import { MultiMetricBarChart } from './components/MultiMetricBarChart';
import { UserManagementTable } from './components/UserManagementTable';
import { GroupManagementTable } from './components/GroupManagementTable';
import { AdminReportsList } from './components/AdminReportsList';

export const Dashboard = () => {
  const { allUsers, fetchDbUsers, updateCachedUser, removeCachedUser, authFetch, user } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminStats, setAdminStats] = useState(null);
  const [groupsList, setGroupsList] = useState([]);
  const [adminReports, setAdminReports] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState('all');
  const [reportActionInProgress, setReportActionInProgress] = useState({});
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', confirmText: 'Confirm', variant: 'danger', onConfirm: null });

  const pollIntervalRef = useRef(null);

  const fetchAdminStats = useCallback(async () => {
    try {
      const res = await chatApi.fetchAdminStats(authFetch);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.stats) setAdminStats(result.data.stats);
      }
    } catch (err) {
      console.error("fetchAdminStats error:", err);
    }
  }, [authFetch]);

  const fetchAdminGroups = useCallback(async () => {
    try {
      const res = await chatApi.fetchAdminGroups(authFetch);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.groups) setGroupsList(result.data.groups);
      }
    } catch (err) {
      console.error("fetchAdminGroups error:", err);
    }
  }, [authFetch]);

  const fetchAdminReports = useCallback(async () => {
    try {
      const res = await chatApi.fetchReports(authFetch);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.reports) setAdminReports(result.data.reports);
      }
    } catch (err) {
      console.error("fetchAdminReports error:", err);
    }
  }, [authFetch]);

  const refreshAllData = useCallback(() => {
    if (typeof fetchDbUsers === 'function') fetchDbUsers();
    fetchAdminStats();
    fetchAdminGroups();
    fetchAdminReports();
  }, [fetchDbUsers, fetchAdminStats, fetchAdminGroups, fetchAdminReports]);

  useEffect(() => {
    refreshAllData();
    pollIntervalRef.current = setInterval(refreshAllData, 30000);
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [refreshAllData]);

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const handleToggleBlockUserConfirmed = (userId, userName, isCurrentlyBlocked) => {
    setConfirmModal({
      isOpen: true,
      title: isCurrentlyBlocked ? 'Unban User Account' : 'Ban User Account',
      message: isCurrentlyBlocked ? `Are you sure you want to restore access for ${userName}?` : `Are you sure you want to ban ${userName}? They will be logged out immediately.`,
      confirmText: isCurrentlyBlocked ? 'Unban User' : 'Ban User',
      variant: isCurrentlyBlocked ? 'warning' : 'danger',
      onConfirm: async () => {
        try {
          const res = await chatApi.adminBlockUser(authFetch, userId);
          if (res.ok) {
            const result = await res.json();
            updateCachedUser(result.data?.user);
            // void fetchAdminStats();
            showToast(isCurrentlyBlocked ? "User Unbanned" : "User Banned", `${userName} status updated.`, isCurrentlyBlocked ? "success" : "warning");
          } else {
            throw new Error('Unable to update user status');
          }
        } catch {
          showToast("Error", "Failed to update user ban status.", "error");
        }
      }
    });
  };

  const handleDeleteUserConfirmed = (userId, userName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to PERMANENTLY delete ${userName}? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await chatApi.adminDeleteUser(authFetch, userId);
          if (res.ok) {
            removeCachedUser(userId);
            void fetchAdminStats();
            showToast("User Deleted", `${userName} was deleted from database.`, "success");
          } else {
            throw new Error('Unable to delete user');
          }
        } catch {
          showToast("Error", "Failed to delete user account.", "error");
        }
      }
    });
  };

  const handleToggleBlockGroupConfirmed = (groupId, groupName, isCurrentlyBlocked) => {
    setConfirmModal({
      isOpen: true,
      title: isCurrentlyBlocked ? 'Unblock Group' : 'Suspend & Block Group',
      message: isCurrentlyBlocked ? `Are you sure you want to lift suspension on "${groupName}"?` : `Are you sure you want to suspend "${groupName}"? Members won't be able to send messages.`,
      confirmText: isCurrentlyBlocked ? 'Unblock Group' : 'Suspend Group',
      variant: isCurrentlyBlocked ? 'warning' : 'danger',
      onConfirm: async () => {
        try {
          const res = await chatApi.adminBlockGroup(authFetch, groupId);
          if (res.ok) {
            const result = await res.json();
            const updatedBlocked = result.data?.group?.isBlocked ?? !isCurrentlyBlocked;
            setGroupsList(prev => prev.map(g => g.id === groupId ? { ...g, isBlocked: updatedBlocked } : g));
            showToast(updatedBlocked ? "Group Suspended" : "Group Unblocked", `"${groupName}" status updated.`, updatedBlocked ? "warning" : "success");
            void fetchAdminStats();
          } else {
            const errJson = await res.json().catch(() => ({}));
            showToast("Action Failed", errJson.message || "Failed to update group status.", "error");
          }
        } catch {
          showToast("Error", "Failed to update group status.", "error");
        }
      }
    });
  };

  const handleDeleteGroupConfirmed = (groupId, groupName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Group Permanently',
      message: `Are you sure you want to delete group "${groupName}"? All messages and attachments will be removed.`,
      confirmText: 'Delete Group',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await chatApi.adminDeleteGroup(authFetch, groupId);
          if (res.ok) {
            setGroupsList(prev => prev.filter(g => g.id !== groupId));
            showToast("Group Deleted", `"${groupName}" was deleted.`, "success");
            void fetchAdminStats();
          } else {
            const errJson = await res.json().catch(() => ({}));
            showToast("Action Failed", errJson.message || "Failed to delete group.", "error");
          }
        } catch {
          showToast("Error", "Failed to delete group.", "error");
        }
      }
    });
  };

  const updateReportStatus = async (reportId, status) => {
    if (reportActionInProgress[reportId]) return;

    setReportActionInProgress(prev => ({ ...prev, [reportId]: status }));
    try {
      const res = await chatApi.updateReportStatus(authFetch, reportId, status);
      if (!res.ok) {
        throw new Error('Unable to update report status');
      }

      setAdminReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
      showToast(
        status === 'resolved' ? 'Report Resolved' : 'Report Dismissed',
        status === 'resolved' ? 'Ticket marked as resolved.' : 'Ticket dismissed.',
        status === 'resolved' ? 'success' : 'info'
      );
      void fetchAdminStats();
    } catch {
      showToast('Error', `Failed to ${status === 'resolved' ? 'resolve' : 'dismiss'} report.`, 'error');
    } finally {
      setReportActionInProgress(prev => {
        const { [reportId]: _, ...remaining } = prev;
        return remaining;
      });
    }
  };

  const handleResolveReport = (reportId) => updateReportStatus(reportId, 'resolved');
  const handleDismissReport = (reportId) => updateReportStatus(reportId, 'dismissed');

  if (!user || (user.role !== 'Admin' && user.role !== 'admin')) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center select-none">
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200/60 text-rose-600 mb-4 shadow-sm">
          <ShieldAlert className="h-10 w-10 animate-bounce" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6 font-medium leading-relaxed">
          You need administrator rights to view compliance analytics and manage platform accounts.
        </p>
      </div>
    );
  }

  const realUsersList = (allUsers || []).filter(u => u.role !== 'Admin' && u.role !== 'admin');
  const realBlockedUsersCount = realUsersList.filter(u => u.isBlocked || u.statusText === 'Blocked').length;
  const realBlockedGroupsCount = (groupsList || []).filter(g => g.isBlocked).length;
  const realPendingReportsCount = (adminReports || []).filter(r => r.status === 'pending').length;

  const totalUsersCount = adminStats?.totalUsers ?? realUsersList.length;
  const totalGroupsCount = adminStats?.totalGroups ?? groupsList.length;
  const totalReportsCount = adminStats?.totalReports ?? adminReports.length;

  const cardStats = [
    { label: "Total Platform Users", value: totalUsersCount, icon: Users, subtext: `${realBlockedUsersCount} Banned`, color: "text-indigo-600", bg: "bg-indigo-50/80", border: "border-indigo-100" },
    { label: "Active Chat Groups", value: totalGroupsCount, icon: MessageSquare, subtext: `${realBlockedGroupsCount} Suspended`, color: "text-emerald-600", bg: "bg-emerald-50/80", border: "border-emerald-100" },
    { label: "Pending Compliance Tickets", value: realPendingReportsCount, icon: ShieldAlert, subtext: `${totalReportsCount} Total Reports`, color: "text-rose-600", bg: "bg-rose-50/80", border: "border-rose-100" }
  ];

  const adminTabs = [
    { id: 'dashboard', label: 'Overview Analytics' },
    { id: 'users', label: `Users (${realUsersList.length})` },
    { id: 'groups', label: `Groups (${groupsList.length})` },
    { id: 'reports', label: `Compliance (${realPendingReportsCount})` }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/60 font-sans relative">
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 text-left space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className={`p-2.5 rounded-2xl ${confirmModal.variant === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-slate-950">{confirmModal.title}</h3>
            </div>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button onClick={closeConfirmModal} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button
                onClick={() => {
                  if (typeof confirmModal.onConfirm === 'function') confirmModal.onConfirm();
                  closeConfirmModal();
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black text-white cursor-pointer shadow-sm ${confirmModal.variant === 'danger' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'}`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-3 shrink-0 select-none shadow-[0_2px_20px_rgba(15,23,42,0.02)]">
        <div className="text-left w-full lg:w-auto shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600 shrink-0" /> Compliance Dashboard
            </h2>
            <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-[0.24em] mt-1">Admin Audit Panel — Realtime System Insights</p>
          </div>
        </div>
        <div className="flex items-center overflow-x-auto no-scrollbar w-full lg:w-auto justify-start lg:justify-center pb-1 lg:pb-0">
          <Tabs tabs={adminTabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />
        </div>
        <div className="hidden lg:block w-[140px]" />
      </div>

      {/* Scrollable content */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 no-scrollbar">
        {/* TAB: OVERVIEW / DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
              {cardStats.map((stat, idx) => (
                <motion.div key={idx} whileHover={{ y: -4, scale: 1.008 }} transition={{ duration: 0.25 }} className="glass-premium rounded-[28px] p-6 border border-slate-200/60 bg-white/80 text-left shadow-[0_15px_30px_rgba(15,23,42,0.03)] hover-glow-card flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">{stat.label}</span>
                    <div className={`h-9 w-9 rounded-xl ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color} shadow-xs`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mt-5">
                    <span className="text-3xl font-black text-slate-950">{stat.value.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-600 font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50">{stat.subtext}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <MultiMetricBarChart
              weekData={adminStats?.weekData || []}
              monthDataMap={adminStats?.monthDataMap || {}}
              availableMonths={adminStats?.availableMonths || []}
              yearData={adminStats?.yearData || []}
            />
          </div>
        )}

        {/* TAB: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <UserManagementTable
            usersList={realUsersList}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            userFilter={userFilter}
            setUserFilter={setUserFilter}
            handleToggleBlockUserConfirmed={handleToggleBlockUserConfirmed}
            handleDeleteUserConfirmed={handleDeleteUserConfirmed}
          />
        )}

        {/* TAB: MANAGE GROUPS */}
        {activeTab === 'groups' && (
          <GroupManagementTable
            groupsList={groupsList}
            groupSearch={groupSearch}
            setGroupSearch={setGroupSearch}
            groupFilter={groupFilter}
            setGroupFilter={setGroupFilter}
            handleToggleBlockGroupConfirmed={handleToggleBlockGroupConfirmed}
            handleDeleteGroupConfirmed={handleDeleteGroupConfirmed}
          />
        )}

        {/* TAB: COMPLIANCE REPORTS */}
        {activeTab === 'reports' && (
          <AdminReportsList
            adminReports={adminReports}
            reports={adminReports || []}
            reportFilter={reportFilter}
            setReportFilter={setReportFilter}
            reportActionInProgress={reportActionInProgress}
            handleDismissReport={handleDismissReport}
            handleResolveReport={handleResolveReport}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
