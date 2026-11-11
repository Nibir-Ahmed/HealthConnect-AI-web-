import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoIcon from '../assets/Images/logo_icon.jpg';

const Navbar = () => {
  const { user, role, logout } = useAuth();

  const portalPath =
    role === 'admin'
      ? '/admin/dashboard'
      : role === 'doctor'
        ? '/doctor/dashboard'
        : '/patient/dashboard';

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <img
              src={logoIcon}
              alt="HealthConnect logo"
              className="h-9 w-9 rounded-full object-cover"
            />
            <span className="text-lg font-semibold text-gray-900 tracking-tight">
              HealthConnect AI
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={logout}
                  className="text-sm font-medium text-gray-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Log out
                </button>
                <Link
                  to={portalPath}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-full transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                  style={{ backgroundColor: '#2A9D8F' }}
                >
                  <span>Go to {role ? `${role.charAt(0).toUpperCase() + role.slice(1)} Portal` : 'Portal'}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-300" />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 transition-colors no-underline"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-5 py-2 text-sm font-medium text-white rounded-full transition-all duration-200 hover:shadow-lg hover:scale-[1.03] active:scale-[0.97]"
                  style={{ backgroundColor: '#2A9D8F' }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;