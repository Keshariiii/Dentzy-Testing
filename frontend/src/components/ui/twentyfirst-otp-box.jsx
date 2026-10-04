'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstOtpBox — 21st.dev
 *
 * Animated 6-digit OTP input with:
 * - Auto-focus advance on keystroke
 * - Backspace navigation
 * - Paste support (full 6-digit paste)
 * - Focus ring expansion with spring scale
 * - Shake animation on error
 * - Caret blink animation
 */
export function TwentyFirstOtpBox({
  length = 6,
  value = '',
  onChange,
  onComplete,
  hasError = false,
  disabled = false,
  className = '',
  autoFocus = true,
}) {
  const inputRefs = useRef([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const focusInput = useCallback((index) => {
    if (index >= 0 && index < length && inputRefs.current[index]) {
      inputRefs.current[index].focus();
    }
  }, [length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      // Small delay to avoid SSR issues
      const t = setTimeout(() => inputRefs.current[0]?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const updateValue = useCallback((newDigits) => {
    const newVal = newDigits.join('');
    onChange?.(newVal);
    if (newVal.length === length && newDigits.every(d => d !== '')) {
      onComplete?.(newVal);
    }
  }, [onChange, onComplete, length]);

  const handleChange = useCallback((e, index) => {
    const char = e.target.value.slice(-1);
    if (!/^\d$/.test(char) && char !== '') return;

    const newDigits = [...digits];
    newDigits[index] = char;
    updateValue(newDigits);

    if (char && index < length - 1) {
      focusInput(index + 1);
    }
  }, [digits, length, focusInput, updateValue]);

  const handleKeyDown = useCallback((e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];
      if (newDigits[index]) {
        newDigits[index] = '';
        updateValue(newDigits);
      } else if (index > 0) {
        newDigits[index - 1] = '';
        updateValue(newDigits);
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  }, [digits, length, focusInput, updateValue]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    const newDigits = Array(length).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    updateValue(newDigits);
    focusInput(Math.min(pasted.length, length - 1));
  }, [length, focusInput, updateValue]);

  return (
    <motion.div
      className={cn('flex items-center gap-2 sm:gap-3', className)}
      animate={hasError ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
      transition={hasError ? { duration: 0.4, ease: 'easeInOut' } : {}}
    >
      {Array.from({ length }).map((_, i) => {
        const isFocused = focusedIndex === i;
        const hasDigit = !!digits[i];

        return (
          <motion.div
            key={i}
            className="relative"
            animate={{
              scale: isFocused ? 1.08 : 1,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <input
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={digits[i]}
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={handlePaste}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(-1)}
              disabled={disabled}
              autoComplete="one-time-code"
              aria-label={`Digit ${i + 1} of ${length}`}
              className={cn(
                'w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl',
                'border-2 bg-white outline-none transition-all duration-200',
                'text-[#1e2824] placeholder:text-gray-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isFocused
                  ? 'border-[#1e5038] ring-2 ring-[#1e5038]/20 shadow-md'
                  : hasError
                    ? 'border-red-400 ring-2 ring-red-200'
                    : hasDigit
                      ? 'border-[#708c80]/60'
                      : 'border-gray-200 hover:border-gray-300',
              )}
              style={{ caretColor: '#1e5038' }}
            />
            {/* Caret blink when focused and empty */}
            {isFocused && !hasDigit && (
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-6 bg-[#1e5038] rounded-full"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'steps(2)' }}
              />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default TwentyFirstOtpBox;
