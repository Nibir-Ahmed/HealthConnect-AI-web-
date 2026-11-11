import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../PublicView/Navbar';
import Footer from '../PublicView/Footer';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
