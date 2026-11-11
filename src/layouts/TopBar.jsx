import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import db from '../services/db';
import { HiOutlinePhone } from 'react-icons/hi';
import { resolveAvatar } from '../utils/avatar';

const TopBar = () => {
  const { user, role } = useAuth();
  const [config, setConfig] = useState(() => db.get('system_config'));

  useEffect(() => {
    return db.subscribe('system_config', (latest) => {
      setConfig(latest || db.get('system_config'));
    });
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-40">
      {/* Left: Role Context & Welcome */}
      <div className="flex items-center gap-2.5">
        <h2 className="text-sm sm:text-base font-bold text-gray-900 capitalize tracking-tight">
          {role ? `${role} Portal` : 'HealthConnect'}
        </h2>
        <span className="hidden sm:inline-block text-xs text-gray-300">·</span>
        <p className="hidden sm:block text-xs text-gray-500">
          {user?.name || 'Welcome'}
        </p>
      </div>

      {/* Right: Emergency Hotline & Actions */}
      <div className="flex items-center gap-3">
        {/* Emergency SOS Callout per context.md Section 3.2 & design.md */}
        <a
          href={`tel:${config?.emergencyPhone || '999'}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs font-bold transition-all shadow-xs"
          title="Emergency Ambulance Hotline"
        >
          <HiOutlinePhone className="w-4 h-4 animate-pulse text-red-600" />
          <span>SOS: {config?.emergencyPhone || '999'}</span>
        </a>

        {/* User Role Tag */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
          <img
            src={resolveAvatar(user?.avatar, user?.name)}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
