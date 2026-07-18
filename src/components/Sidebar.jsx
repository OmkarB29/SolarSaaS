import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  BarChart3, 
  FileText, 
  Settings,
  Sun
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/map', icon: <MapIcon size={20} />, label: 'Map Selection' },
    { to: '/analysis', icon: <BarChart3 size={20} />, label: 'Analysis' },
    { to: '/reports', icon: <FileText size={20} />, label: 'Reports' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full hidden md:flex">
      <div className="p-6 flex items-center space-x-3 text-white">
        <Sun className="text-primary-500 w-8 h-8" />
        <span className="text-2xl font-bold tracking-tight">SolarScope</span>
      </div>

      <nav className="flex-1 mt-6 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
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
