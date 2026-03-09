/** แสดงจำนวน Draft ของแต่ละไฟล์ */
function DraftSummary({ activities }) {
  const uploads = (Array.isArray(activities) ? activities : []).filter((a) => a.type === 'upload');
  const byFile = {};
  for (const a of uploads) {
    const name = a.file_name || '-';
    if (!byFile[name]) byFile[name] = 0;
    if (a.draft_number > byFile[name]) byFile[name] = a.draft_number;
  }
  const entries = Object.entries(byFile).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
        <h3 className="text-sm font-semibold text-slate-400 mb-2">จำนวน Draft ต่อไฟล์</h3>
        <p className="text-slate-500 text-sm">ยังไม่มีไฟล์</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
      <h3 className="text-sm font-semibold text-slate-400 mb-3">จำนวน Draft ต่อไฟล์</h3>
      <ul className="space-y-2">
        {entries.map(([fileName, count]) => (
          <li key={fileName} className="flex justify-between text-sm">
            <span className="text-slate-300 truncate max-w-[180px]" title={fileName}>
              {fileName}
            </span>
            <span className="text-amber-400 font-medium shrink-0">{count} Draft</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DraftSummary;
