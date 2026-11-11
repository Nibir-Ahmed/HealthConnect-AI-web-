import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoIcon from '../assets/Images/logo_icon.jpg';
import {
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineChatAlt2,
  HiOutlineFolder,
  HiOutlineIdentification,
  HiOutlineClipboardCheck,
  HiOutlineDocumentText,
  HiOutlineAdjustments,
  HiOutlineShieldCheck,
  HiOutlineUsers,
  HiOutlineNewspaper,
  HiOutlineCog,
  HiOutlineLogout,
} from 'react-icons/hi';

const NAV_CONFIG = {
  patient: [
    { label: 'Home Dashboard', to: '/patient/dashboard', icon: HiOutlineHome },
    { label: 'Symptom Checker', to: '/patient/diagnosis', icon: HiOutlineClipboardList },
    { label: 'Find Doctors', to: '/patient/doctors', icon: HiOutlineUserGroup },
    { label: 'My Appointments', to: '/patient/appointments', icon: HiOutlineCalendar },
    { label: 'Chat with Doctor', to: '/patient/chat', icon: HiOutlineChatAlt2 },
    { label: 'My Records', to: '/patient/vault', icon: HiOutlineFolder },
    { label: 'Emergency Card', to: '/patient/profile', icon: HiOutlineIdentification },
  ],
  doctor: [
    { label: 'Home Dashboard', to: '/doctor/dashboard', icon: HiOutlineHome },
    { label: 'Patient Queue', to: '/doctor/appointments', icon: HiOutlineCalendar },
    { label: 'Consultation Chat', to: '/doctor/chat', icon: HiOutlineChatAlt2 },
    { label: 'Write Prescription', to: '/doctor/prescriptions', icon: HiOutlineDocumentText },
    { label: 'Practice Settings', to: '/doctor/settings', icon: HiOutlineAdjustments },
  ],
  admin: [
    { label: 'Home Dashboard', to: '/admin/dashboard', icon: HiOutlineHome },
    { label: 'Doctor Verification', to: '/admin/verifications', icon: HiOutlineShieldCheck },
    { label: 'Manage Users', to: '/admin/users', icon: HiOutlineUsers },
    { label: 'Blog Posts', to: '/admin/blogs', icon: HiOutlineNewspaper },
    { label: 'System Settings', to: '/admin/settings', icon: HiOutlineCog },
  ],
};

const Sidebar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const currentRole = role || 'patient';
  const navItems = NAV_CONFIG[currentRole] || NAV_CONFIG.patient;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header with clickable Home link and non-overlapping role badge */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        <Link
          to="/"
          className="flex items-center gap-2.5 no-underline hover:opacity-85 transition-opacity min-w-0"
          title="Return to HealthConnect Home"
        >
          <img
            src={logoIcon}
            alt="HealthConnect Logo"
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
          <span className="font-extrabold text-gray-900 tracking-tight text-sm truncate">
            HealthConnect
          </span>
        </Link>
        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2A9D8F]/10 text-[#2A9D8F] shrink-0 border border-[#2A9D8F]/20 ml-2">
          {currentRole}
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#2A9D8F]/10 text-[#2A9D8F] font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#2A9D8F] text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={user?.avatar || 'https://ui-avatars.com/api/?name=User'}
            alt={user?.name || 'User'}
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name || 'Guest'}</p>
            <p className="text-[11px] text-gray-400 truncate">{user?.email || 'Not signed in'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
        >
          <HiOutlineLogout className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
