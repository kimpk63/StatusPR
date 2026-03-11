import React from 'react';
import StatusBadge from './StatusBadge';

export default function VideoTable({ videos, onView, onEdit, onDelete }) {
  return (
    <table className="w-full text-sm text-left text-slate-300">
      <thead className="text-xs uppercase bg-slate-800">
        <tr>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2 text-right">Duration</th>
          <th className="px-4 py-2">File Size</th>
          <th className="px-4 py-2">Status</th>
          <th className="px-4 py-2">Comments</th>
          <th className="px-4 py-2">Created</th>
          <th className="px-4 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {videos.map((v) => (
          <tr key={v.id} className="border-b border-slate-700">
            <td className="px-4 py-2">{v.file_name}</td>
            <td className="px-4 py-2 text-right font-mono">{v.durationFormatted || v.duration || '--'}</td>
            <td className="px-4 py-2">{v.fileSizeFormatted || v.file_size || '--'}</td>
            <td className="px-4 py-2"><StatusBadge status={v.status} /></td>
            <td className="px-4 py-2">
              {v.total_comments || v.comment_count || 0}
              {v.total_comments != null && v.checked_comments != null && (
                <span className="ml-1 text-xs text-slate-400">({v.checked_comments}/{v.total_comments})</span>
              )}
            </td>
            <td className="px-4 py-2">{new Date(v.created_at || v.updated_at).toLocaleString()}</td>
            <td className="px-4 py-2 space-x-2">
              <button
                onClick={() => onView(v)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
              >View</button>
              {onEdit && (
                <button
                  onClick={() => onEdit(v)}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs"
                >Edit</button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(v)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs"
                >Delete</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
