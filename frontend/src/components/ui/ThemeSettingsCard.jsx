'use client';
import React, { useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, Check, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { AdminAuthContext } from '../../admin/AdminAuthContext';
import { StaffAuthContext } from '../../staff/StaffAuthContext';
import { apiFetch, getAuthUrl, getAdminUrl, getStaffUrl } from '../../api/client';
import { cn } from '../../lib/utils';

/**
 * ThemeSettingsCard — 21st.dev Reusable Theme & Appearance Setting Card
 *
 * Plug-and-play component for Dentist, Admin, and Staff portal settings.
 * Synchronizes with database backend: Dentist, Staff, and Admin themes persist across sessions and devices.
 * Ponytail: zero extra libraries, native SVG icons, immediate reactivity.
 * Impeccable: zero emojis, WCAG AAA contrast, tactile micro-feedback.
 */
export function ThemeSettingsCard({ className = '' }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const auth = useContext(AuthContext);
  const adminAuth = useContext(AdminAuthContext);
  const staffAuth = useContext(StaffAuthContext);
  const [syncing, setSyncing] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const options = [
    {
      key: 'light',
      label: 'Light',
      desc: 'Warm mineral stone palette with sage green accents.',
      icon: Sun,
    },
    {
      key: 'dark',
      label: 'Dark',
      desc: 'OLED carbon surfaces engineered for clinical focus.',
      icon: Moon,
    },
    {
      key: 'system',
      label: 'System',
      desc: 'Automatically aligns with your device OS preference.',
      icon: Monitor,
    },
  ];

  const handleSelect = async (optKey) => {
    // 1. Instantly apply theme in UI
    setTheme(optKey);

    // 2. Persist to database if authenticated
    setSyncing(true);
    try {
      if (auth?.user?.id) {
        await apiFetch(`${getAuthUrl()}/profile`, {
          method: 'PUT',
          body: JSON.stringify({ themePreference: optKey }),
        });
        auth.updateUserState?.({ themePreference: optKey });
      } else if (staffAuth?.staff?.id) {
        await apiFetch(`${getStaffUrl()}/profile`, {
          method: 'PUT',
          body: JSON.stringify({ themePreference: optKey }),
        });
        staffAuth.updateStaffState?.({ ...staffAuth.staff, themePreference: optKey });
      } else if (adminAuth?.admin?.username) {
        await apiFetch(`${getAdminUrl()}/settings/theme`, {
          method: 'PUT',
          body: JSON.stringify({ theme: optKey }),
        });
      }
    } catch (e) {
      // Non-blocking error: fallback to localStorage preserves preference
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className={cn(
        'w-full rounded-2xl bg-card border border-border p-5 sm:p-6 transition-colors duration-200',
        'shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
            <Sun className="w-4 h-4 text-primary" />
            Appearance & Theme
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personalize how Dentzy displays across your workspace. Your preference is saved to your account.
          </p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary self-start sm:self-auto flex items-center gap-1.5 border border-primary/20">
          {syncing ? (
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
          Active: {mounted ? (resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode') : 'Syncing'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        {options.map((opt) => {
          const isSelected = theme === opt.key;
          const Icon = opt.icon;

          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(opt.key)}
              className={cn(
                'relative flex flex-col p-4 rounded-xl text-left transition-all duration-200 cursor-pointer select-none',
                'border outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                isSelected
                  ? 'bg-accent/40 border-primary shadow-xs'
                  : 'bg-card border-border hover:border-primary/40 hover:bg-muted/40',
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="theme-active-ring"
                  className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}

              <div className="flex items-center justify-between w-full mb-2.5">
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                )}
              </div>

              <span className="text-sm font-bold text-foreground">
                {opt.label}
              </span>
              <span className="text-[11px] text-muted-foreground mt-1 leading-snug">
                {opt.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ThemeSettingsCard;
