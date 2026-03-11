import React from 'react';

export default function StatusBadge({ status }) {
  let bg = 'bg-slate-700';
  let text = 'text-slate-300';
  switch (status) {
    case 'draft':
      bg = 'bg-amber-500/20';
      text = 'text-amber-300';
      break;
    case 'pending_review':
      bg = 'bg-blue-500/20';
      text = 'text-blue-300';
      break;
    case 'approved':
      bg = 'bg-green-500/20';
      text = 'text-green-300';
      break;
    case 'needs_revision':
      bg = 'bg-red-500/20';
      text = 'text-red-300';
      break;
    default:
      break;
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
