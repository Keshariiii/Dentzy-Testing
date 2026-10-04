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
        animate={{ scale: isFocused ? 1.1 : 1, color: isFocused ? '#1e5038' : '#9ca3af' }}
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
          'w-full pl-10 pr-20 py-2.5 bg-white border rounded-xl text-sm',
          'text-gray-900 placeholder:text-gray-400',
          'transition-all duration-200',
          'outline-none',
          isFocused
            ? 'border-[#708c80] ring-2 ring-[#708c80]/20 shadow-sm'
            : 'border-gray-200 hover:border-gray-300',
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
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
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
          <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-medium text-gray-400 select-none">
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
