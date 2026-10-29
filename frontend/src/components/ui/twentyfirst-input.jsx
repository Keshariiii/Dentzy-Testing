'use client';
import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstInput — 21st.dev Floating Label Input
 * Theme-aware, supports light & dark modes with CSS custom properties.
 */
export function TwentyFirstInput({
  label,
  icon: Icon,
  rightIcon: RightIcon,
  error,
  type = 'text',
  className = '',
  inputClassName = '',
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const id = useId();
  const inputId = props.id || id;
  const hasValue = !!props.value || !!props.defaultValue;
  const isFloating = isFocused || hasValue;
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative">
        {/* Left icon */}
        {Icon && (
          <div className={cn(
            'absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 z-10',
            isFocused ? 'text-primary' : error ? 'text-destructive' : 'text-muted-foreground',
          )}>
            <Icon className="w-4 h-4" />
          </div>
        )}

        {/* Input */}
        <input
          id={inputId}
          type={resolvedType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            'w-full bg-input text-foreground border rounded-xl text-sm transition-colors duration-200',
            'outline-none',
            'placeholder:text-transparent',
            Icon ? 'pl-10' : 'pl-4',
            (isPassword || RightIcon) ? 'pr-10' : 'pr-4',
            label ? 'pt-5 pb-2' : 'py-3',
            isFocused
              ? 'border-primary ring-2 ring-primary/20 shadow-sm'
              : error
                ? 'border-destructive ring-2 ring-destructive/20'
                : 'border-border hover:border-ring/50',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/40',
            inputClassName,
          )}
          placeholder={label || ' '}
          {...props}
        />

        {/* Floating label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'absolute pointer-events-none transition-all duration-200 origin-left select-none',
              Icon ? 'left-10' : 'left-4',
              isFloating
                ? 'top-1.5 text-[10px] font-semibold tracking-wide'
                : 'top-1/2 -translate-y-1/2 text-sm',
              isFocused ? 'text-primary' : error ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {label}
          </label>
        )}

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword
              ? <EyeOff className="w-4 h-4" />
              : <Eye className="w-4 h-4" />
            }
          </button>
        )}

        {/* Right icon (non-password) */}
        {RightIcon && !isPassword && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <RightIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${inputId}-error`}
            className="text-xs text-destructive mt-1.5 pl-1 font-medium"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TwentyFirstInput;
