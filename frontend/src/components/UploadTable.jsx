function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

const actionLabels = {
  start_work: 'เริ่มทำงาน',
  stop_work: 'หยุดทำงาน',
  upload: 'Upload',
  draft: 'Update',
  export: 'Export',
  open_project: 'Open Project',
};

function UploadTable({ activities }) {
  const list = (Array.isArray(activities) ? activities : []).filter(
    (a) => ['start_work', 'stop_work', 'upload', 'draft', 'export', 'open_project'].includes(a.type)
  );
  const latestId = list.length ? list[0].id : null;

  const getAction = (activity) => {
    if (activity.type === 'draft') return 'Update';
    return actionLabels[activity.type] || activity.type;
  };

  const getDraft = (activity) => {
    if (!activity.draft_number) return '-';
    return `Draft ${activity.draft_number}`;
  };

  const badgeClass = (type) => {
    const map = {
      start_work: 'bg-blue-500/20 text-blue-400',
      stop_work: 'bg-slate-500/20 text-slate-400',
      upload: 'bg-green-500/20 text-green-400',
      draft: 'bg-amber-500/20 text-amber-400',
      export: 'bg-violet-500/20 text-violet-400',
      open_project: 'bg-cyan-500/20 text-cyan-400',
    };
    return map[type] || 'bg-slate-500/20 text-slate-400';
  };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-700/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">File Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Draft</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">ยังไม่มีกิจกรรม</td>
              </tr>
            ) : (
              list.map((row) => (
                <tr
                  key={row.id}
                  className={`border-t border-slate-700/50 transition-colors ${
                    row.id === latestId ? 'bg-emerald-500/10' : 'hover:bg-slate-700/20'
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-slate-300">{formatTime(row.created_at)}</td>
                  <td className="px-4 py-3 text-sm text-slate-200 font-medium">
                    {row.file_name || (row.type === 'start_work' || row.type === 'stop_work' ? '-' : '-')}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{getDraft(row)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${badgeClass(row.type)}`}>
                      {getAction(row)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UploadTable;
