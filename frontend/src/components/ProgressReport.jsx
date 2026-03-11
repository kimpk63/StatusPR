import React from 'react';
import { downloadCommentsPDF } from '../api';

export default function ProgressReport({ video }) {
  const total = video.total_comments || 0;
  const resolved = video.checked_comments || 0;
  const percent = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <div className="bg-slate-800 rounded-lg shadow p-4 w-48">
      <div className="text-sm font-semibold">Progress: {resolved}/{total} ✓</div>
      <div className="w-full bg-slate-700 rounded-full h-2 mt-1 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            percent < 50 ? 'bg-blue-500' : 'bg-green-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2 text-xs">
        Resolved: {resolved}<br />
        Pending: {total - resolved}<br />
        Status: {video.status}
      </div>
      <button
        onClick={() => {
          const url = downloadCommentsPDF(video.id);
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.click();
        }}
        className="mt-3 w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
      >
        📥 Export as PDF
      </button>
    </div>
  );
}
