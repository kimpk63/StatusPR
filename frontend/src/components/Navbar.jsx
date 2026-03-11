import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReviewStats } from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let interval;
    const load = () => {
      if (user?.role === 'manager') {
        getReviewStats()
          .then((s) => setPendingCount(s.totalPendingReview || 0))
          .catch(() => {});
      }
    };
    load();
    interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
      <div className="text-2xl font-bold">StatusPR</div>
      <div className="space-x-4">
        {user?.role === 'employee' && (
          <>
            <Link to="/" className="hover:underline">Dashboard</Link>
            <Link to="/upload" className="hover:underline">Upload</Link>
            <Link to="/my-videos" className="hover:underline">My Videos</Link>
          </>
        )}
        {user?.role === 'manager' && (
          <>
            <Link to="/" className="hover:underline">Dashboard</Link>
            <Link to="/review" className="relative hover:underline">
              Review Queue
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-6 bg-red-500 text-xs px-1 rounded-full">
                  {pendingCount}
                </span>
              )}
            </Link>
            <Link to="/all-videos" className="hover:underline">All Videos</Link>
          </>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {user && <span>Profile: {user.name} ({user.role})</span>}
        {user && (
          <button onClick={logout} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
