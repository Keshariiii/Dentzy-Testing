'use client';
import React, { useMemo } from 'react';
import { cn } from '../../lib/utils';

export function calculatePasswordStrength(password) {
  if (!password) {
    return { score: 0, label: '', color: '', percent: 0 };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: 'Weak', color: '#ef4444', percent: 25 };
    case 2:
      return { score: 2, label: 'Fair', color: '#f59e0b', percent: 50 };
    case 3:
      return { score: 3, label: 'Good', color: '#10b981', percent: 75 };
    case 4:
      return { score: 4, label: 'Strong', color: '#1e5038', percent: 100 };
    default:
      return { score: 0, label: '', color: '', percent: 0 };
  }
}

export function PasswordStrengthMeter({ password, className = '' }) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className={cn('flex flex-col gap-1.5 mt-2', className)} role="status" aria-label={`Password strength: ${strength.label}`}>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((step) => {
          const isActive = strength.score >= step;
          return (
            <div
              key={step}
              className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden transition-all duration-300"
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: isActive ? '100%' : '0%',
                  backgroundColor: isActive ? strength.color : 'transparent',
                }}
              />
            </div>
          );
        })}
      </div>
      {strength.label && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Password strength:</span>
          <span className="font-semibold transition-colors duration-200" style={{ color: strength.color }}>
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;
