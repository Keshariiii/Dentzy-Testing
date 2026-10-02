'use client';
import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  className = '',
  inputClassName = '',
}) {
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
  };

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm',
          'text-gray-900 placeholder:text-gray-400',
          'transition-all duration-150',
          'focus:outline-none focus:border-[#708c80] focus:ring-2 focus:ring-[#708c80]/20',
          inputClassName
        )}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
