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

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!validateEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.password) nextErrors.password = 'Password is required.';
    else if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    window.setTimeout(() => {
      login({ email: form.email.trim(), remember: form.remember });
      navigate(redirectTo, { replace: true });
    }, 550);
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
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SocialButton icon={<span className="text-base font-bold text-slate-900">G</span>}>Google</SocialButton>
        <SocialButton icon={<span className="text-base font-bold text-slate-900">GH</span>}>GitHub</SocialButton>
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
