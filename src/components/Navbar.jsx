import React from 'react';
import { Bell, LogOut, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.fullName || 'SolarScope User';
  const displayRole = user?.role || 'Energy Analyst';

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 w-full">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search projects, locations, or reports..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-slate-500 hover:text-primary-500 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full border border-white"></span>
        </button>
        
        <div className="flex items-center space-x-3 border-l border-slate-200 pl-6 group">
          <div className="text-right hidden md:block">
            <div className="text-sm font-medium text-slate-900 group-hover:text-primary-500 transition-colors">{displayName}</div>
            <div className="text-xs text-slate-500">{displayRole}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-400 to-orange-500 flex items-center justify-center text-white shadow-sm ring-2 ring-white">
            <User className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-red-500"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
