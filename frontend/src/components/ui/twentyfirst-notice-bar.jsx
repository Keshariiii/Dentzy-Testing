'use client';
import React, { useState } from 'react';
import { ChevronRight, Headphones } from 'lucide-react';
import { NotificationIcon, CopiedIcon } from './animated-state-icons';
import { cn } from '../../lib/utils';
import { TwentyFirstBadge } from './twentyfirst-badge';
import BaseModal from './BaseModal';

/**
 * TwentyFirstNoticeBar — 21st.dev Announcement / Marquee Primitive
 *
 * Smooth infinite rolling announcements bar with live pulsing badge,
 * hover/touch pause, reduced-motion fallback, and Dentzy design tokens.
 * Clicking the bar opens the full announcements modal to inspect all notices at once.
 *
 * @param {object} props
 * @param {string[]} props.messages         - List of announcement strings
 * @param {string}   [props.label='Notice'] - Badge text
 * @param {boolean}  [props.pulse=true]     - Pulsing dot on badge
 * @param {number}   [props.duration=40]    - Seconds per full scroll cycle
 * @param {boolean}  [props.pauseOnHover=true] - Pause ticker when hovered or touched
 * @param {string}   [props.className]      - Container classes
 */
export function TwentyFirstNoticeBar({
  messages = [],
  label = 'Notice',
  pulse = true,
  duration = 38,
  pauseOnHover = true,
  className,
  ...props
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const cleanMessages = (Array.isArray(messages) ? messages : (typeof messages === 'string' && messages ? [messages] : [])).filter(Boolean);

  if (cleanMessages.length === 0) {
    return null;
  }

  // Double array for seamless infinite marquee loop
  const displayItems = [...cleanMessages, ...cleanMessages];

  const handleCopy = async (text, idx) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
    } catch {
      // Fallback ignore
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="Lab announcements — click to view all notices"
        title="Click to view all notices"
        className={cn(
          'group relative flex items-center h-10 w-full overflow-hidden rounded-[14px]',
          'bg-primary-muted/20 border border-primary/20',
          'px-2.5 transition-all duration-200',
          'cursor-pointer hover:bg-primary-muted/30 hover:border-primary/30',
          'active:scale-[0.995] focus:outline-hidden focus:ring-2 focus:ring-primary/40',
          className,
        )}
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        onTouchStart={() => pauseOnHover && setIsPaused(true)}
        onTouchEnd={() => pauseOnHover && setIsPaused(false)}
        onClick={(e) => {
          setIsModalOpen(true);
          props.onClick?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsModalOpen(true);
          }
          props.onKeyDown?.(e);
        }}
        {...props}
      >
        {/* Notice Badge */}
        <div className="relative z-10 flex-shrink-0 mr-3">
          <TwentyFirstBadge
            variant="approved"
            pulse={pulse}
            className="bg-primary-dark text-white font-bold tracking-wider uppercase text-[10px] px-2.5 py-1 shadow-xs"
          >
            {label}
          </TwentyFirstBadge>
        </div>

        {/* Marquee Viewport */}
        <div className="relative flex-1 overflow-hidden h-full flex items-center">
          {/* Subtle Edge Fades for sleek 21st.dev aesthetic */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-page/80 to-transparent z-[5]" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-page/80 to-transparent z-[5]" />

          {/* Scrolling Track */}
          <div
            className={cn(
              'flex items-center whitespace-nowrap will-change-transform',
              'twentyfirst-marquee-track',
            )}
            style={{
              animationDuration: `${duration}s`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {displayItems.map((msg, idx) => (
              <span
                key={`${idx}-${msg.slice(0, 10)}`}
                className="inline-flex items-center text-xs font-medium text-dark/90 tracking-wide pr-8 select-none"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2.5 opacity-70" />
                {msg}
              </span>
            ))}
          </div>
        </div>

        {/* Action Hint / Pill (Desktop) */}
        <div className="relative z-10 flex-shrink-0 ml-2 hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 text-[11px] font-semibold text-primary-dark shadow-xs border border-primary/15 transition-transform group-hover:translate-x-0.5">
          <span>All notices ({cleanMessages.length})</span>
          <ChevronRight className="w-3 h-3 text-primary" />
        </div>

        {/* Action Hint (Mobile) */}
        <div className="relative z-10 flex-shrink-0 ml-1.5 flex sm:hidden items-center justify-center w-6 h-6 rounded-full bg-white/80 text-primary-dark">
          <ChevronRight className="w-3.5 h-3.5" />
        </div>

        {/* Global CSS for the 21st marquee loop */}
        <style jsx>{`
          .twentyfirst-marquee-track {
            display: flex;
            animation: twentyfirst-marquee linear infinite;
          }
          @keyframes twentyfirst-marquee {
            0% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .twentyfirst-marquee-track {
              animation: none;
              overflow-x: auto;
            }
          }
        `}</style>
      </div>

      {/* 21st.dev Announcements Modal */}
      <BaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Announcements & Notices"
        subtitle="Important updates, clinical advisories, and laboratory schedules from Dentzy."
        badge={
          <TwentyFirstBadge
            variant="approved"
            pulse={true}
            className="bg-primary-dark text-white font-bold text-[10px] px-2 py-0.5"
          >
            {cleanMessages.length} Active
          </TwentyFirstBadge>
        }
        maxWidth="max-w-xl"
        id="notices-modal"
      >
        <div className="space-y-3 py-1">
          {cleanMessages.map((msg, idx) => (
            <div
              key={idx}
              className="relative flex items-start gap-3.5 p-4 rounded-xl bg-white border border-emerald-900/10 shadow-xs hover:shadow-sm transition-all"
            >
              {/* Notice Bell Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-muted/20 flex items-center justify-center text-primary-dark mt-0.5">
                <NotificationIcon size={18} color="#1e5038" duration={3200} />
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold tracking-wider text-primary-dark/75 uppercase">
                    Notice #{idx + 1}
                  </span>
                </div>
                <p className="text-sm font-normal text-slate-800 leading-relaxed break-words">
                  {msg}
                </p>
              </div>

              {/* Quick Copy Action */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(msg, idx);
                }}
                className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Copy notice text"
                aria-label="Copy notice text"
              >
                <CopiedIcon active={copiedIndex === idx} size={18} color={copiedIndex === idx ? '#059669' : '#94a3b8'} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer info & close */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Headphones className="w-4 h-4 text-[#1e5038] flex-shrink-0" />
            <span>
              For urgent inquiries, contact Lab Support at{' '}
              <strong className="text-slate-700 font-semibold">+91 9503668112</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#1e5038] hover:bg-[#174230] text-white font-medium text-xs transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </BaseModal>
    </>
  );
}

export default TwentyFirstNoticeBar;
