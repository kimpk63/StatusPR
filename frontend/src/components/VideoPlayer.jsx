import React, { useRef, useState, useEffect } from 'react';

export default function VideoPlayer({
  videoId,
  videoUrl,
  comments = [],
  onCommentClick = () => {},
  onTimestampSelect = () => {},
}) {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedCommentId, setSelectedCommentId] = useState(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onLoaded = () => setDuration(v.duration || 0);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('loadedmetadata', onLoaded);
    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('loadedmetadata', onLoaded);
    };
  }, []);

  const handleDotClick = (comment) => {
    if (videoRef.current) videoRef.current.currentTime = comment.timestamp_seconds;
    onCommentClick(comment.timestamp_seconds);
    setSelectedCommentId(comment.id);
  };

  const handleTimelineClick = (e) => {
    if (!duration) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = (x / rect.width) * duration;
    if (onTimestampSelect) onTimestampSelect(t);
  };

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
    <div className="w-full">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full bg-black"
      />
      <div
        className="relative w-full h-10 bg-gray-200 mt-2 cursor-pointer"
        onClick={handleTimelineClick}
      >
        {comments.map((c) => {
          if (!duration) return null;
          const left = (c.timestamp_seconds / duration) * 100;
          const isSelected = c.id === selectedCommentId;
          return (
            <div
              key={c.id}
              className={`absolute top-0 h-full w-1 cursor-pointer ${
                isSelected ? 'bg-blue-500' : 'bg-red-500'
              }`}
              style={{ left: `${left}%` }}
              onClick={(e) => {
                e.stopPropagation();
                handleDotClick(c);
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-sm">
        <span>Time: {formatTime(currentTime)}</span>
        <button
          className="px-2 py-1 bg-green-500 text-white rounded"
          onClick={() => onTimestampSelect(currentTime)}
        >
          Add Comment
        </button>
      </div>
    </div>
  );
}
