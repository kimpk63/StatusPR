import React, { useState, useRef } from 'react';
import { downloadCommentsPDF, getExportProgress } from '../api';

export default function ExportMenu({ videoId, videoName }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  const downloadPDF = () => {
    const url = downloadCommentsPDF(videoId);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.click();
    setOpen(false);
  };

  const downloadProgress = async () => {
    try {
      const data = await getExportProgress(videoId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${videoName || 'video'}_progress.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('export progress failed', err);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs"
        onClick={() => setOpen((o) => !o)}
      >
        📥 Export
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-slate-800 shadow-lg rounded z-10">
          <button
            onClick={downloadPDF}
            className="flex items-center w-full px-3 py-2 hover:bg-slate-700 text-sm"
          >
            📄 Export as PDF
          </button>
          <button
            onClick={downloadProgress}
            className="flex items-center w-full px-3 py-2 hover:bg-slate-700 text-sm"
          >
            📊 Export Progress (JSON)
          </button>
        </div>
      )}
    </div>
  );
}
