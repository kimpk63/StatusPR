import React, { useRef, useState } from 'react';

export default function VideoUploadForm({ onUpload, progress, isUploading, error, file }) {
  const fileInput = useRef();
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      onUpload.selectFile(f);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) onUpload.selectFile(f);
  };

  const formatSize = (n) => {
    if (n > 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' MB';
    if (n > 1024) return (n / 1024).toFixed(2) + ' KB';
    return n + ' B';
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded p-8 text-center cursor-pointer ${
          dragOver ? 'border-blue-500 bg-slate-800' : 'border-slate-700'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInput.current.click()}
      >
        <p className="text-slate-300">📤 Drop video here or click to select</p>
        <p className="text-xs text-slate-500">Max 500MB</p>
        <input
          type="file"
          accept="video/*"
          ref={fileInput}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {file && (
        <div className="mt-4 bg-slate-800 p-4 rounded">
          <div>File: {file.name} ({formatSize(file.size)})</div>
          {isUploading && (
            <div className="w-full bg-slate-700 h-2 rounded mt-2">
              <div
                className="h-2 bg-blue-600 rounded"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
          {error && <div className="text-red-400 mt-2">{error}</div>}
          <div className="mt-2 space-x-2">
            {!isUploading && (
              <button
                onClick={onUpload.cancel}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white"
              >Cancel</button>
            )}
            <button
              onClick={onUpload.submit}
              disabled={isUploading}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >Upload</button>
          </div>
        </div>
      )}
    </div>
  );
}
