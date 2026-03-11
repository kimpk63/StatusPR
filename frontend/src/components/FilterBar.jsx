import React from 'react';

export default function FilterBar({ status, sort, onStatusChange, onSortChange, search, onSearchChange }) {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-6">
      <div>
        <label className="text-sm text-slate-300 mr-2">Status:</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"
        >
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="needs_revision">Needs Revision</option>
        </select>
      </div>
      <div>
        <label className="text-sm text-slate-300 mr-2">Sort:</label>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
      <div className="flex-grow">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"
        />
      </div>
    </div>
  );
}
