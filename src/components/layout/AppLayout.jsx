import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';

const AppLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
