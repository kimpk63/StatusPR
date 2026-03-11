import React, { useState, useEffect } from 'react';
import StatCards from '../components/StatCards';
import FilterBar from '../components/FilterBar';
import VideoTable from '../components/VideoTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDashboardStats, listVideos, deleteUploadedVideo } from '../api';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [st, vids] = await Promise.all([
        getDashboardStats(),
        listVideos({ status: filterStatus, sort: sortOrder, search }),
      ]);
      setStats(st);
      setVideos(vids);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, sortOrder, search]);

  const handleView = (v) => {
    navigate(`/video/${v.id}`);
  };

  const handleEdit = (v) => {
    navigate(`/video/${v.id}`); // maybe same view for now
  };
  const handleDelete = async (v) => {
    if (window.confirm('Delete video?')) {
      await deleteUploadedVideo(v.id);
      fetchData();
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-4">StatusPR Dashboard</h1>
      {stats && (
        <StatCards
          totalVideos={stats.totalVideos}
          draftCount={stats.draftCount}
          approvedCount={stats.approvedCount}
          needsRevisionCount={stats.needsRevisionCount}
        />
      )}
      <FilterBar
        status={filterStatus}
        sort={sortOrder}
        search={search}
        onStatusChange={setFilterStatus}
        onSortChange={setSortOrder}
        onSearchChange={setSearch}
      />
      <VideoTable
        videos={videos}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
