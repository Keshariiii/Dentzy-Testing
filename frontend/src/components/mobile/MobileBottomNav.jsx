'use client';
/**
 * MobileBottomNav — Floating bottom dock with real Apple-Tahoe liquid glass.
 * The nav surface is a LiquidGlass div; active tab icon uses LiquidGlassButton
 * so it bends content and reacts with spring physics on tap.
 */
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlass } from '../ui/apple-tahoe-liquid-glass-button';
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
    if (item.key === 'home') {
      if (pathname === '/') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      router.push('/');
      return;
    }
    if (item.key === 'services') {
      const scrollServices = () => {
        const el = document.getElementById('services');
        if (el) {
          const headerH = document.querySelector('.m-header')?.offsetHeight ?? 64;
          window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headerH, behavior: 'smooth' });
        }
      };
      if (pathname === '/') { scrollServices(); return; }
      router.push('/');
      setTimeout(scrollServices, 300);
      return;
    }
    if (item.key === 'profile') { router.push(user ? item.authPath : item.path); return; }
    if (item.requiresAuth && !user) { router.push('/login'); return; }
    router.push(item.path);
  };

  const isActive = (item) => {
    if (item.key === 'home') return pathname === '/';
    if (item.key === 'dashboard') return pathname === '/dashboard';
    if (item.key === 'profile') return pathname === '/login' || (user && pathname === '/dashboard');
    return false;
  };

  const hideOn = ['/login', '/register', '/forgot-password', '/admin/login'];
  if (hideOn.includes(pathname)) return null;

  return (
    // LiquidGlass wraps the entire dock — real refraction bends content behind it.
    // interactive=false on the dock itself; individual buttons handle their own press.
    <LiquidGlass
      material="clear"
      appearance="light"
      refraction={22}
      bezel={22}
      blur={1.5}
      saturation={1.5}
      brightness={1.05}
      mode="auto"
      interactive={false}
      className="m-bottom-nav-glass"
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        right: 12,
        zIndex: 200,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-around',
        height: 60,
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        borderRadius: 22,
        // The LiquidGlass component provides its own shadow via --lg-shadow;
        // we override with the Dentzy-toned version.
        '--lg-shadow': [
          '0 4px 16px rgba(30, 80, 56, 0.07)',
          'inset 0 1px 0 rgba(255, 255, 255, 0.65)',
          'inset 1px 0 0.5px rgba(112, 140, 128, 0.4)',
          'inset -1px 0 0.5px rgba(112, 140, 128, 0.4)',
        ].join(', '),
      }}
      aria-label="Main navigation"
      role="navigation"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <button
            key={item.key}
            className={`m-bnav-item${active ? ' m-bnav-item--active' : ''}`}
            onClick={() => handleTap(item)}
            aria-label={item.label}
          >
            <span className="m-bnav-icon">{item.icon}</span>
            <span className="m-bnav-label">{item.label}</span>
          </button>
        );
      })}
    </LiquidGlass>
  );
};

export default MobileBottomNav;
