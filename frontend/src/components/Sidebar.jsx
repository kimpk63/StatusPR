import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`bg-slate-900 text-slate-300 ${collapsed ? 'w-16' : 'w-56'} h-full flex flex-col`}> 
      <button
        className="p-2 text-white"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? '>' : '<'}
      </button>
      {!collapsed && (
        <nav className="flex-grow">
          <ul className="space-y-2 p-2">
            <li>
              <Link to="/" className="block hover:bg-slate-800 rounded px-2 py-1">
                📊 Dashboard
              </Link>
            </li>
            {user?.role === 'employee' && (
              <>
                <li>
                  <Link to="/upload" className="block hover:bg-slate-800 rounded px-2 py-1">
                    📤 Upload
                  </Link>
                </li>
                <li>
                  <Link to="/my-videos" className="block hover:bg-slate-800 rounded px-2 py-1">
                    🎬 My Videos
                  </Link>
                </li>
              </>
            )}
            {user?.role === 'manager' && (
              <>
                <li>
                  <Link to="/review" className="block hover:bg-slate-800 rounded px-2 py-1">
                    🎬 Review Queue
                  </Link>
                </li>
                <li>
                  <Link to="/all-videos" className="block hover:bg-slate-800 rounded px-2 py-1">
                    🎬 All Videos
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link to="/settings" className="block hover:bg-slate-800 rounded px-2 py-1">
                ⚙️ Settings
              </Link>
            </li>
          </ul>
        </nav>
      )}
      <div className="p-2">
        <Link to="/profile" className="block hover:bg-slate-800 rounded px-2 py-1">
          👤 Profile
        </Link>
        <Link to="/logout" className="block hover:bg-slate-800 rounded px-2 py-1">
          🚪 Logout
        </Link>
      </div>
    </div>
  );
}
