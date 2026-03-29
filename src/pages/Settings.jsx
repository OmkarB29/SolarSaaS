import React from 'react';
import { 
  Building2, 
  UserCircle, 
  Bell, 
  ShieldCheck, 
  Wallet,
  Globe
} from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
          <p className="text-slate-500 mt-1">Manage account, preferences, and organization data</p>
        </div>
        <button className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/30">
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-200 p-6 space-y-1">
          <button className="w-full flex items-center space-x-3 px-4 py-3 bg-white text-primary-600 font-medium rounded-xl shadow-sm border border-slate-200 transition-all">
            <UserCircle size={18} />
            <span>My Profile</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-slate-100 font-medium rounded-xl transition-all">
            <Building2 size={18} />
            <span>Organization</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-slate-100 font-medium rounded-xl transition-all">
            <Bell size={18} />
            <span>Notifications</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-slate-100 font-medium rounded-xl transition-all">
            <Wallet size={18} />
            <span>Billing</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-slate-100 font-medium rounded-xl transition-all">
            <Globe size={18} />
            <span>Regional Data</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-slate-100 font-medium rounded-xl transition-all">
            <ShieldCheck size={18} />
            <span>Security</span>
          </button>
        </div>

        {/* Settings Content area */}
        <div className="flex-1 p-8 space-y-8">
          
          <div>
             <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-6">Profile Settings</h3>
             
             <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary-400 to-orange-500 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                    AJ
                  </div>
                  <div>
                    <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors mb-1">
                      Change Avatar
                    </button>
                    <p className="text-xs text-slate-500">JPG, GIF or PNG. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      defaultValue="Alice Johnson"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                    <input 
                      type="text" 
                      disabled
                      className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                      defaultValue="Energy Analyst"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      defaultValue="alice.j@acmecorp.net"
                    />
                  </div>
                </div>
             </div>
          </div>

          <div>
             <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-6">Preferences</h3>
             
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Use Metric System (m²)</p>
                    <p className="text-sm text-slate-500">Display area in square meters instead of sq. ft</p>
                  </div>
                  <button className="w-12 h-6 bg-primary-500 rounded-full relative transition-colors shadow-inner">
                    <div className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"></div>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Email Reports</p>
                    <p className="text-sm text-slate-500">Automatically email generated reports to my inbox</p>
                  </div>
                  <button className="w-12 h-6 bg-slate-200 rounded-full relative transition-colors shadow-inner">
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"></div>
                  </button>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
