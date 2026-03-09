function formatTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms) {
  if (!ms || ms < 0) return '0m';
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function ProductivitySummary({ stats }) {
  if (!stats) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 animate-pulse">
        <div className="h-5 bg-slate-700 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-slate-700/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const items = [
    { label: 'Total Uploads Today', value: stats.totalUploadsToday ?? 0 },
    { label: 'Total Drafts Today', value: stats.totalDraftsToday ?? 0 },
    { label: 'Last Activity', value: formatTime(stats.lastActivityAt) },
    { label: 'Working Time Today', value: formatDuration(stats.workingTimeMs) },
  ];

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 transition-all duration-200 hover:border-slate-600/50">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Today&apos;s Work Summary
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg bg-slate-700/30 px-4 py-3 border border-slate-600/30"
          >
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="text-lg font-semibold text-white mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductivitySummary;
