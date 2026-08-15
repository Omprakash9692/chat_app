import React from 'react';
import { Calendar, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';



export const AdminReportsList = ({
  adminReports = [],
  reports = [],
  reportFilter = 'all',
  setReportFilter,
  handleDismissReport,
  handleResolveReport
}) => {
  const reportsList = (adminReports && adminReports.length > 0) ? adminReports : (reports || []);

  const reportsData = reportsList.filter(r => {
    if (reportFilter === 'pending') return r.status === 'pending';
    if (reportFilter === 'resolved') return r.status === 'resolved';
    if (reportFilter === 'dismissed') return r.status === 'dismissed';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end mb-2 select-none">
        {['all', 'pending', 'resolved', 'dismissed'].map(filter => (
          <button
            key={filter}
            onClick={() => setReportFilter(filter)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${reportFilter === filter ? 'bg-slate-950 text-white shadow-sm border border-transparent' : 'bg-white border border-slate-200 text-slate-700 hover:text-black'}`}
          >{filter} reports</button>
        ))}
      </div>

      <div className="space-y-4 text-left">
        {reportsData.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-extrabold bg-white/80 border border-slate-200/60 rounded-3xl">
            No compliance reports found for the selected filter.
          </div>
        ) : (
          reportsData.map((rep) => {
            const reporterName = rep.reporterName || 'Unknown User';
            const reportedName = rep.reportedName || 'Unknown User';
            const reporterPhone = rep.reporterPhone || null;
            const reportedPhone = rep.reportedPhone || null;
            const date = rep.timestamp ? new Date(rep.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recently';
            
            const reportId = rep.id || rep._id;
            const isResolved = rep.status === 'resolved';
            const isDismissed = rep.status === 'dismissed';
            const isPending = rep.status === 'pending' || (!isResolved && !isDismissed);

            const borderClass = isResolved
              ? 'border-l-emerald-500 border-slate-200/80'
              : isDismissed
              ? 'border-l-slate-400 border-slate-200/80'
              : 'border-l-amber-500 border-slate-200/80';

            const badgeClass = isResolved
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              : isDismissed
              ? 'bg-slate-100 text-slate-600 border border-slate-200'
              : 'bg-amber-50 text-amber-600 border border-amber-100';

            return (
              <div
                key={reportId}
                className={`glass-premium rounded-[32px] p-6 bg-white/80 border hover-glow-card relative shadow-[0_15px_30px_rgba(15,23,42,0.03)] flex flex-col md:flex-row justify-between gap-6 items-start md:items-center border-l-4 ${borderClass}`}
              >
                <div className="space-y-3.5 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${badgeClass}`}>
                      {rep.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {date}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <span className="font-black text-slate-900">{reporterName}</span>{' '}
                      {reporterPhone && (
                        <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-bold">({reporterPhone})</span>
                      )}{' '}
                      reported{' '}
                      <span className="font-black text-slate-900">{reportedName}</span>{' '}
                      {reportedPhone && (
                        <span className="text-[11px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-bold">({reportedPhone})</span>
                      )}{' '}
                      for: <span className="font-bold text-rose-500">{rep.reason}</span>
                    </p>
                    <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 border-l-[3px] border-l-rose-400 text-xs italic font-semibold text-slate-800 select-text leading-relaxed">
                      "{rep.messageText}"
                    </div>
                  </div>
                </div>

                {isPending ? (
                  <div className="flex gap-2.5 shrink-0 select-none w-full md:w-auto">
                    <button
                      onClick={() => handleDismissReport(reportId)}
                      className="flex-1 md:flex-none text-center px-4 py-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 font-bold rounded-xl text-slate-700 transition-all text-xs cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                    >Dismiss Ticket</button>
                    <button
                      onClick={() => handleResolveReport(reportId)}
                      className="flex-1 md:flex-none text-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition-all text-xs cursor-pointer hover:scale-105 active:scale-95 shadow-md shadow-emerald-600/10 inline-flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="h-4 w-4" /> Resolve Report
                    </button>
                  </div>
                ) : isResolved ? (
                  <div className="shrink-0 select-none">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Resolved
                    </span>
                  </div>
                ) : (
                  <div className="shrink-0 select-none">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-extrabold">
                      <XCircle className="h-4 w-4 text-slate-400" /> Dismissed
                    </span>
                  </div>
                )}
              </div>
            );
          }))}
      </div>
    </div>
  );
};

export default AdminReportsList;
