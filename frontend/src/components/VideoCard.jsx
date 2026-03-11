import React from 'react';
import StatusBadge from './StatusBadge';

export default function VideoCard({ video, onView, onDelete }) {
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow">
      <div className="relative">
        <div className="bg-slate-700" style={{width: '100%', height: 0, paddingBottom: '56.25%'}}></div>
        {/* placeholder thumbnail */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            ⏱️ {video.durationFormatted || video.duration}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold truncate" title={video.file_name}>
          {video.file_name}
        </h3>
        {video.file_size && (
          <div className="text-xs text-slate-400">
            💾 {video.fileSizeFormatted || video.file_size}
          </div>
        )}
        <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
          <StatusBadge status={video.status} />
          <div>{video.comment_count || 0} comments</div>
        </div>
        <div className="mt-2 flex space-x-2">
          <button
            onClick={() => onView(video)}
            className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
          >View</button>
          {onDelete && (
            <button
              onClick={() => onDelete(video)}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs"
            >Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}
