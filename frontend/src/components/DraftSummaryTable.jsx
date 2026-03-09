function formatTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function DraftSummaryTable({ draftSummary }) {
  const list = Array.isArray(draftSummary) ? draftSummary : [];

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Draft Summary
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">File Name | Total Drafts | Last Update</p>
      </div>
      <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-700/50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-xs font-semibold text-slate-400">File Name</th>
              <th className="px-4 py-2 text-xs font-semibold text-slate-400">Total Drafts</th>
              <th className="px-4 py-2 text-xs font-semibold text-slate-400">Last Update</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-500 text-sm">
                  ยังไม่มีไฟล์
                </td>
              </tr>
            ) : (
              list.map((row) => (
                <tr key={row.file_name} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-2 text-sm text-slate-200 font-medium truncate max-w-[200px]" title={row.file_name}>
                    {row.file_name}
                  </td>
                  <td className="px-4 py-2 text-sm text-amber-400">{row.total_drafts}</td>
                  <td className="px-4 py-2 text-sm text-slate-400">{formatTime(row.last_update)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DraftSummaryTable;
