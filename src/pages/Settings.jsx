import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  UserCircle, 
  Bell, 
  ShieldCheck, 
  Wallet,
  Globe,
  CheckCircle2,
  Save,
  KeyRound,
  Smartphone,
  Laptop,
  Download,
  Check
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/useAuth';
import { userSettingsService } from '../services/userSettingsService';

const DEFAULT_SETTINGS = {
  // Profile
  fullName: '',
  email: '',
  avatarColor: 'from-amber-500 to-orange-600',
  // Preferences
  useMetric: true,
  emailReports: true,
  darkMapOverlay: false,
  electricityRate: 8.0,
  // Organization
  orgName: 'SolarScope CleanEnergy Ltd',
  orgSize: '11-50',
  industry: 'Solar EPC & Rooftop Installer',
  orgLocation: 'Pune, Maharashtra, India',
  taxId: '27AABCS1429B1Z8',
  phone: '+91 20 6712 8900',
  website: 'https://solarsaas.com',
  // Notifications
  notifyAnalysisComplete: true,
  notifyMonthlySummary: true,
  notifyMaintenance: false,
  notifyHighIrradiance: true,
  notifySecurity: true,
  // Regional
  defaultLocation: 'Pune, Maharashtra (18.5204, 73.8567)',
  defaultLat: 18.5204,
  defaultLng: 73.8567,
  currency: 'INR (₹)',
  irradianceModel: 'NASA POWER & Global Solar Atlas (GSA)',
  emissionFactor: 0.82,
  defaultPanelWattage: 400,
  // Security
  twoFactorEnabled: false,
};

const AVATAR_COLORS = [
  { name: 'Amber', gradient: 'from-amber-500 to-orange-600' },
  { name: 'Blue', gradient: 'from-blue-500 to-indigo-600' },
  { name: 'Emerald', gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Violet', gradient: 'from-purple-500 to-pink-600' },
];

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('solarscope.settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [savedFeedback, setSavedFeedback] = useState(false);
  const [passwordState, setPasswordState] = useState({
    current: '',
    newPass: '',
    confirmPass: '',
  });
  const [passwordFeedback, setPasswordFeedback] = useState('');

  // Sync with current user profile if settings name/email are empty
  useEffect(() => {
    if (user) {
      setSettings((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || (user.email ? user.email.split('@')[0] : 'Solar User'),
        email: prev.email || user.email || 'user@solarsaas.com',
      }));
    }

    // Load persisted settings from PostgreSQL
    userSettingsService.getSettings()
      .then((res) => {
        if (res && res.autoEmailReports !== undefined) {
          setSettings((prev) => ({ ...prev, emailReports: res.autoEmailReports }));
        }
      })
      .catch((err) => {
        console.warn('Could not load backend user settings:', err);
      });
  }, [user]);

  const handleToggle = (key) => {
    const nextVal = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: nextVal }));

    if (key === 'emailReports') {
      userSettingsService.updateSettings({ autoEmailReports: nextVal }).catch((err) => {
        console.warn('Could not persist autoEmailReports toggle in backend:', err);
      });
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    localStorage.setItem('solarscope.settings', JSON.stringify(settings));

    try {
      await userSettingsService.updateSettings({ autoEmailReports: settings.emailReports });
    } catch (err) {
      console.warn('Could not persist settings in backend:', err);
    }

    // Also update cached auth user object if name/email changed
    try {
      const authKey = 'solarscope.auth';
      const sessionKey = 'solarscope.session';
      const stored = JSON.parse(localStorage.getItem(authKey)) || JSON.parse(sessionStorage.getItem(sessionKey));
      if (stored && stored.user) {
        stored.user.fullName = settings.fullName;
        stored.user.email = settings.email;
        if (localStorage.getItem(authKey)) {
          localStorage.setItem(authKey, JSON.stringify(stored));
        } else {
          sessionStorage.setItem(sessionKey, JSON.stringify(stored));
        }
      }
    } catch {
      // Non-blocking
    }

    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
    }, 3500);
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!passwordState.current) {
      setPasswordFeedback('Please enter your current password.');
      return;
    }
    if (!passwordState.newPass || passwordState.newPass.length < 6) {
      setPasswordFeedback('New password must be at least 6 characters long.');
      return;
    }
    if (passwordState.newPass !== passwordState.confirmPass) {
      setPasswordFeedback('New passwords do not match.');
      return;
    }

    setPasswordFeedback('Password updated successfully!');
    setPasswordState({ current: '', newPass: '', confirmPass: '' });
    setTimeout(() => setPasswordFeedback(''), 4000);
  };

  const initials = (settings.fullName || user?.fullName || user?.email || 'U')
    .slice(0, 2)
    .toUpperCase();

  const userRole = user?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Standard User';

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: UserCircle },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing & Plans', icon: Wallet },
    { id: 'regional', label: 'Regional Data', icon: Globe },
    { id: 'security', label: 'Security & Access', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account credentials, regional presets, and system preferences</p>
        </div>
        <button 
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Save size={18} />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Success Banner */}
      {savedFeedback && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm animate-fade-in">
          <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
          <span>Settings have been updated and saved successfully!</span>
        </div>
      )}

      {/* Main Settings Card */}
      <Card className="p-0 overflow-hidden flex flex-col md:flex-row min-h-[580px] shadow-sm">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200 p-4 space-y-1.5 shrink-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Sections</p>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-6 px-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500 shadow-xs">
              <p className="font-semibold text-slate-700">Account Type</p>
              <p className="mt-0.5 text-blue-600 font-medium">{userRole}</p>
              <p className="mt-2 text-slate-400">Environment: Local Demo</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
          
          {/* TAB 1: MY PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6">Profile Settings</h3>
                
                <div className="space-y-6">
                  {/* Avatar Picker */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${settings.avatarColor} flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0`}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">Avatar Style</p>
                      <div className="flex items-center gap-2 mt-2">
                        {AVATAR_COLORS.map((col) => (
                          <button
                            key={col.name}
                            type="button"
                            onClick={() => handleChange('avatarColor', col.gradient)}
                            className={`w-7 h-7 rounded-full bg-gradient-to-tr ${col.gradient} flex items-center justify-center transition-transform cursor-pointer ${
                              settings.avatarColor === col.gradient ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-80 hover:opacity-100'
                            }`}
                            title={col.name}
                          >
                            {settings.avatarColor === col.gradient && <Check size={12} className="text-white" />}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Choose an avatar color palette for your profile</p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={settings.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        placeholder="e.g. Omkar Biradar"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Platform Role</label>
                      <input 
                        type="text" 
                        disabled
                        value={userRole}
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium cursor-not-allowed"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        value={settings.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        placeholder="e.g. user@solarsaas.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences Section */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6">User Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <p className="font-medium text-slate-800">Use Metric System (m²)</p>
                      <p className="text-xs text-slate-500">Display rooftop area in square meters instead of square feet</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleToggle('useMetric')}
                      className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${settings.useMetric ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.useMetric ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800">Auto-Email Reports</p>
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          PostgreSQL Synced
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Automatically dispatch a PDF copy when generating solar feasibility proposals</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleToggle('emailReports')}
                      className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${settings.emailReports ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.emailReports ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <p className="font-medium text-slate-800">Default Electricity Tariff (₹/kWh)</p>
                      <p className="text-xs text-slate-500">Benchmark rate used to compute annual cost savings & payback</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-600">₹</span>
                      <input 
                        type="number"
                        step="0.5"
                        min="1"
                        max="50"
                        value={settings.electricityRate}
                        onChange={(e) => handleChange('electricityRate', parseFloat(e.target.value) || 0)}
                        className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIZATION */}
          {activeTab === 'organization' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6">Organization Profile</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company / Enterprise Name</label>
                  <input 
                    type="text" 
                    value={settings.orgName}
                    onChange={(e) => handleChange('orgName', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Industry / Sector</label>
                  <select 
                    value={settings.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option>Solar EPC & Rooftop Installer</option>
                    <option>Commercial & Industrial Real Estate</option>
                    <option>Energy Efficiency Consultancy</option>
                    <option>Residential Solar Integrator</option>
                    <option>Academic & Research Institution</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Team Size</label>
                  <select 
                    value={settings.orgSize}
                    onChange={(e) => handleChange('orgSize', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option>1-10 employees</option>
                    <option>11-50 employees</option>
                    <option>51-200 employees</option>
                    <option>200+ enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Headquarters City / State</label>
                  <input 
                    type="text" 
                    value={settings.orgLocation}
                    onChange={(e) => handleChange('orgLocation', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">GSTIN / Tax ID</label>
                  <input 
                    type="text" 
                    value={settings.taxId}
                    onChange={(e) => handleChange('taxId', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                  <input 
                    type="text" 
                    value={settings.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="font-semibold text-slate-800">Solar Analysis Alerts</p>
                    <p className="text-xs text-slate-500">Receive instant email confirmations when a rooftop simulation finishes</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleToggle('notifyAnalysisComplete')}
                    className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${settings.notifyAnalysisComplete ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.notifyAnalysisComplete ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="font-semibold text-slate-800">Monthly Executive Summary</p>
                    <p className="text-xs text-slate-500">Detailed periodic breakdown of energy generated, CO₂ reduced, and payback</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleToggle('notifyMonthlySummary')}
                    className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${settings.notifyMonthlySummary ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.notifyMonthlySummary ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="font-semibold text-slate-800">Solar Irradiance Weather Spikes</p>
                    <p className="text-xs text-slate-500">Alerts for peak solar irradiance windows based on NASA POWER forecasting</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleToggle('notifyHighIrradiance')}
                    className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${settings.notifyHighIrradiance ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.notifyHighIrradiance ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="font-semibold text-slate-800">Security & Sign-in Activity</p>
                    <p className="text-xs text-slate-500">Receive security alerts when logins occur from unrecognized browsers</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleToggle('notifySecurity')}
                    className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${settings.notifySecurity ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.notifySecurity ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BILLING & PLANS */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6">Subscription & Usage</h3>
              
              {/* Plan Card */}
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 text-white">
                      {user?.role === 'ROLE_ADMIN' ? 'Enterprise License' : 'Pro Tier Active'}
                    </span>
                    <h4 className="text-xl font-bold text-slate-900 mt-2">SolarScope Professional Platform</h4>
                    <p className="text-sm text-slate-600">Full satellite rooftop mapping, shading simulation, and PDF reports</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">₹0 <span className="text-sm font-normal text-slate-500">/ local demo</span></p>
                    <p className="text-xs text-emerald-600 font-medium">All features unlocked</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-blue-100">
                  <div>
                    <p className="text-xs text-slate-500">Analyses Quota</p>
                    <p className="text-lg font-bold text-slate-800">Unlimited</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Weather API Queries</p>
                    <p className="text-lg font-bold text-slate-800">Active (NASA POWER)</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Report Exports</p>
                    <p className="text-lg font-bold text-slate-800">Full Resolution PDF</p>
                  </div>
                </div>
              </div>

              {/* Invoices List */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3">Recent Billing Invoices</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Invoice ID</th>
                        <th className="px-4 py-3">Billing Date</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="px-4 py-3 font-medium">INV-2026-003</td>
                        <td className="px-4 py-3">Sept 1, 2026</td>
                        <td className="px-4 py-3">₹4,999.00</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Paid</span></td>
                        <td className="px-4 py-3 text-right"><button className="text-blue-600 hover:text-blue-800 font-medium text-xs inline-flex items-center gap-1 cursor-pointer"><Download size={13} /> PDF</button></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">INV-2026-002</td>
                        <td className="px-4 py-3">Aug 1, 2026</td>
                        <td className="px-4 py-3">₹4,999.00</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Paid</span></td>
                        <td className="px-4 py-3 text-right"><button className="text-blue-600 hover:text-blue-800 font-medium text-xs inline-flex items-center gap-1 cursor-pointer"><Download size={13} /> PDF</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REGIONAL & SOLAR DATA */}
          {activeTab === 'regional' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6">Regional & Solar Constants</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Default Location Preset</label>
                  <input 
                    type="text" 
                    value={settings.defaultLocation}
                    onChange={(e) => handleChange('defaultLocation', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-slate-500 mt-1">Starting center for Map Selection screen</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Default Currency</label>
                  <select 
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Solar Irradiance Database Model</label>
                  <select 
                    value={settings.irradianceModel}
                    onChange={(e) => handleChange('irradianceModel', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option>NASA POWER & Global Solar Atlas (GSA)</option>
                    <option>NREL PVWatts v8</option>
                    <option>PVGIS European & Mediterranean</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Grid Emission Factor (kg CO₂ / kWh)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={settings.emissionFactor}
                    onChange={(e) => handleChange('emissionFactor', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-slate-500 mt-1">India Central Electricity Authority (CEA) benchmark: 0.82</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Standard Panel Capacity (Watts)</label>
                  <input 
                    type="number" 
                    step="20"
                    value={settings.defaultPanelWattage}
                    onChange={(e) => handleChange('defaultPanelWattage', parseInt(e.target.value, 10) || 400)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-slate-500 mt-1">Default monocrystalline panel size used in layout calculation</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY & SESSIONS */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-fade-in">
              {/* Password change */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6">Security & Authentication</h3>
                
                {passwordFeedback && (
                  <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                    passwordFeedback.includes('successfully') 
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                      : 'border-red-200 bg-red-50 text-red-600'
                  }`}>
                    {passwordFeedback}
                  </div>
                )}

                <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                    <input 
                      type="password" 
                      value={passwordState.current}
                      onChange={(e) => setPasswordState({ ...passwordState, current: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input 
                      type="password" 
                      value={passwordState.newPass}
                      onChange={(e) => setPasswordState({ ...passwordState, newPass: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={passwordState.confirmPass}
                      onChange={(e) => setPasswordState({ ...passwordState, confirmPass: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Repeat new password"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors mt-2 cursor-pointer"
                  >
                    <KeyRound size={16} />
                    <span>Update Password</span>
                  </button>
                </form>
              </div>

              {/* 2FA Section */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700 mt-0.5">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Two-Factor Authentication (2FA)</p>
                      <p className="text-xs text-slate-500">Require an authenticator app code on login for heightened security</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleToggle('twoFactorEnabled')}
                    className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${settings.twoFactorEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.twoFactorEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="font-bold text-slate-800 mb-3">Active Browser Sessions</h4>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                        <Laptop size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Current Session (Chrome on Windows)</p>
                        <p className="text-xs text-slate-500">IP: 127.0.0.1 • Active Now</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      This Device
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </Card>
    </div>
  );
};

export default Settings;
