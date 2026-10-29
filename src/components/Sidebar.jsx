import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  BarChart3, 
  FileText, 
  Settings,
  Sun,
  ShieldCheck,
  Layers,
  FileCheck,
  Cpu,
  Box,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: t('dashboard') },
    { to: '/map', icon: <MapIcon size={20} />, label: t('mapSelection') },
    { to: '/analysis', icon: <BarChart3 size={20} />, label: t('analysis') },
    { to: '/solar-potential', icon: <Sun size={20} />, label: t('solarPotential') },
    { to: '/panel-optimizer', icon: <Cpu size={20} />, label: t('panelOptimizer') },
    { to: '/model-3d', icon: <Box size={20} />, label: t('model3D'), badge: 'NEW' },

    { to: '/my-analyses', icon: <Layers size={20} />, label: t('history') },
    { to: '/my-proposals', icon: <FileCheck size={20} />, label: t('myProposals') },
    { to: '/reports', icon: <FileText size={20} />, label: t('reports') },
    { to: '/settings', icon: <Settings size={20} />, label: t('settings') },
  ];

  const adminItems = [
    { to: '/admin', icon: <ShieldCheck size={20} />, label: t('adminDashboard') },
    { to: '/admin/users', icon: <ShieldCheck size={20} />, label: t('adminUsers') },
    { to: '/admin/analyses', icon: <BarChart3 size={20} />, label: t('adminAnalyses') },
    { to: '/admin/reports', icon: <FileText size={20} />, label: t('adminReports') },
    { to: '/admin/analytics', icon: <BarChart3 size={20} />, label: t('adminAnalytics') },
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
          Role: {isAdmin ? t('roleAdmin') : t('roleUser')}
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
            {t('adminPortal')}
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
              {t('adminPortal')}
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
