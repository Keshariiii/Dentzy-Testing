'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * SearchBar — 21st.dev Expanding Search
 *
 * Animated search with:
 * - Smooth width expansion on focus
 * - Dentzy Sage border glow
 * - Animated clear X icon
 * - Optional ⌘K keyboard shortcut badge
 * - Responsive mobile shrinkage
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  className = '',
  inputClassName = '',
  showShortcut = true,
  expandedWidth,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    if (typeof onChange === 'function') {
      onChange(e.target.value);
    }
  };

  const handleClear = () => {
    if (typeof onClear === 'function') {
      onClear();
    } else if (typeof onChange === 'function') {
      onChange('');
    }
    inputRef.current?.focus();
  };

  // ⌘K / Ctrl+K global shortcut
  const handleGlobalKey = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (showShortcut) {
      window.addEventListener('keydown', handleGlobalKey);
      return () => window.removeEventListener('keydown', handleGlobalKey);
    }
  }, [showShortcut, handleGlobalKey]);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  return (
    <motion.div
      className={cn('relative flex items-center', className)}
      animate={{
        width: isFocused ? (expandedWidth || '100%') : '100%',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Search icon */}
      <motion.div
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10"
        animate={{ scale: isFocused ? 1.1 : 1, color: isFocused ? 'var(--primary)' : 'var(--muted-foreground)' }}
        transition={{ duration: 0.15 }}
      >
        <Search className="w-4 h-4" />
      </motion.div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-20 py-2.5 bg-input border border-border rounded-xl text-sm',
          'text-foreground placeholder:text-muted-foreground',
          'transition-all duration-200',
          'outline-none',
          isFocused
            ? 'border-primary ring-2 ring-primary/20 shadow-sm'
            : 'border-border hover:border-muted-foreground/30',
          inputClassName,
        )}
      />

      {/* Right side: clear + shortcut badge */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {/* Clear button */}
        <AnimatePresence>
          {value && (
            <motion.button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.12 }}
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Keyboard shortcut badge */}
        {showShortcut && !value && !isFocused && (
          <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted border border-border text-[10px] font-medium text-muted-foreground select-none">
            {isMac ? (
              <>
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </>
            ) : (
              <span>Ctrl K</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SearchBar;
