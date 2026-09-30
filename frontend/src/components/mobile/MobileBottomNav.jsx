'use client';
/**
 * MobileBottomNav — Fixed bottom navigation bar (iOS/Android app-style).
 *
 * Provides primary navigation: Home, Services, Dashboard, Profile.
 */
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './MobileBottomNav.css';

const NAV_ITEMS = [
  {
    key: 'home',
    label: 'Home',
    path: '/',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    key: 'services',
    label: 'Services',
    path: '/#services',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2h6l3 7H6L9 2z" />
        <rect x="5" y="9" width="14" height="13" rx="2" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    requiresAuth: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: 'profile',
    label: 'Profile',
    path: '/login',
    authPath: '/dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const MobileBottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleTap = (item) => {
    if (item.key === 'services') {
      if (pathname === '/') {
        const el = document.getElementById('services');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      router.push('/');
      setTimeout(() => {
        const el = document.getElementById('services');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return;
    }

    if (item.key === 'profile') {
      router.push(user ? item.authPath : item.path);
      return;
    }

    if (item.requiresAuth && !user) {
      router.push('/login');
      return;
    }

    router.push(item.path);
  };

  const isActive = (item) => {
    if (item.key === 'home') return pathname === '/';
    if (item.key === 'dashboard') return pathname === '/dashboard';
    if (item.key === 'profile') return pathname === '/login' || (user && pathname === '/dashboard');
    return false;
  };

  // Hide bottom nav on auth pages
  const hideOn = ['/login', '/register', '/forgot-password', '/admin/login'];
  if (hideOn.includes(pathname)) return null;

  return (
    <nav className="m-bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          className={`m-bnav-item ${isActive(item) ? 'm-bnav-item--active' : ''}`}
          onClick={() => handleTap(item)}
          aria-label={item.label}
        >
          <span className="m-bnav-icon">{item.icon}</span>
          <span className="m-bnav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
