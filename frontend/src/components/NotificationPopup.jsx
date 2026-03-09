import { useState, useEffect } from 'react';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function NotificationPopup({ notifications, onMarkRead, onClose, realTimeNotification }) {
  const [open, setOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const unread = (notifications || []).filter((n) => !n.read_at);
  const showList = open && unread.length > 0;

  useEffect(() => {
    if (!realTimeNotification) return;
    setToast(realTimeNotification);
  
  // เล่นเสียง notification
    try {
      const audio = new Audio('/notification.mp3');
      audio.play();
    } catch (err) {
      console.log('Could not play notification sound:', err);
    }
  
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [realTimeNotification]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 max-w-sm">
      {/* Real-time toast */}
      {toast && (
        <div
          className="animate-in slide-in-from-right-5 rounded-lg bg-slate-800 border border-emerald-500/30 shadow-xl p-3 flex gap-2"
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <span className="text-lg">🔔</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">{toast.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}

      {unread.length > 0 && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 shadow-lg hover:bg-slate-700 transition-colors"
        >
          <span className="text-lg">🔔</span>
          <span className="font-medium">แจ้งเตือน ({unread.length})</span>
        </button>
      )}

      {showList && (
        <div className="rounded-xl border border-slate-600 bg-slate-800 shadow-xl overflow-hidden w-full">
          <div className="px-4 py-2 border-b border-slate-600 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-200">การแจ้งเตือนล่าสุด</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {unread.slice(0, 10).map((n) => (
              <div
                key={n.id}
                className="px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 flex justify-between items-start gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {n.message || (n.file_name && n.draft_number > 1
                      ? `${n.file_name} - Draft ${n.draft_number}`
                      : n.file_name || '')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{formatTime(n.created_at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onMarkRead(n.id)}
                  className="text-xs text-slate-400 hover:text-emerald-400 shrink-0"
                >
                  อ่านแล้ว
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPopup;
