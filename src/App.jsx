import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import db from './services/db';
import logoIcon from './assets/Images/logo_icon.jpg';
import { HiOutlineExclamation, HiOutlinePhone } from 'react-icons/hi';

const ROUTE_TITLES = {
  '/': 'Home | HealthConnect',
  '/login': 'Log In | HealthConnect',
  '/register': 'Create Account | HealthConnect',
  '/patient/dashboard': 'Patient Dashboard | HealthConnect',
  '/patient/diagnosis': 'Symptom Checker | HealthConnect',
  '/patient/doctors': 'Find Doctors | HealthConnect',
  '/patient/appointments': 'My Appointments | HealthConnect',
  '/patient/chat': 'Chat with Doctor | HealthConnect',
  '/patient/vault': 'Medical Records | HealthConnect',
  '/patient/profile': 'Emergency Medical Card | HealthConnect',
  '/doctor/dashboard': 'Doctor Dashboard | HealthConnect',
  '/doctor/appointments': 'Appointments Queue | HealthConnect',
  '/doctor/chat': 'Patient Consultations | HealthConnect',
  '/doctor/prescriptions': 'Write Prescription | HealthConnect',
  '/doctor/settings': 'Practice Settings | HealthConnect',
  '/admin/dashboard': 'Admin Dashboard | HealthConnect',
  '/admin/verifications': 'Doctor Verification | HealthConnect',
  '/admin/users': 'User Directory | HealthConnect',
  '/admin/blogs': 'Blog Manager | HealthConnect',
  '/admin/settings': 'System Settings | HealthConnect',
};

const PageMetaUpdater = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    let title = ROUTE_TITLES[pathname];
    if (!title) {
      if (pathname.startsWith('/patient/doctors/')) title = 'Doctor Profile | HealthConnect';
      else if (pathname.startsWith('/patient/chat/')) title = 'Chat with Doctor | HealthConnect';
      else if (pathname.startsWith('/doctor/chat/')) title = 'Patient Consultation | HealthConnect';
      else title = 'HealthConnect';
    }
    document.title = title;

    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/jpeg';
    link.href = logoIcon;
  }, [pathname]);

  return null;
};

const MaintenanceBanner = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState(() => db.get('system_config'));

  useEffect(() => {
    return db.subscribe('system_config', (latest) => {
      setConfig(latest || db.get('system_config'));
    });
  }, []);

  // If maintenance mode is active and user is not an admin, lock the screen per context.md
  if (config?.maintenanceMode && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <HiOutlineExclamation className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Platform Under Scheduled Maintenance</h1>
        <p className="text-slate-300 max-w-md mb-6">
          HealthConnect is currently undergoing scheduled maintenance. We will be back online shortly.
        </p>
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 max-w-sm w-full">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Emergency Medical Hotline
          </p>
          <a
            href={`tel:${config?.emergencyPhone || '999'}`}
            className="text-xl font-bold text-red-400 hover:text-red-300 inline-flex items-center gap-2"
          >
            <HiOutlinePhone className="w-5 h-5 inline-block mr-1" /> Dial {config?.emergencyPhone || '999'}
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <PageMetaUpdater />
      <MaintenanceBanner />
    </AuthProvider>
  );
}

export default App;