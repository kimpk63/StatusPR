import React from 'react';

export default function OfflineIndicator({ isOffline }) {
  if (!isOffline) return null;
  return (
    <div className="fixed top-0 right-0 m-4 p-2 bg-red-600 text-white rounded">
      Offline – reconnecting...
    </div>
  );
}
