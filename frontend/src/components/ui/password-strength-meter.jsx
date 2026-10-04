'use client';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function calculatePasswordStrength(password) {
  if (!password) {
    return { score: 0, label: '', color: '', percent: 0, criteria: [] };
  }

  const criteria = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Upper & lowercase', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special character', met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ];

  const score = criteria.filter(c => c.met).length;

  const levels = {
    0: { label: '', color: '', percent: 0 },
    1: { label: 'Weak', color: '#ef4444', percent: 25 },
    2: { label: 'Fair', color: '#f59e0b', percent: 50 },
    3: { label: 'Good', color: '#10b981', percent: 75 },
    4: { label: 'Strong', color: '#1e5038', percent: 100 },
  };

  return { ...levels[score], score, criteria };
}

export function PasswordStrengthMeter({ password, className = '', showCriteria = true }) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className={cn('flex flex-col gap-2 mt-2', className)} role="status" aria-label={`Password strength: ${strength.label}`}>
      {/* Segment bar */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((step) => {
          const isActive = strength.score >= step;
          return (
            <div
              key={step}
              className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden"
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: isActive ? '100%' : '0%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: step * 0.05 }}
                style={{ backgroundColor: isActive ? strength.color : 'transparent' }}
              />
            </div>
          );
        })}
      </div>

      {/* Label */}
      {strength.label && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Password strength:</span>
          <motion.span
            className="font-semibold"
            style={{ color: strength.color }}
            key={strength.label}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {strength.label}
          </motion.span>
        </div>
      )}

      {/* Criteria chips */}
      {showCriteria && strength.criteria?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {strength.criteria.map((c) => (
            <motion.span
              key={c.label}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors',
                c.met
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-50 text-gray-400 border-gray-200',
              )}
              animate={{ scale: c.met ? [1, 1.08, 1] : 1 }}
              transition={{ duration: 0.2 }}
            >
              {c.met
                ? <Check className="w-2.5 h-2.5" />
                : <X className="w-2.5 h-2.5" />
              }
              {c.label}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;
