import { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://statuspr.onrender.com';
const API_BASE = `${BACKEND_URL}/api`;

export function useVideoUpload() {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  async function uploadVideo(file) {
    setError(null);
    setProgress(0);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      const tokens = localStorage.getItem('tokens');
      let auth = {};
      if (tokens) {
        try {
          const { accessToken } = JSON.parse(tokens);
          auth = { Authorization: `Bearer ${accessToken}` };
        } catch {}
      }
      const resp = await axios.post(`${API_BASE}/uploads/video`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...auth,
        },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress((evt.loaded / evt.total) * 100);
          }
        },
      });
      return resp.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }

  return {
    progress,
    error,
    isUploading,
    uploadVideo,
  };
}
