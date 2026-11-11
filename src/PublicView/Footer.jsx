import React from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../assets/Images/logo_icon.jpg';

const Footer = () => {
  const footerLinks = {
    Platform: [
      { label: 'Symptom Checker', to: '/patient/diagnosis' },
      { label: 'Find a Doctor', to: '/patient/doctors' },
      { label: 'Appointments', to: '/patient/appointments' },
      { label: 'Health Vault', to: '/patient/vault' },
    ],
    Portals: [
      { label: 'Patient Dashboard', to: '/patient/dashboard' },
      { label: 'Doctor Dashboard', to: '/doctor/dashboard' },
      { label: 'Admin Dashboard', to: '/admin/dashboard' },
    ],
    Account: [
      { label: 'Log In', to: '/login' },
      { label: 'Create Account', to: '/register' },
      { label: 'Emergency Profile', to: '/patient/profile' },
    ],
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <img src={logoIcon} alt="HealthConnect" className="h-9 w-9 rounded-full object-cover" />
              <span className="text-lg font-bold text-gray-900">HealthConnect</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Check symptoms in Bangla, Banglish, or English, book appointments with doctors, and manage your medical records in one place.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">{heading}</h4>
              <ul className="space-y-2.5 list-none p-0 m-0">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-500 hover:text-gray-800 transition-colors no-underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 px-6 py-4 text-center">
          <p className="text-xs text-gray-600 leading-relaxed">
            <span className="font-semibold text-gray-800">Disclaimer:</span>{' '}
            HealthConnect helps you understand your symptoms and connect with doctors. It is not a replacement for in-person medical advice. In emergencies, call 999 or go to the nearest hospital.
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-center text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} HealthConnect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
