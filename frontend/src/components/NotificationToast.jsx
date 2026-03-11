import React from 'react';

export default function NotificationToast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded shadow-lg animate-in slide-in-from-right-5">
      {message}
      <button className="ml-2 text-gray-400" onClick={onClose}>×</button>
    </div>
  );
}
