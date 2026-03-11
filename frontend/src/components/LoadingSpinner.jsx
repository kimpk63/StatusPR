import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-4"></div>
      <span className="text-slate-300">{message}</span>
    </div>
  );
}
