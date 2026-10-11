'use client';
import {
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock5,
  ScanSearch,
  TriangleAlert,
} from "lucide-react";
import React from "react";
import { cn } from "../../lib/utils";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fixedWidth?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; Icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>; bgClass: string; textClass: string; bgHex: string; textHex: string }> = {
  pending: {
    label: 'Pending',
    Icon: TriangleAlert,
    bgClass: 'bg-orange-50',
    textClass: 'text-[#EAA65D]',
    bgHex: '#fff7ed',
    textHex: '#EAA65D',
  },
  failed: {
    label: 'Failed',
    Icon: CircleX,
    bgClass: 'bg-rose-50',
    textClass: 'text-[#D57463]',
    bgHex: '#fff1f2',
    textHex: '#D57463',
  },
  rejected: {
    label: 'Rejected',
    Icon: CircleX,
    bgClass: 'bg-rose-50',
    textClass: 'text-[#D57463]',
    bgHex: '#fff1f2',
    textHex: '#D57463',
  },
  cancelled: {
    label: 'Cancelled',
    Icon: CircleX,
    bgClass: 'bg-rose-50',
    textClass: 'text-[#D57463]',
    bgHex: '#fff1f2',
    textHex: '#D57463',
  },
  success: {
    label: 'Success',
    Icon: CircleCheck,
    bgClass: 'bg-emerald-50',
    textClass: 'text-[#57BC6C]',
    bgHex: '#ecfdf5',
    textHex: '#57BC6C',
  },
  approved: {
    label: 'Approved',
    Icon: CircleCheck,
    bgClass: 'bg-emerald-50',
    textClass: 'text-[#57BC6C]',
    bgHex: '#ecfdf5',
    textHex: '#57BC6C',
  },
  completed: {
    label: 'Completed',
    Icon: CircleCheck,
    bgClass: 'bg-emerald-50',
    textClass: 'text-[#57BC6C]',
    bgHex: '#ecfdf5',
    textHex: '#57BC6C',
  },
  paid: {
    label: 'Paid',
    Icon: CircleCheck,
    bgClass: 'bg-emerald-50',
    textClass: 'text-[#57BC6C]',
    bgHex: '#ecfdf5',
    textHex: '#57BC6C',
  },
  delivered: {
    label: 'Delivered',
    Icon: CircleCheck,
    bgClass: 'bg-emerald-50',
    textClass: 'text-[#57BC6C]',
    bgHex: '#ecfdf5',
    textHex: '#57BC6C',
  },
  active: {
    label: 'Active',
    Icon: CircleCheck,
    bgClass: 'bg-emerald-50',
    textClass: 'text-[#57BC6C]',
    bgHex: '#ecfdf5',
    textHex: '#57BC6C',
  },
  'in progress': {
    label: 'In progress',
    Icon: CircleDashed,
    bgClass: 'bg-sky-100',
    textClass: 'text-[#008AF5]',
    bgHex: '#e0f2fe',
    textHex: '#008AF5',
  },
  'in-progress': {
    label: 'In progress',
    Icon: CircleDashed,
    bgClass: 'bg-sky-100',
    textClass: 'text-[#008AF5]',
    bgHex: '#e0f2fe',
    textHex: '#008AF5',
  },
  production: {
    label: 'In production',
    Icon: CircleDashed,
    bgClass: 'bg-sky-100',
    textClass: 'text-[#008AF5]',
    bgHex: '#e0f2fe',
    textHex: '#008AF5',
  },
  milling: {
    label: 'Milling',
    Icon: CircleDashed,
    bgClass: 'bg-sky-100',
    textClass: 'text-[#008AF5]',
    bgHex: '#e0f2fe',
    textHex: '#008AF5',
  },
  design: {
    label: 'CAD Design',
    Icon: CircleDashed,
    bgClass: 'bg-sky-100',
    textClass: 'text-[#008AF5]',
    bgHex: '#e0f2fe',
    textHex: '#008AF5',
  },
  'in review': {
    label: 'In review',
    Icon: ScanSearch,
    bgClass: 'bg-yellow-50',
    textClass: 'text-[#F0B13D]',
    bgHex: '#fefce8',
    textHex: '#F0B13D',
  },
  'in-review': {
    label: 'In review',
    Icon: ScanSearch,
    bgClass: 'bg-yellow-50',
    textClass: 'text-[#F0B13D]',
    bgHex: '#fefce8',
    textHex: '#F0B13D',
  },
  qc: {
    label: 'QC Check',
    Icon: ScanSearch,
    bgClass: 'bg-yellow-50',
    textClass: 'text-[#F0B13D]',
    bgHex: '#fefce8',
    textHex: '#F0B13D',
  },
  expired: {
    label: 'Expired',
    Icon: Clock5,
    bgClass: 'bg-zinc-100',
    textClass: 'text-[#777777]',
    bgHex: '#f4f4f5',
    textHex: '#777777',
  },
  overdue: {
    label: 'Overdue',
    Icon: Clock5,
    bgClass: 'bg-zinc-100',
    textClass: 'text-[#777777]',
    bgHex: '#f4f4f5',
    textHex: '#777777',
  },
  inactive: {
    label: 'Inactive',
    Icon: Clock5,
    bgClass: 'bg-zinc-100',
    textClass: 'text-[#777777]',
    bgHex: '#f4f4f5',
    textHex: '#777777',
  },
  submitted: {
    label: 'Submitted',
    Icon: Clock5,
    bgClass: 'bg-violet-50',
    textClass: 'text-[#6C3CF0]',
    bgHex: '#f5f3ff',
    textHex: '#6C3CF0',
  },
  submited: {
    label: 'Submitted',
    Icon: Clock5,
    bgClass: 'bg-violet-50',
    textClass: 'text-[#6C3CF0]',
    bgHex: '#f5f3ff',
    textHex: '#6C3CF0',
  },
  new: {
    label: 'New',
    Icon: Clock5,
    bgClass: 'bg-violet-50',
    textClass: 'text-[#6C3CF0]',
    bgHex: '#f5f3ff',
    textHex: '#6C3CF0',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  fixedWidth = false,
  className = '',
  children,
  ...props
}) => {
  const rawKey = (status || children || '').toString().toLowerCase().trim();
  const config = STATUS_CONFIG[rawKey] || {
    label: label || status || (typeof children === 'string' ? children : 'Unknown'),
    Icon: Clock5,
    bgClass: 'bg-zinc-100',
    textClass: 'text-[#777777]',
    bgHex: '#f4f4f5',
    textHex: '#777777',
  };

  const displayText = label || (children ? children : config.label);
  const IconComponent = config.Icon;

  const sizeStyles = {
    sm: 'h-[26px] px-2.5 text-[11px] rounded-lg',
    md: 'h-[32px] px-3.5 text-xs sm:text-[13px] rounded-xl',
    lg: 'h-[35px] px-4 text-sm rounded-xl',
  }[size] || 'h-[32px] px-3.5 text-xs rounded-xl';

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-150',
        fixedWidth ? 'w-40 h-[35px] rounded-xl' : sizeStyles,
        config.bgClass,
        className,
      )}
      style={{
        backgroundColor: config.bgHex,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      {...props}
    >
      <span
        className={cn('inline-flex items-center font-semibold whitespace-nowrap', config.textClass)}
        style={{ color: config.textHex, display: 'inline-flex', alignItems: 'center' }}
      >
        <IconComponent
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5"
          style={{ width: size === 'sm' ? 12 : 15, height: size === 'sm' ? 12 : 15, marginRight: 6, flexShrink: 0 }}
          strokeWidth={3}
        />
        <span>{displayText}</span>
      </span>
    </div>
  );
};

export const StatusDemo = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-40 h-[35px] flex items-center justify-center bg-orange-50 rounded-xl">
          <h1 className="flex items-center text-[#EAA65D] font-semibold">
            <TriangleAlert className="w-4 h-4 mr-2" strokeWidth={3} />
            Pending
          </h1>
        </div>
        <div className="w-40 h-[35px] flex items-center justify-center bg-rose-50 rounded-xl">
          <h1 className="flex items-center text-[#D57463] font-semibold">
            <CircleX className="w-4 h-4 mr-2" strokeWidth={3} />
            Failed
          </h1>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="w-40 h-[35px] flex items-center justify-center bg-emerald-50 rounded-xl">
          <h1 className="flex items-center text-[#57BC6C] font-semibold">
            <CircleCheck className="w-4 h-4 mr-2" strokeWidth={3} />
            Success
          </h1>
        </div>
        <div className="w-40 h-[35px] flex items-center justify-center bg-sky-100 rounded-xl">
          <h1 className="flex items-center text-[#008AF5] font-semibold">
            <CircleDashed className="w-4 h-4 mr-2" strokeWidth={3} />
            In progress
          </h1>
        </div>
        <div className="w-40 h-[35px] flex items-center justify-center bg-yellow-50 rounded-xl">
          <h1 className="flex items-center text-[#F0B13D] font-semibold">
            <ScanSearch className="w-4 h-4 mr-2" strokeWidth={3} />
            In review
          </h1>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-40 h-[35px] flex items-center justify-center bg-zinc-100 rounded-xl">
          <h1 className="flex items-center text-[#777777] font-semibold">
            <Clock5 className="w-4 h-4 mr-2" strokeWidth={3} />
            Expired
          </h1>
        </div>
        <div className="w-40 h-[35px] flex items-center justify-center bg-violet-50 rounded-xl">
          <h1 className="flex items-center text-[#6C3CF0] font-semibold">
            <Clock5 className="w-4 h-4 mr-2" strokeWidth={3} />
            Submited
          </h1>
        </div>
      </div>
    </div>
  );
};

export default StatusBadge;
