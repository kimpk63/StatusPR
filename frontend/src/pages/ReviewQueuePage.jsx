import React, { useEffect, useState } from 'react';
import { getReviewQueue, getReviewStats } from '../api';
import ReviewQueueCard from '../components/ReviewQueueCard';
import ReviewStats from '../components/ReviewStats';
import { useNavigate } from 'react-router-dom';

export default function ReviewQueuePage() {
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const fetchQueue = async () => {
    try {
      const data = await getReviewQueue();
      setVideos(data);
    } catch (e) {
      console.error('fetch queue failed', e);
    }
  };

  const fetchStats = async () => {
    try {
      const s = await getReviewStats();
      setStats(s);
    } catch (e) {
      console.error('fetch stats failed', e);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchStats();
    const interval = setInterval(() => {
      fetchQueue();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = videos.filter((v) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return v.status === 'pending_review';
    if (filter === 'revision') return v.status === 'needs_revision';
  });

  const handleReview = (video) => {
    navigate(`/video/${video.id}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📋 Review Queue</h1>
      <ReviewStats stats={stats} />
      <div className="mt-4">
        <button
          onClick={() => setFilter('pending')}
          className={`px-2 py-1 mr-2 ${filter === 'pending' ? 'bg-blue-600' : 'bg-slate-700'} rounded`}
        >Pending</button>
        <button
          onClick={() => setFilter('revision')}
          className={`px-2 py-1 mr-2 ${filter === 'revision' ? 'bg-yellow-600' : 'bg-slate-700'} rounded`}
        >Needs Revision</button>
        <button
          onClick={() => setFilter('all')}
          className={`px-2 py-1 ${filter === 'all' ? 'bg-green-600' : 'bg-slate-700'} rounded`}
        >All</button>
      </div>
      <div className="mt-6 grid gap-4">
        {filtered.map((v) => (
          <ReviewQueueCard key={v.id} video={v} onReview={handleReview} />
        ))}
        {!filtered.length && <div className="text-center text-slate-400">No videos to review</div>}
      </div>
    </div>
  );
}
