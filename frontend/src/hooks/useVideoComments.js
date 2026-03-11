import { useState, useEffect, useCallback } from 'react';
import {
  getVideoWithComments,
  postVideoComment,
  patchCommentCheck,
  deleteComment,
  patchVideoStatus,
} from '../api';

export function useVideoComments(videoId) {
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVideo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVideoWithComments(videoId);
      setVideo(data);
      setComments(data.comments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    if (videoId) {
      fetchVideo();
    }
  }, [videoId, fetchVideo]);

  const addComment = async (comment) => {
    const newComment = await postVideoComment(videoId, comment);
    setComments((prev) => [...prev, { ...newComment, drawings: newComment.drawings || [] }]);
    setVideo((v) => ({ ...v, total_comments: (v.total_comments || 0) + 1 }));
    return newComment;
  };

  const checkComment = async (commentId) => {
    const updated = await patchCommentCheck(commentId);
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, is_checked: true } : c))
    );
    setVideo((v) => ({ ...v, checked_comments: (v.checked_comments || 0) + 1 }));
    return updated;
  };

  const removeComment = async (commentId) => {
    await deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setVideo((v) => ({ ...v, total_comments: (v.total_comments || 0) - 1 }));
  };

  const changeStatus = async (status) => {
    const resp = await patchVideoStatus(videoId, status);
    setVideo((v) => ({ ...v, status: resp.status }));
    return resp;
  };

  return {
    video,
    comments,
    loading,
    error,
    fetchVideo,
    addComment,
    checkComment,
    removeComment,
    changeStatus,
  };
}
