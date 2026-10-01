'use client';
import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { TwentyFirstBadge } from './twentyfirst-badge';

/**
 * TwentyFirstNoticeBar — 21st.dev Announcement / Marquee Primitive
 *
 * Smooth infinite rolling announcements bar with live pulsing badge,
 * hover/touch pause, reduced-motion fallback, and Dentzy design tokens.
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

  const cleanMessages = (messages || []).filter(Boolean);

  if (cleanMessages.length === 0) {
    return null;
  }

  // Double array for seamless infinite marquee loop
  const displayItems = [...cleanMessages, ...cleanMessages];

  return (
    <div
      role="region"
      aria-label="Lab announcements"
      className={cn(
        'group relative flex items-center h-10 w-full overflow-hidden rounded-[14px]',
        'bg-primary-muted/20 border border-primary/20',
        'px-2.5 transition-colors duration-200',
        className,
      )}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      onTouchStart={() => pauseOnHover && setIsPaused(true)}
      onTouchEnd={() => pauseOnHover && setIsPaused(false)}
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
  );
}

export default TwentyFirstNoticeBar;
