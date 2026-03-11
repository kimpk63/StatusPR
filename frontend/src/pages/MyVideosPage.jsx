import React, { useState, useEffect } from 'react';
import VideoTable from '../components/VideoTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { getUploadedVideos, deleteUploadedVideo } from '../api';
import { useNavigate } from 'react-router-dom';

export default function MyVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMy = async () => {
    setLoading(true);
    try {
      const vids = await getUploadedVideos();
      setVideos(vids);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMy();
  }, []);

  const handleView = (v) => navigate(`/video/${v.id}`);
  const handleDelete = async (v) => {
    if (window.confirm('Delete video?')) {
      await deleteUploadedVideo(v.id);
      fetchMy();
    }
  };

  if (loading) return <LoadingSpinner />;
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-4">My Videos</h1>
      <VideoTable
        videos={videos}
        onView={handleView}
        onDelete={handleDelete}
      />
    </div>
  );
}
