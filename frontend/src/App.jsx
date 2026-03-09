import { useState, useEffect, useCallback, useRef } from 'react';
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
import StatusCard from './components/StatusCard';
import ActivityTimeline from './components/ActivityTimeline';
import UploadTable from './components/UploadTable';
import DraftSummaryTable from './components/DraftSummaryTable';
import ProductivitySummary from './components/ProductivitySummary';
import SystemLogs from './components/SystemLogs';
import NotificationPopup from './components/NotificationPopup';

const FALLBACK_REFRESH_MS = 30 * 1000;

function App() {
  const [status, setStatus] = useState(null);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [statsToday, setStatsToday] = useState(null);
  const [draftSummary, setDraftSummary] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realTimeNotification, setRealTimeNotification] = useState(null);
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

  const lastActivityAt = status?.lastActivityAt || (activities.length ? activities[0].created_at : null);

  if (loading && !status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse text-slate-400">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <NotificationPopup
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onClose={() => {}}
        realTimeNotification={realTimeNotification}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Some Thing About CC Edit Status
          </h1>
          <p className="text-slate-400 mt-1">สถานะการทำงานและกิจกรรมของพนักงาน</p>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์: {error}
          </div>
        )}

        <section className="mb-8">
          <StatusCard status={status} />
        </section>

        <section className="mb-8">
          <ProductivitySummary stats={statsToday} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <section className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Activity Timeline</h2>
              <ActivityTimeline activities={activities} lastActivityAt={lastActivityAt} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Draft Summary</h2>
              <DraftSummaryTable draftSummary={draftSummary} />
            </div>
          </section>

          <section className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">ตารางกิจกรรม</h2>
            <UploadTable activities={activities} />
          </section>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">System Logs</h2>
          <SystemLogs logs={logs} />
        </section>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(1rem); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-in.slide-in-from-right-5 { animation: slideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default App;
