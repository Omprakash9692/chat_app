import React, { useState } from 'react';
import { BarChart2, Calendar, ArrowLeft, Users, AlertTriangle } from 'lucide-react';

const getMonthWeeksFallback = (mIndex) => {
  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mName = monthNamesShort[mIndex] || "Month";

  const generateDays = (start, end) => {
    const days = [];
    for (let d = start; d <= end; d++) {
      days.push({ name: `${mName} ${d}`, date: `${mName} ${d}, 2026`, users: 0, groups: 0, reports: 0 });
    }
    return days;
  };

  return {
    weeks: [
      { id: "week1", name: "Week 1", date: `${mName} 1 - 7`, users: 0, groups: 0, reports: 0 },
      { id: "week2", name: "Week 2", date: `${mName} 8 - 14`, users: 0, groups: 0, reports: 0 },
      { id: "week3", name: "Week 3", date: `${mName} 15 - 21`, users: 0, groups: 0, reports: 0 },
      { id: "week4", name: "Week 4", date: `${mName} 22 - 28`, users: 0, groups: 0, reports: 0 },
      { id: "week5", name: "Week 5", date: `${mName} 29 - 31`, users: 0, groups: 0, reports: 0 }
    ],
    daysByWeek: {
      week1: generateDays(1, 7),
      week2: generateDays(8, 14),
      week3: generateDays(15, 21),
      week4: generateDays(22, 28),
      week5: generateDays(29, 31)
    }
  };
};

export const MultiMetricBarChart = ({ weekData, monthDataMap, availableMonths, yearData }) => {
  const [timeframe, setTimeframe] = useState('week');
  const currentMonthIdx = new Date().getMonth();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIdx);
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [hoverIndex, setHoverIndex] = useState(null);
  const [visibleSeries, setVisibleSeries] = useState({ users: true, groups: true, reports: true });

  const activeMonthsList = availableMonths && availableMonths.length > 0 ? availableMonths : [
    { index: 0, name: 'January' }, { index: 1, name: 'February' }, { index: 2, name: 'March' },
    { index: 3, name: 'April' }, { index: 4, name: 'May' }, { index: 5, name: 'June' },
    { index: 6, name: 'July' }, { index: 7, name: 'August' }
  ];

  React.useEffect(() => {
    if (availableMonths && availableMonths.length > 0) {
      const exists = availableMonths.some(m => m.index === selectedMonthIndex);
      if (!exists) {
        setSelectedMonthIndex(availableMonths[availableMonths.length - 1].index);
      }
    }
  }, [availableMonths]);

  let activeData = [];
  if (timeframe === 'week') {
    activeData = (weekData && weekData.length > 0) ? weekData : [];
  } else if (timeframe === 'month') {
    const rawMonthObj = monthDataMap
      ? (monthDataMap[selectedMonthIndex] || monthDataMap[String(selectedMonthIndex)])
      : null;

    let monthObj = null;
    if (rawMonthObj && Array.isArray(rawMonthObj)) {
      monthObj = { weeks: rawMonthObj, daysByWeek: {} };
    } else if (rawMonthObj && rawMonthObj.weeks) {
      monthObj = rawMonthObj;
    } else {
      monthObj = getMonthWeeksFallback(selectedMonthIndex);
    }

    if (selectedWeek === 'all') {
      activeData = monthObj.weeks || [];
    } else {
      activeData = (monthObj.daysByWeek && monthObj.daysByWeek[selectedWeek] && monthObj.daysByWeek[selectedWeek].length > 0)
        ? monthObj.daysByWeek[selectedWeek]
        : getMonthWeeksFallback(selectedMonthIndex).daysByWeek[selectedWeek] || [];
    }
  } else {
    activeData = (yearData && yearData.length > 0) ? yearData : [];
  }

  const data = activeData;

  const maxVal = Math.max(
    5,
    ...data.flatMap(d => [
      visibleSeries.users ? (d.users || 0) : 0,
      visibleSeries.groups ? (d.groups || 0) : 0,
      visibleSeries.reports ? (d.reports || 0) : 0
    ])
  );

  const W = 760, H = 260, padTop = 30, padBottom = 40, padLeft = 35, padRight = 20;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  const numSlots = Math.max(1, data.length);
  const slotW = chartW / numSlots;

  const handleMouseMove = (e) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    if (!svgRect.width) return;
    const mouseXInDOM = e.clientX - svgRect.left;
    const svgX = (mouseXInDOM / svgRect.width) * W;
    const idx = Math.floor((svgX - padLeft) / slotW);
    const clampedIdx = Math.max(0, Math.min(numSlots - 1, idx));
    setHoverIndex(clampedIdx);
  };

  const handleBarClick = (index) => {
    if (timeframe === 'month' && selectedWeek === 'all') {
      setSelectedWeek(`week${index + 1}`);
      setHoverIndex(null);
    }
  };

  const defaultIndex = React.useMemo(() => {
    if (!data || data.length === 0) return 0;
    if (timeframe === 'week') {
      const todayDayIndex = (new Date().getDay() + 6) % 7;
      return Math.min(todayDayIndex, data.length - 1);
    }
    return data.length - 1;
  }, [data, timeframe]);

  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[defaultIndex];

  const selectedMonthObj = activeMonthsList.find(m => m.index === selectedMonthIndex) || activeMonthsList[activeMonthsList.length - 1];
  const latestMonthObj = activeMonthsList[activeMonthsList.length - 1];
  const displayYear = selectedMonthObj?.year || latestMonthObj?.year || new Date().getUTCFullYear();

  const seriesConfig = [
    { key: 'users', label: 'Users', color: '#6366f1', icon: Users },
    { key: 'groups', label: 'Groups', color: '#10b981', icon: Users },
    { key: 'reports', label: 'Report Log', color: '#f43f5e', icon: AlertTriangle }
  ];

  const isTotalZero = data.every(d => (d.users || 0) === 0 && (d.groups || 0) === 0 && (d.reports || 0) === 0);

  return (
    <div className="glass-premium rounded-[24px] sm:rounded-[30px] p-4 sm:p-6 bg-white/85 border border-slate-200/60 text-left shadow-[0_15px_35px_rgba(15,23,42,0.03)] hover-glow-card flex flex-col gap-4 sm:gap-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none">
        <div>
          <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-indigo-600" />
            System Metrics Bar Chart
          </h3>
          <p className="text-[11px] text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
            {timeframe === 'week' && 'Showing Days of the Week (Mon – Sun)'}
            {timeframe === 'month' && selectedWeek === 'all' && `Showing 4 Weeks of ${selectedMonthObj?.name || 'Month'} 2026 (Click any week bar for daily breakdown)`}
            {timeframe === 'month' && selectedWeek !== 'all' && `Showing All Days of ${selectedWeek.toUpperCase()} in ${selectedMonthObj?.name || 'Month'} 2026`}
            {timeframe === 'year' && `Showing Real Database Metrics for 2026 (Jan – ${latestMonthObj?.shortName || 'Aug'})`}
            {isTotalZero && timeframe === 'month' && (
              <span className="text-[10px] text-amber-600 font-black bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                No activity recorded for this period
              </span>
            )}
          </p>
        </div>

        {/* Timeframe Buttons & Month/Week Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap select-none">
          {timeframe === 'month' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-indigo-50/80 px-3 py-1.5 rounded-2xl border border-indigo-200/80 shadow-xs">
                <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
                <select
                  value={selectedMonthIndex}
                  onChange={(e) => {
                    setSelectedMonthIndex(Number(e.target.value));
                    setSelectedWeek('all');
                    setHoverIndex(null);
                  }}
                  className="bg-transparent text-xs font-black text-indigo-950 outline-none cursor-pointer pr-1"
                >
                  {activeMonthsList.map(m => (
                    <option key={m.index} value={m.index} className="text-slate-900 font-medium">
                      {m.name} {m.year || displayYear}
                    </option>
                  ))}
                </select>
              </div>

              {/* Week Sub-Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-2xl shadow-xs">
                <select
                  value={selectedWeek}
                  onChange={(e) => {
                    setSelectedWeek(e.target.value);
                    setHoverIndex(null);
                  }}
                  className="bg-transparent text-xs font-black text-white outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="text-slate-900 font-medium">Overview (All Weeks)</option>
                  <option value="week1" className="text-slate-900 font-medium">Week 1 (Days 1–7)</option>
                  <option value="week2" className="text-slate-900 font-medium">Week 2 (Days 8–14)</option>
                  <option value="week3" className="text-slate-900 font-medium">Week 3 (Days 15–21)</option>
                  <option value="week4" className="text-slate-900 font-medium">Week 4 (Days 22–28)</option>
                  <option value="week5" className="text-slate-900 font-medium">Week 5 (Days 29–31/Rest)</option>
                </select>
              </div>

              {selectedWeek !== 'all' && (
                <button
                  onClick={() => setSelectedWeek('all')}
                  className="px-3 py-1.5 rounded-2xl text-xs font-black bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200/80 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Overview
                </button>
              )}
            </div>
          )}

          {timeframe === 'year' && (
            <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-2xl text-xs font-black shadow-xs">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>Year: {displayYear}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60">
            {[
              { id: 'week', label: 'Week (Days)' },
              { id: 'month', label: 'Month (Weeks)' },
              { id: 'year', label: 'Year (Months)' }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => { setTimeframe(tf.id); setSelectedWeek('all'); setHoverIndex(null); }}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${timeframe === tf.id
                  ? 'bg-slate-950 text-white shadow-md scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
                  }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend Toggles */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-bold select-none border-b border-slate-100 pb-3">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Legend:</span>
        {seriesConfig.map(s => (
          <button
            key={s.key}
            onClick={() => setVisibleSeries(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all cursor-pointer ${visibleSeries[s.key]
              ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-2xs'
              : 'bg-slate-50/40 border-slate-100 text-slate-400 line-through opacity-60'
              }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Grouped Bar SVG Visualization */}
      <div className="relative w-full overflow-x-auto no-scrollbar" style={{ height: 260 }}>
        <div className="min-w-[600px] sm:min-w-full h-full">
          <svg
            className="w-full h-full cursor-crosshair select-none"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
              const y = padTop + chartH * r;
              const gridVal = Math.round(maxVal * (1 - r));
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={W - padRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fontWeight="700"
                    fill="#94a3b8"
                  >
                    {gridVal}
                  </text>
                </g>
              );
            })}

            {/* Slots & Bars */}
            {data.map((d, i) => {
              const slotX = padLeft + i * slotW;
              const isHovered = hoverIndex === i;

              const activeSeriesCount = Object.values(visibleSeries).filter(Boolean).length || 1;
              const gap = 3;
              const availableW = Math.min(slotW * 0.75, 45);
              const barW = Math.max(4, (availableW - (activeSeriesCount - 1) * gap) / activeSeriesCount);
              const groupW = activeSeriesCount * barW + (activeSeriesCount - 1) * gap;
              const groupX = slotX + (slotW - groupW) / 2;

              let currentOffset = 0;

              return (
                <g key={i} onClick={() => handleBarClick(i)} className={timeframe === 'month' && selectedWeek === 'all' ? 'cursor-pointer' : ''}>
                  {isHovered && (
                    <rect
                      x={slotX + 2}
                      y={padTop - 5}
                      width={slotW - 4}
                      height={chartH + 10}
                      fill="rgba(99, 102, 241, 0.08)"
                      rx="10"
                    />
                  )}

                  {seriesConfig.map(s => {
                    if (!visibleSeries[s.key]) return null;
                    const val = d[s.key] || 0;
                    const barH = (val / maxVal) * chartH;
                    const barY = padTop + chartH - barH;
                    const barX = groupX + currentOffset;

                    currentOffset += barW + gap;

                    return (
                      <g key={s.key}>
                        <rect
                          x={barX}
                          y={barY}
                          width={barW}
                          height={Math.max(2, barH)}
                          rx={Math.min(4, barW / 2)}
                          fill={s.color}
                          opacity={isHovered ? 1 : 0.85}
                          className="transition-all duration-200"
                          style={{
                            filter: isHovered ? `drop-shadow(0 0 6px ${s.color}80)` : 'none'
                          }}
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* X-Axis Labels */}
          <div className="flex justify-between text-[11px] text-slate-500 font-extrabold uppercase tracking-wider px-8 mt-1 select-none">
            {data.map((d, i) => (
              <span
                key={i}
                onClick={() => handleBarClick(i)}
                className={`flex-1 text-center truncate px-0.5 ${hoverIndex === i ? 'text-indigo-600 font-black scale-110' : ''
                  } ${timeframe === 'month' && selectedWeek === 'all' ? 'cursor-pointer hover:underline' : ''}`}
              >
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Breakdown Hover Card */}
      {activePoint && (
        <div className="bg-slate-950 text-white rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-black">
                {timeframe === 'week' ? 'Day View' : timeframe === 'month' ? `${selectedMonthObj?.name || 'Month'} (${selectedWeek === 'all' ? 'Overview' : selectedWeek.toUpperCase()})` : `${displayYear} Year View`}
              </span>
              <h4 className="text-sm font-black text-white">
                {activePoint.date && activePoint.date.startsWith(activePoint.name)
                  ? activePoint.date
                  : `${activePoint.name}${activePoint.date ? ` (${activePoint.date})` : ''}`}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap w-full md:w-auto">
            {seriesConfig.map(s => {
              if (!visibleSeries[s.key]) return null;
              const periodVal = activePoint[s.key] || 0;

              return (
                <div key={s.key} className="flex flex-col select-none">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </div>
                  <div className="text-base font-black text-white pl-4 mt-0.5">
                    {periodVal.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiMetricBarChart;
