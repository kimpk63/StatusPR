import React, { useState } from 'react';
import DrawingCanvas from './DrawingCanvas';

export default function CommentForm({
  videoId,
  timestamp,
  onSubmit,
  onCancel,
  isLoading,
}) {
  const [commentText, setCommentText] = useState('');
  const [drawings, setDrawings] = useState([]);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleAddDrawing = () => {
    setCanvasOpen(true);
  };

  const handleDrawingComplete = (newPaths) => {
    setDrawings((prev) => [...prev, ...newPaths]);
    setCanvasOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!commentText.trim()) {
      setError('Comment text is required');
      return;
    }
    if (timestamp < 0) {
      setError('Invalid timestamp');
      return;
    }
    const payload = {
      comment_text: commentText.trim(),
      timestamp_seconds: Math.floor(timestamp),
      drawings: drawings.map((d) => ({
        tool_type: d.tool_type,
        drawing_data: JSON.stringify(d.drawing_data),
        position: d.position,
      })),
    };
    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white p-4 rounded w-96">
        <h2 className="text-lg font-bold mb-2">Add Comment</h2>
        <div className="text-sm mb-2">Time: {Math.floor(timestamp)}s</div>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full border p-2"
            rows="3"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          {drawings.length > 0 && (
            <div className="mt-2 text-xs">{drawings.length} drawing(s) added</div>
          )}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="mt-4 flex space-x-2">
            <button
              type="button"
              className="px-3 py-1 bg-gray-200"
              onClick={handleAddDrawing}
            >
              Add Drawing
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-500 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="px-3 py-1 bg-gray-300"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      {canvasOpen && (
        <DrawingCanvas
          isOpen={canvasOpen}
          videoFrame={document.querySelector('video')}
          onDrawingComplete={handleDrawingComplete}
          onClose={() => setCanvasOpen(false)}
        />
      )}
    </div>
  );
}
