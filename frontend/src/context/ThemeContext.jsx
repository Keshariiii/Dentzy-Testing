'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const themeScript = `(function(){try{var s=localStorage.getItem('dentzy-theme');var d=s==='dark'||((!s||s==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`;

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');

  // Read initial stored theme on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dentzy-theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored);
      }
    } catch (e) {
      // storage unavailable
    }
  }, []);

  // Apply theme to DOM and resolve dark class
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const updateDOM = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
        setResolvedTheme('dark');
      } else {
        document.documentElement.classList.remove('dark');
        setResolvedTheme('light');
      }
    };

    updateDOM();

    const listener = () => {
      if (theme === 'system') updateDOM();
    };

    media.addEventListener?.('change', listener);
    return () => media.removeEventListener?.('change', listener);
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('dentzy-theme', newTheme);
    } catch (e) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
