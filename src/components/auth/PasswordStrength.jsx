import React from 'react';
import { getPasswordStrength } from '../../services/passwordStrength';

const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

const PasswordStrength = ({ password }) => {
  const strength = getPasswordStrength(password);
  const activeBars = password ? Math.max(strength, 1) : 0;

  return (
    <div className="mt-3">
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={`h-1.5 rounded-full transition-colors ${
              bar < activeBars
                ? strength >= 4
                  ? 'bg-emerald-500'
                  : strength >= 3
                    ? 'bg-primary-500'
                    : 'bg-red-400'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="mt-2 text-xs font-medium text-slate-500">{password ? labels[strength] : 'Use 8+ characters'}</div>
    </div>
  );
};

export default PasswordStrength;
