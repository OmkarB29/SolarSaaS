import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import AuthInput from '../components/auth/AuthInput';
import AuthShell from '../components/auth/AuthShell';
import SocialButton from '../components/auth/SocialButton';
import { useAuth } from '../context/useAuth';

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!validateEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.password) nextErrors.password = 'Password is required.';
    else if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password, remember: form.remember });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to your workspace"
      subtitle="Continue monitoring rooftop feasibility, ROI projections, and report pipelines."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          icon={Mail}
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          error={errors.email}
        />
        <AuthInput
          icon={Lock}
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
          error={errors.password}
        />

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(event) => updateField('remember', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
            />
            Remember me
          </label>
          <button type="button" className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in...' : 'Login'}
          {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
        </button>
        {errors.form && <p className="text-sm text-red-500">{errors.form}</p>}
      </form>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
          Quick Demo Accounts (1-Click Fill)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setForm({ email: 'admin@solarsaas.com', password: 'Admin@12345', remember: true });
              setErrors({});
            }}
            className="flex flex-col items-start p-2.5 rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 transition-all text-left"
          >
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1">
              👑 Admin Account
            </span>
            <span className="text-[11px] text-purple-700 truncate w-full">admin@solarsaas.com</span>
            <span className="text-[10px] text-purple-500">Full admin dashboard access</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setForm({ email: 'user@solarsaas.com', password: 'User@12345', remember: true });
              setErrors({});
            }}
            className="flex flex-col items-start p-2.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 transition-all text-left"
          >
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
              👤 User Account
            </span>
            <span className="text-[11px] text-blue-700 truncate w-full">user@solarsaas.com</span>
            <span className="text-[10px] text-blue-500">Standard rooftop workflow</span>
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
          Sign Up
        </Link>
      </p>
    </AuthShell>
  );
};

export default Login;
