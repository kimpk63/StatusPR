import React from 'react';

export default function ReviewStats({ stats }) {
  return (
    <div className="bg-slate-800 rounded-lg shadow p-4 w-full flex justify-around">
      <div className="text-center">
        <div className="text-xl font-bold">🔴 {stats.totalPendingReview}</div>
        <div className="text-xs">Pending Review</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold">🟡 {stats.totalNeedsRevision}</div>
        <div className="text-xs">Needs Revision</div>
      </div>
      {stats.recentVideos && (
        <div className="text-center">
          <div className="text-xl font-bold">✅ {stats.recentVideos.length}</div>
          <div className="text-xs">Recent Videos</div>
        </div>
      )}
    </div>
  );
}
