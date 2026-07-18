import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const AuthInput = ({ icon: Icon, label, error, type = 'text', className = '', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div
        className={`group flex items-center rounded-2xl border bg-white px-4 transition-all duration-200 ${
          error
            ? 'border-red-300 ring-4 ring-red-50'
            : 'border-slate-200 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10'
        }`}
      >
        {Icon && <Icon className="mr-3 h-5 w-5 text-slate-400 group-focus-within:text-primary-500" />}
        <input
          type={inputType}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="ml-3 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && <span className="mt-2 block text-sm text-red-500">{error}</span>}
    </label>
  );
};

export default AuthInput;
