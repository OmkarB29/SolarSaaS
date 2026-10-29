import React, { useState, useRef, useEffect } from 'react';
import { Bell, Globe, LogOut, Search, User, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { language, changeLanguage, supportedLanguages, currentLanguage, t } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Close language menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.fullName || 'SolarScope User';
  const displayRole = user?.role === 'ROLE_ADMIN' ? t('roleAdmin') : t('roleUser');

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20 w-full">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors w-5 h-5" />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Multilingual Selector */}
        <div className="relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all hover:border-slate-300 shadow-sm"
            title={t('language')}
          >
            <Globe className="w-4 h-4 text-primary-500" />
            <span className="hidden sm:inline">{currentLanguage.native}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">({currentLanguage.code})</span>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                {t('preferredLanguage')}
              </div>
              {supportedLanguages.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      changeLanguage(lang.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-primary-50 text-primary-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{lang.flag}</span>
                      <span>{lang.native}</span>
                      <span className="text-slate-400 text-[11px]">({lang.name})</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button className="relative p-2 text-slate-500 hover:text-primary-500 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full border border-white"></span>
        </button>
        
        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4 group">
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
            aria-label={t('logout')}
            title={t('logout')}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
