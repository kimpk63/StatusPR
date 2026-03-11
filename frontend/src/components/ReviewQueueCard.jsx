import React from 'react';
import StatusBadge from './StatusBadge';

export default function ReviewQueueCard({ video, onReview }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 shadow flex justify-between items-center">
      <div>
        <h4 className="font-semibold truncate" title={video.file_name}>{video.file_name}</h4>
        <div className="text-xs text-slate-400">Employee: {video.employee_name}</div>
        <div className="text-xs text-slate-400">
          {video.durationFormatted || video.duration || '--'} | {video.fileSizeFormatted || video.fileSize || '--'}
        </div>
        <div className="mt-1"><StatusBadge status={video.status} /></div>
      </div>
      <div className="space-x-2">
        <button
          onClick={() => onReview(video)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
        >Review Now</button>
        <button
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs"
        >Assign to Later</button>
      </div>
    </div>
  );
}
