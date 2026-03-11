import React from 'react';

function Card({ title, value, color }) {
  return (
    <div className="bg-slate-900 p-4 rounded-lg shadow-lg flex flex-col items-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-slate-300 mt-1">{title}</div>
    </div>
  );
}

export default function StatCards({ totalVideos, draftCount, approvedCount, needsRevisionCount }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card title="Total Videos" value={totalVideos} color="text-blue-400" />
      <Card title="Draft" value={draftCount} color="text-amber-400" />
      <Card title="Approved" value={approvedCount} color="text-green-400" />
      <Card title="Needs Revision" value={needsRevisionCount} color="text-red-400" />
    </div>
  );
}
