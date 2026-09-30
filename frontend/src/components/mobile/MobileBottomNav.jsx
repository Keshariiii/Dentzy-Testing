'use client';
/**
 * MobileBottomNav — Fixed bottom navigation bar (iOS/Android app-style).
 *
 * Provides primary navigation: Home, Services, Dashboard, Profile.
 */
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Home, Box, LayoutGrid, User } from 'lucide-react';
import './MobileBottomNav.css';

const NAV_ITEMS = [
  {
    key: 'home',
    label: 'Home',
    path: '/',
    icon: <Home size={22} strokeWidth={1.8} />,
  },
  {
    key: 'services',
    label: 'Services',
    path: '/#services',
    icon: <Box size={22} strokeWidth={1.8} />,
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    requiresAuth: true,
    icon: <LayoutGrid size={22} strokeWidth={1.8} />,
  },
  {
    key: 'profile',
    label: 'Profile',
    path: '/login',
    authPath: '/dashboard',
    icon: <User size={22} strokeWidth={1.8} />,
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
