function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

const typeColors = {
  start_work: 'bg-blue-500',
  stop_work: 'bg-slate-500',
  upload: 'bg-green-500',
  draft: 'bg-amber-500',
  export: 'bg-violet-500',
  open_project: 'bg-cyan-500',
};

function TimelineItem({ activity, isLatest }) {
  const color = typeColors[activity.type] || 'bg-slate-400';

  return (
    <div
      className={`relative pl-6 pb-6 last:pb-0 transition-all duration-200 ${
        isLatest
          ? 'ring-1 ring-emerald-500/40 rounded-lg bg-emerald-500/10 -m-1 p-2 shadow-sm'
          : ''
      }`}
    >
      <div className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full ${color}`} />
      <div className="text-xs text-slate-500 font-medium">{formatTime(activity.created_at)}</div>
      <div className="text-slate-200 text-sm mt-0.5">{activity.description || activity.type}</div>
    </div>
  );
}

function ActivityTimeline({ activities, lastActivityAt }) {
  const list = Array.isArray(activities) ? activities : [];
  const latestId = list.length ? list[0].id : null;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 max-h-[420px] overflow-y-auto">
      {lastActivityAt && (
        <div className="mb-3 px-2 py-1.5 rounded-lg bg-slate-700/30 text-xs text-slate-400">
          Last Activity: <span className="text-emerald-400 font-medium">{formatTime(lastActivityAt)}</span>
        </div>
      )}
      {list.length === 0 ? (
        <p className="text-slate-500 text-sm py-4">ยังไม่มีกิจกรรม</p>
      ) : (
        list.map((a) => (
          <TimelineItem
            key={a.id}
            activity={a}
            isLatest={a.id === latestId}
          />
        ))
      )}
    </div>
  );
}

export default ActivityTimeline;
