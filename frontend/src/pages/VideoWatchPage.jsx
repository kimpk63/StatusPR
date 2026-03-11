import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import CommentPanel from '../components/CommentPanel';
import CommentForm from '../components/CommentForm';
import OfflineIndicator from '../components/OfflineIndicator';
import NotificationToast from '../components/NotificationToast';
import ExportMenu from '../components/ExportMenu';
import ProgressReport from '../components/ProgressReport';
import StatusBadge from '../components/StatusBadge';
import { useVideoComments } from '../hooks/useVideoComments';
import { useSocketVideo } from '../hooks/useSocketVideo';

import { useAuth } from '../context/AuthContext';

export default function VideoWatchPage() {
  const { videoId } = useParams();
  const { user, logout } = useAuth();
  const isManager = user?.role === 'manager';

  const {
    video,
    comments,
    loading,
    error,
    addComment,
    checkComment,
    removeComment,
    changeStatus,
    fetchVideo,
  } = useVideoComments(videoId);

  const [isOffline, setIsOffline] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // integrate socket separately to show toasts and call hook actions
  useSocketVideo(
    videoId,
    (newComment) => {
      setComments((prev) => [...prev, newComment]);
      setVideo((v) => ({ ...v, total_comments: (v.total_comments || 0) + 1 }));
      setToastMsg(`New comment: ${newComment.comment_text}`);
      setIsOffline(false);
    },
    (data) => {
      setComments((prev) =>
        prev.map((c) => (c.id === data.comment_id ? { ...c, is_checked: true } : c))
      );
      setVideo((v) => ({ ...v, checked_comments: (v.checked_comments || 0) + 1 }));
      setToastMsg('Comment marked checked');
      setIsOffline(false);
    },
    (data) => {
      setComments((prev) => prev.filter((c) => c.id !== data.comment_id));
      setVideo((v) => ({ ...v, total_comments: (v.total_comments || 0) - 1 }));
      setToastMsg('Comment deleted');
      setIsOffline(false);
    },
    (data) => {
      setVideo((v) => ({ ...v, status: data.status }));
      setToastMsg(`Status changed to ${data.status}`);
      setIsOffline(false);
    },
    () => {
      setIsOffline(true);
    },
    () => {
      setIsOffline(false);
      if (fetchVideo) fetchVideo();
    }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [formTimestamp, setFormTimestamp] = useState(0);

  const handleTimestampSelect = (t) => {
    if (!isManager) return;
    setFormTimestamp(t);
    setFormOpen(true);
  };

  const handleSubmitComment = async (payload) => {
    await addComment(payload);
    setFormOpen(false);
  };

  const handleCheck = async (id) => {
    await checkComment(id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete comment?')) {
      await removeComment(id);
    }
  };

  const handleCommentClick = (t) => {
    // maybe highlight or scroll
  };

  const [statusInput, setStatusInput] = useState('');
  const canChangeStatus = isManager || (video && video.uploaded_by === user?.id);
  const handleStatusChange = async () => {
    if (!statusInput) return;
    await changeStatus(statusInput);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!video) return <div>No video selected</div>;

  return (
    <div className="flex h-screen">
      <div className="w-2/3 p-4">
        <h1 className="text-xl font-bold mb-2">
          {video.file_name} (Draft {video.draft_number})
        </h1>
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <StatusBadge status={video.status} />
            <span>{video.checked_comments}/{video.total_comments} checked</span>
          </div>
          <div className="flex gap-4 items-center">
            <ExportMenu videoId={videoId} videoName={video.file_name} />
            <ProgressReport video={video} />
            <button
              onClick={logout}
              className="px-2 py-1 bg-red-500 text-white rounded"
            >
              Logout
            </button>
          </div>
        </div>
        <VideoPlayer
          videoId={videoId}
          videoUrl={video.drive_url}
          comments={comments}
          onCommentClick={handleCommentClick}
          onTimestampSelect={handleTimestampSelect}
        />
        {canChangeStatus && (
          <div className="mt-4">
            <select
              value={statusInput}
              onChange={(e) => setStatusInput(e.target.value)}
              className="border p-1"
            >
              <option value="">Change status</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending review</option>
              <option value="approved">Approved</option>
              <option value="needs_revision">Needs revision</option>
            </select>
            <button
              className="ml-2 px-2 py-1 bg-blue-500 text-white"
              onClick={handleStatusChange}
            >
              Update
            </button>
          </div>
        )}
      </div>
      <div className="w-1/3 border-l">
        <CommentPanel
          comments={comments}
          videoId={videoId}
          onCheckComment={handleCheck}
          onDeleteComment={handleDelete}
          onCommentClick={(t) => {
            /* scroll or handle */
          }}
          isManager={isManager}
        />
      </div>
      {formOpen && (
        <CommentForm
          videoId={videoId}
          timestamp={formTimestamp}
          onSubmit={handleSubmitComment}
          onCancel={() => setFormOpen(false)}
          isLoading={false}
        />
      )}
      <OfflineIndicator isOffline={isOffline} />
      <NotificationToast message={toastMsg} onClose={() => setToastMsg(null)} />
    </div>
  );
}
