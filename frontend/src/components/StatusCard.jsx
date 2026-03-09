function formatTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

const statusConfig = {
  working: {
    label: '🟢 Working',
    sub: 'กำลังทำงาน (Premiere Pro Active)',
    dot: 'bg-green-500 animate-pulse',
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  idle: {
    label: '🟡 Idle',
    sub: 'พนักงานออนไลน์ แต่ยังไม่เปิด Premiere Pro',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  offline: {
    label: '🔴 Offline',
    sub: 'ไม่มีสัญญาณ (เกิน 2 นาทีไม่มี heartbeat)',
    dot: 'bg-red-500',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
};

function StatusCard({ status }) {
  if (!status) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 animate-pulse">
        <p className="text-slate-400">ไม่มีข้อมูลสถานะ</p>
      </div>
    );
  }

  const cfg = statusConfig[status.status] || statusConfig.offline;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 shadow-lg transition-all duration-300 hover:border-slate-600/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`inline-block w-3 h-3 rounded-full ${cfg.dot}`}
              title={status.status}
            />
            <span className="text-slate-400 text-sm font-medium">Employee</span>
          </div>
          <h3 className="text-xl font-bold text-white">{status.name}</h3>
          <p className={`mt-2 text-lg ${cfg.badge.split(' ')[1]}`}>
            {cfg.label}
          </p>
          <p className="text-slate-500 text-sm mt-0.5">{cfg.sub}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">เริ่มทำงาน</span>
              <p className="text-slate-200 font-medium">
                {formatTime(status.startedAt) || '-'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">กิจกรรมล่าสุด</span>
              <p className="text-slate-200 font-medium">
                {formatTime(status.lastActivityAt) || '-'}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${cfg.badge}`}
        >
          {status.status === 'working' ? 'Online' : status.status === 'idle' ? 'Idle' : 'Offline'}
        </div>
      </div>
    </div>
  );
}

export default StatusCard;
