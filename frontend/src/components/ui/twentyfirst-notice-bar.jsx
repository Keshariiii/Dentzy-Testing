'use client';
import React, { useState, useEffect } from 'react';
import { Bell, ChevronRight, Copy, Check, Headphones } from 'lucide-react';
import { cn } from '../../lib/utils';
import BaseModal from './BaseModal';

export function TwentyFirstNoticeBar({
  messages = [],
  label = 'Advisory',
  className,
  ...props
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const cleanMessages = (messages || []).filter(Boolean);

  useEffect(() => {
    if (cleanMessages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cleanMessages.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [cleanMessages.length]);

  if (cleanMessages.length === 0) return null;

  const activeMessage = cleanMessages[currentIndex % cleanMessages.length];

  const handleCopy = async (text, idx) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
    } catch {}
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="Lab announcements — click to view all notices"
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
        className={cn(
          'group flex items-center justify-between gap-3 h-10 w-full rounded-lg',
          'bg-[#F0F5F2] border border-[#D5E2DC] px-3 transition-colors duration-150',
          'cursor-pointer hover:bg-[#E6EFEA] hover:border-[#B8CEC3]',
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#163E2B] text-white text-[10px] font-semibold uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
            {label}
          </span>
          <span className="text-xs font-medium text-[#14241D] truncate">
            {activeMessage}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {cleanMessages.length > 1 && (
            <span className="text-[11px] font-mono text-[#5A6E64] tabular-nums">
              {(currentIndex % cleanMessages.length) + 1}/{cleanMessages.length}
            </span>
          )}
          <span className="hidden sm:inline-flex items-center gap-0.5 text-xs font-semibold text-[#163E2B] group-hover:underline">
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      <BaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Clinical Advisories & Lab Schedules"
        subtitle="Official turnaround schedules and laboratory updates from Dentzy."
        maxWidth="max-w-xl"
        id="notices-modal"
      >
        <div className="space-y-2.5 py-1">
          {cleanMessages.map((msg, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-lg bg-[#F8FAF9] border border-[#E2ECE6]"
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-md bg-[#E8F2EC] flex items-center justify-center text-[#163E2B] mt-0.5">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#5A6E64] uppercase tracking-wider mb-0.5">
                  Advisory #{idx + 1}
                </p>
                <p className="text-sm text-[#111C17] leading-relaxed break-words m-0">
                  {msg}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(msg, idx);
                }}
                className="flex-shrink-0 p-1.5 rounded-md text-[#64748B] hover:text-[#111C17] hover:bg-[#E2ECE6] transition-colors"
                title="Copy notice text"
              >
                {copiedIndex === idx ? (
                  <Check className="w-4 h-4 text-[#067647]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-[#E2ECE6] flex items-center justify-between text-xs text-[#5A6E64]">
          <span className="flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-[#163E2B]" />
            Lab Support: <strong className="text-[#111C17]">+91 95036 68112</strong>
          </span>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 rounded-md bg-[#163E2B] hover:bg-[#0F2C1E] text-white font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </BaseModal>
    </>
  );
}

export default TwentyFirstNoticeBar;
