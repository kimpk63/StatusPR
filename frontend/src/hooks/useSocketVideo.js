import { useEffect } from 'react';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://statuspr.onrender.com';

export function useSocketVideo(
  videoId,
  onCommentAdded,
  onCommentChecked,
  onCommentDeleted,
  onStatusChanged,
  onOffline,
  onReconnect
) {
  useEffect(() => {
    if (!videoId) return;
    const tokens = localStorage.getItem('tokens');
    let token = null;
    if (tokens) {
      try {
        token = JSON.parse(tokens).accessToken;
      } catch {}
    }
    const socket = io(BACKEND_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      socket.emit('join-video', videoId);
    });

    socket.on('comment:added', (data) => {
      console.log('[Socket] New comment:', data);
      if (onCommentAdded) onCommentAdded(data);
    });

    socket.on('comment:checked', (data) => {
      console.log('[Socket] Comment checked:', data);
      if (onCommentChecked) onCommentChecked(data);
    });

    socket.on('comment:deleted', (data) => {
      console.log('[Socket] Comment deleted:', data);
      if (onCommentDeleted) onCommentDeleted(data);
    });

    socket.on('video:status-changed', (data) => {
      console.log('[Socket] Status changed:', data);
      if (onStatusChanged) onStatusChanged(data);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected', reason);
      if (onOffline) onOffline();
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      if (onOffline) onOffline();
    });

    socket.on('reconnect', (attempt) => {
      console.log('[Socket] Reconnected after', attempt, 'attempts');
      if (onReconnect) onReconnect();
    });

    return () => {
      socket.disconnect();
    };
  }, [videoId, onCommentAdded, onCommentChecked, onCommentDeleted, onStatusChanged, onOffline, onReconnect]);
}
