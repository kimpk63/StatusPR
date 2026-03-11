import { requestPermissionAndGetToken, setupMessageListener } from './firebase-config';
import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  getStatus,
  getActivities,
  getNotifications,
  markNotificationRead,
  getStatsToday,
  getDraftSummary,
  getLogs,
} from './api';

const FALLBACK_REFRESH_MS = 30 * 1000;

// import page(s)
import VideoWatchPage from './pages/VideoWatchPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadVideoPage from './pages/UploadVideoPage';
import MyVideosPage from './pages/MyVideosPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import MainLayout from './layouts/MainLayout';
import AccessDenied from './components/AccessDenied';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  if (!user) {
    return <LoginPage />;
  }
  return children;
}

function ManagerRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'manager' ? children : <AccessDenied />;
}

function EmployeeRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'employee' ? children : <AccessDenied />;
}

function App() {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState(null);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [statsToday, setStatsToday] = useState(null);
  const [draftSummary, setDraftSummary] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realTimeNotification, setRealTimeNotification] = useState(null);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const socketRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [s, a, n, stats, draft, logList] = await Promise.all([
        getStatus(),
        getActivities(),
        getNotifications(false),
        getStatsToday(),
        getDraftSummary(),
        getLogs(),
      ]);
      setStatus(s);
      setActivities(a);
      setNotifications(n);
      setStatsToday(stats);
      setDraftSummary(draft);
      setLogs(logList);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, FALLBACK_REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchAll]);

  useEffect(() => {
    setupMessageListener();
  }, []);

  useEffect(() => {
    const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://statuspr.onrender.com';
    const socket = io(BACKEND_URL, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('status', (data) => {
      setStatus((prev) => (prev ? { ...prev, status: data.status, startedAt: data.startedAt } : null));
    });
    socket.on('activity', (activity) => {
      setActivities((prev) => [activity, ...prev]);
      fetchAll();
    });
    socket.on('notification', (data) => {
      setRealTimeNotification(data);
      setNotifications((prev) => [{ id: Date.now(), ...data, read_at: null, created_at: new Date().toISOString() }, ...prev]);
      fetchAll();

      // ส่ง push notification ไปโทรศัพท์
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(data.title || 'แจ้งเตือน', {
          body: data.message || data.body || '',
          icon: '/icon-192x192.png',
        });
      }
    });
    socket.on('connect', () => fetchAll());
    return () => {
      socket.disconnect();
    };
  }, [fetchAll]);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  };

  const handleEnableNotifications = async () => {
    await requestPermissionAndGetToken();
    setNotifPermission(Notification.permission);
  };

  const lastActivityAt = status?.lastActivityAt || (activities.length ? activities[0].created_at : null);

  if (loading && !status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse text-slate-400">กำลังโหลด...</div>
      </div>
    );
  }

  return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout
                  notifications={notifications}
                  onMarkRead={handleMarkRead}
                  realTimeNotification={realTimeNotification}
                  error={error}
                  notifPermission={notifPermission}
                  onEnableNotifications={handleEnableNotifications}
                  user={user}
                  logout={logout}
                >
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/video/:videoId"
            element={
              <ProtectedRoute>
                <MainLayout
                  notifications={notifications}
                  onMarkRead={handleMarkRead}
                  realTimeNotification={realTimeNotification}
                  error={error}
                  notifPermission={notifPermission}
                  onEnableNotifications={handleEnableNotifications}
                  user={user}
                  logout={logout}
                >
                  <VideoWatchPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <EmployeeRoute>
                  <MainLayout
                    notifications={notifications}
                    onMarkRead={handleMarkRead}
                    realTimeNotification={realTimeNotification}
                    error={error}
                    notifPermission={notifPermission}
                    onEnableNotifications={handleEnableNotifications}
                    user={user}
                    logout={logout}
                  >
                    <UploadVideoPage />
                  </MainLayout>
                </EmployeeRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-videos"
            element={
              <ProtectedRoute>
                <EmployeeRoute>
                  <MainLayout
                    notifications={notifications}
                    onMarkRead={handleMarkRead}
                    realTimeNotification={realTimeNotification}
                    error={error}
                    notifPermission={notifPermission}
                    onEnableNotifications={handleEnableNotifications}
                    user={user}
                    logout={logout}
                  >
                    <MyVideosPage />
                  </MainLayout>
                </EmployeeRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/review"
            element={
              <ProtectedRoute>
                <ManagerRoute>
                  <MainLayout
                    notifications={notifications}
                    onMarkRead={handleMarkRead}
                    realTimeNotification={realTimeNotification}
                    error={error}
                    notifPermission={notifPermission}
                    onEnableNotifications={handleEnableNotifications}
                    user={user}
                    logout={logout}
                  >
                    <ReviewQueuePage />
                  </MainLayout>
                </ManagerRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/all-videos" element={<Navigate to="/" />} />
          {/* additional routes for managers etc can be added here */}
        </Routes>
      </Router>
  );
}
export default App;