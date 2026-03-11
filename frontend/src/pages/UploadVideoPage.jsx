import React, { useState } from 'react';
import VideoUploadForm from '../components/VideoUploadForm';
import { useVideoUpload } from '../hooks/useVideoUpload';
import { useNavigate } from 'react-router-dom';

export default function UploadVideoPage() {
  const { progress, error, isUploading, uploadVideo } = useVideoUpload();
  const [selectedFile, setSelectedFile] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSelect = (file) => {
    setSelectedFile(file);
    setSuccess(null);
  };
  const handleCancel = () => {
    setSelectedFile(null);
  };
  const handleSubmit = async () => {
    if (!selectedFile) return;
    try {
      const resp = await uploadVideo(selectedFile);
      setSuccess(resp);
      // redirect after short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      // error state handled in hook
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-4">Upload Video</h1>
      <VideoUploadForm
        onUpload={{ selectFile: handleSelect, cancel: handleCancel, submit: handleSubmit }}
        progress={progress}
        isUploading={isUploading}
        error={error}
        file={selectedFile}
      />
      {success && (
        <div className="mt-4 text-green-400">
          ✅ Upload successful! Video: {success.file_name}
          <button
            onClick={() => navigate(`/video/${success.id}`)}
            className="ml-2 text-blue-400 hover:underline"
          >View Video</button>
        </div>
      )}
    </div>
  );
}
