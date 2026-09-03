import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  BarChart3, 
  History,
  FileText, 
  Settings,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const userRole = isAdmin ? 'ADMIN' : 'USER';

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/map', icon: <MapIcon size={20} />, label: 'Map Selection' },
    { to: '/analysis', icon: <BarChart3 size={20} />, label: 'Analysis' },
    { to: '/analysis-history', icon: <History size={20} />, label: 'History' },
    { to: '/reports', icon: <FileText size={20} />, label: 'Reports' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  const adminItems = [
    { to: '/admin', icon: <ShieldCheck size={20} />, label: 'Admin Dashboard' },
    { to: '/admin/users', icon: <ShieldCheck size={20} />, label: 'Admin Users' },
    { to: '/admin/analyses', icon: <BarChart3 size={20} />, label: 'Admin Analyses' },
    { to: '/admin/reports', icon: <FileText size={20} />, label: 'Admin Reports' },
    { to: '/admin/analytics', icon: <BarChart3 size={20} />, label: 'Admin Analytics' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full hidden md:flex">
      <div className="p-6 pb-4 flex items-center justify-between text-white">
        <div className="flex items-center space-x-3">
          <Sun className="text-primary-500 w-8 h-8" />
          <span className="text-2xl font-bold tracking-tight">SolarScope</span>
        </div>
      </div>

      {/* User Role Badge */}
      <div className="px-6 pb-2">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          Role: {isAdmin ? 'Administrator' : 'Standard User'}
        </div>
      </div>

      <nav className="flex-1 mt-3 px-4 overflow-y-auto">
        <ul className="space-y-1.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary-500/10 text-primary-500 font-medium' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="pt-5 pb-2">
          <div className="px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Admin Portal
          </div>
        </div>

        {isAdmin ? (
          <ul className="space-y-1.5">
            {adminItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-purple-500/10 text-purple-400 font-medium' 
                        : 'hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
              <ShieldCheck size={14} className="text-purple-400" />
              Admin Portal
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Sign in as <span className="text-purple-300 font-mono">admin@solarsaas.com</span> to manage users, analyses, and platform analytics.
            </p>
          </div>
        )}
      </nav>

      <div className="p-4 m-4 bg-slate-800 rounded-xl">
        <div className="text-xs text-slate-400 mb-2">Platform Status</div>
        <div className="flex items-center space-x-2 text-sm text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>All systems operational</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
