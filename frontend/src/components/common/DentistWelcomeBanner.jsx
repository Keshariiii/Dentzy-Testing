'use client';
import React from 'react';
import { Sparkles, ArrowRight, UserCheck, FilePlus2, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * DentistWelcomeBanner — Shared First-Time Onboarding Banner (PC & Mobile)
 *
 * Displays a unified, welcoming checklist for new dentists with zero orders.
 *
 * @param {object} props
 * @param {string} props.userName - Dentist's name
 * @param {function} [props.onNavigateSettings] - Action to jump to settings tab
 * @param {function} [props.onNavigateOrders] - Action to jump to orders tab
 * @param {string} [props.className]
 */
export function DentistWelcomeBanner({
  userName = 'Doctor',
  onNavigateSettings,
  onNavigateOrders,
  className,
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[14px] p-4 sm:p-5 mb-5',
        'bg-gradient-to-br from-primary-muted/30 via-surface to-primary-muted/15',
        'border border-primary/20 shadow-xs',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 text-primary-dark">
            <Sparkles size={18} />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-dark tracking-tight m-0">
            Welcome, Dr. {userName}!
          </h3>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-charcoal/70 mb-3.5 leading-relaxed">
        Your clinical account is active. Here is how to get started with Dentzy:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Step 1 */}
        <div
          onClick={onNavigateSettings}
          className={cn(
            'flex items-center gap-2.5 p-2.5 rounded-xl bg-white/70 border border-primary/15',
            'transition-all duration-150',
            onNavigateSettings && 'cursor-pointer hover:bg-white hover:border-primary/40 hover:shadow-xs',
          )}
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-bold text-xs flex-shrink-0">
            1
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-dark flex items-center gap-1">
              <span>Complete Profile</span>
              {onNavigateSettings && <ArrowRight size={11} className="opacity-50" />}
            </div>
            <div className="text-[11px] text-charcoal/60 truncate">Clinic & contact details</div>
          </div>
        </div>

        {/* Step 2 */}
        <div
          onClick={onNavigateOrders}
          className={cn(
            'flex items-center gap-2.5 p-2.5 rounded-xl bg-white/70 border border-primary/15',
            'transition-all duration-150',
            onNavigateOrders && 'cursor-pointer hover:bg-white hover:border-primary/40 hover:shadow-xs',
          )}
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-bold text-xs flex-shrink-0">
            2
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-dark flex items-center gap-1">
              <span>Submit First Case</span>
              {onNavigateOrders && <ArrowRight size={11} className="opacity-50" />}
            </div>
            <div className="text-[11px] text-charcoal/60 truncate">Prescription & STL files</div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/70 border border-primary/15">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-bold text-xs flex-shrink-0">
            3
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-dark">Track Production</div>
            <div className="text-[11px] text-charcoal/60 truncate">Live QC & dispatch stages</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DentistWelcomeBanner;
