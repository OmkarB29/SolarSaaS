import React from 'react';

const SocialButton = ({ icon, children }) => {
  return (
    <button
      type="button"
      className="flex h-12 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/70"
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

export default SocialButton;
