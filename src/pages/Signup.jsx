import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import AuthInput from '../components/auth/AuthInput';
import AuthShell from '../components/auth/AuthShell';
import PasswordStrength from '../components/auth/PasswordStrength';
import { useAuth } from '../context/useAuth';
import { getPasswordStrength } from '../services/passwordStrength';

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Signup = () => {
  const { isAuthenticated, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!validateEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.password) nextErrors.password = 'Password is required.';
    else if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    else if (getPasswordStrength(form.password) < 2) nextErrors.password = 'Use a stronger password.';
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirm your password.';
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    if (!form.terms) nextErrors.terms = 'Accept the terms to continue.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    window.setTimeout(() => {
      signup({ fullName: form.fullName.trim(), email: form.email.trim() });
      navigate('/dashboard', { replace: true });
    }, 650);
  };

  return (
    <AuthShell
      eyebrow="Create workspace"
      title="Start your solar analysis"
      subtitle="Set up a local demo account and jump straight into the SolarScope dashboard."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          icon={User}
          label="Full Name"
          placeholder="Alex Morgan"
          value={form.fullName}
          onChange={(event) => updateField('fullName', event.target.value)}
          error={errors.fullName}
        />
        <AuthInput
          icon={Mail}
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          error={errors.email}
        />
        <div>
          <AuthInput
            icon={Lock}
            label="Password"
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            error={errors.password}
          />
          <PasswordStrength password={form.password} />
        </div>
        <AuthInput
          icon={Lock}
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={(event) => updateField('confirmPassword', event.target.value)}
          error={errors.confirmPassword}
        />

        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={form.terms}
            onChange={(event) => updateField('terms', event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
          />
          <span>
            I accept the terms and agree to use SolarScope for rooftop feasibility planning.
            {errors.terms && <span className="mt-1 block text-red-500">{errors.terms}</span>}
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Creating account...' : 'Create Account'}
          {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
          Login
        </Link>
      </p>
    </AuthShell>
  );
};

export default Signup;
