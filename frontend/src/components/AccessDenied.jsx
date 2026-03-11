import React from 'react';

export default function AccessDenied() {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-slate-300">You do not have permission to view this page.</p>
      </div>
    </div>
  );
}
