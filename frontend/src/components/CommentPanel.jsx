import React from 'react';

export default function CommentPanel({
  comments = [],
  videoId,
  onCheckComment = () => {},
  onDeleteComment = () => {},
  onCommentClick = () => {},
  isManager = false,
}) {
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full h-full overflow-y-auto p-2 bg-white border-l">
      {comments.map((c) => (
        <div
          key={c.id}
          className="mb-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
          onClick={() => onCommentClick(c.timestamp_seconds)}
        >
          <div className="flex justify-between items-center">
            <strong>{c.commented_by?.name || 'Manager'}</strong>
            <span className="text-xs text-gray-600">
              {formatTime(c.timestamp_seconds)}
            </span>
          </div>
          <div className="mt-1 text-sm">{c.comment_text}</div>
          {c.drawings && c.drawings.length > 0 && (
            <div className="mt-1 text-xs text-gray-500">[drawing]</div>
          )}
          <div className="mt-1 flex items-center space-x-2">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={c.is_checked}
                onChange={(e) => {
                  e.stopPropagation();
                  if (!c.is_checked) onCheckComment(c.id);
                }}
              />
              <span className="ml-1">✓ เสร็จแล้ว</span>
            </label>
            {isManager && (
              <button
                className="text-red-500 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteComment(c.id);
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
