import React from 'react';
import { BarChart3, ShieldCheck, Sun, Zap } from 'lucide-react';

const AuthShell = ({ eyebrow, title, subtitle, children }) => {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-900 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.26),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,#0f172a_0%,#111827_54%,#020617_100%)]" />
        <div className="absolute left-12 right-12 top-28 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 ring-1 ring-primary-400/30">
            <Sun className="h-6 w-6 text-primary-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight">SolarScope</span>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-primary-100 backdrop-blur">
            <Zap className="h-4 w-4 text-primary-300" />
            Smart Solar Rooftop Analysis Platform
          </div>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            Turn rooftop data into bankable solar decisions.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Analyze potential generation, savings, ROI, and carbon impact from one polished workspace.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <BarChart3 className="mb-6 h-6 w-6 text-primary-300" />
              <div className="text-3xl font-semibold">24.5%</div>
              <div className="mt-1 text-sm text-slate-300">Projected portfolio ROI</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <ShieldCheck className="mb-6 h-6 w-6 text-emerald-300" />
              <div className="text-3xl font-semibold">99.9%</div>
              <div className="mt-1 text-sm text-slate-300">Analysis workflow uptime</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 rounded-3xl border border-white/10 bg-white/10 p-5 text-sm text-slate-300 backdrop-blur-xl">
          Premium planning tools for installers, commercial property teams, and energy analysts.
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 py-10 sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_90%_80%,rgba(15,23,42,0.08),transparent_30%)]" />
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900">
              <Sun className="h-5 w-5 text-primary-400" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-950">SolarScope</span>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-8">
            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">{eyebrow}</p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
};

export default AuthShell;
