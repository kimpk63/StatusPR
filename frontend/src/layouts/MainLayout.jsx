import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import NotificationPopup from '../components/NotificationPopup';

export default function MainLayout({
  children,
  notifications,
  onMarkRead,
  realTimeNotification,
  error,
  notifPermission,
  onEnableNotifications,
  user,
  logout,
}) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      {/* global notification popup and header error could be placed here but we keep header in pages if needed */}
      {notifications && onMarkRead && (
        <NotificationPopup
          notifications={notifications}
          onMarkRead={onMarkRead}
          onClose={() => {}}
          realTimeNotification={realTimeNotification}
        />
      )}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์: {error}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-slate-950 text-white">{children}</main>
      </div>
    </div>
  );
}
