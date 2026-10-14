'use client';
import React from 'react';
import { cn } from '../../lib/utils';

/**
 * VengeanceCard — Clean clinical container card
 */
export function VengeanceCard({
  children,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[#E2ECE6]',
        'bg-white transition-all duration-150',
        'hover:border-[#9BC4B0] hover:shadow-[0_4px_16px_rgba(22,62,43,0.06)]',
        className,
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default VengeanceCard;
