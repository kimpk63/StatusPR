function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function SystemLogs({ logs }) {
  const list = Array.isArray(logs) ? logs : [];

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">System Logs</span>
        <span className="text-xs text-slate-500">(Drive, Reporter, Watcher)</span>
      </div>
      <div className="max-h-48 overflow-y-auto font-mono text-xs">
        {list.length === 0 ? (
          <div className="px-4 py-6 text-center text-slate-500">ไม่มี log</div>
        ) : (
          list.map((log) => (
            <div
              key={log.id}
              className={`px-4 py-2 border-b border-slate-700/30 flex gap-3 ${
                log.level === 'error' ? 'bg-red-500/5 text-red-300' : 'text-slate-400'
              }`}
            >
              <span className="text-slate-500 shrink-0">{formatTime(log.created_at)}</span>
              <span className="text-amber-400/80 shrink-0">[{log.source}]</span>
              <span className="break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SystemLogs;
