import React, { useState, useEffect } from 'react';
import db from '../../services/db';
import {
  HiOutlineCog,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineSave,
  HiOutlineCheckCircle,
  HiOutlinePhone,
} from 'react-icons/hi';

const AdminSettingsPage = () => {
  const [config, setConfig] = useState(() => db.get('system_config'));
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emergencyPhone, setEmergencyPhone] = useState('999');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    return db.subscribe('system_config', (latest) => {
      const current = latest || db.get('system_config');
      if (current) {
        setConfig(current);
        setMaintenanceMode(Boolean(current.maintenanceMode));
        setEmergencyPhone(current.emergencyPhone || '999');
        setAnnouncementActive(Boolean(current.announcement?.active));
        setAnnouncementText(current.announcement?.message || '');
      }
    });
  }, []);

  const handleSave = (e) => {
    e.preventDefault();

    db.update('system_config', 'global', {
      maintenanceMode,
      emergencyPhone: emergencyPhone.trim() || '999',
      announcement: {
        active: announcementActive,
        title: 'Platform Advisory',
        message: announcementText.trim(),
        level: 'info',
      },
    });

    setNotice('Global system configuration successfully updated.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">System Infrastructure Configuration</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Control platform-wide maintenance locks, emergency dispatch hotlines, and global announcements.
        </p>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-bold flex items-center gap-2">
          <HiOutlineCheckCircle className="w-5 h-5 text-teal-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Emergency Mode Warning */}
      {maintenanceMode && (
        <div className="p-5 rounded-3xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-4">
          <HiOutlineExclamation className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm">Maintenance Mode is Live</h4>
            <p className="text-xs text-red-800 leading-relaxed mt-1">
              All non-admin users (Patients and Doctors) will be greeted by a full-screen maintenance lockout interceptor per HealthConnect security policy.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Maintenance Switch */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Maintenance Mode</h3>
            <p className="text-xs text-gray-500 max-w-md mt-0.5">
              Temporarily take the site offline for updates or database maintenance.
            </p>
          </div>

          <label htmlFor="maintenance-toggle" className="relative inline-flex items-center cursor-pointer">
            <input
              id="maintenance-toggle"
              name="maintenanceMode"
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        {/* Emergency Hotline */}
        <div className="pb-6 border-b border-gray-100">
          <label htmlFor="emergency-phone" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
            Emergency Hotline Number
          </label>
          <div className="relative max-w-xs">
            <HiOutlinePhone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="emergency-phone"
              name="emergencyPhone"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-primary"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Default emergency number for Bangladesh is 999.
          </p>
        </div>

        {/* Global Announcement */}
        <div className="space-y-3 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <label htmlFor="announcement-text" className="block text-xs font-bold uppercase tracking-wider text-gray-600">
              Announcement Banner
            </label>
            <label htmlFor="announcement-toggle" className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
              <input
                id="announcement-toggle"
                name="announcementActive"
                type="checkbox"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
                className="checkbox checkbox-xs rounded-md"
              />
              <span>Enable Broadcast</span>
            </label>
          </div>

          <textarea
            id="announcement-text"
            name="announcementText"
            rows={2}
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="E.g., Online consultations are now available."
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <HiOutlineSave className="w-4 h-4" />
            <span>Commit Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
