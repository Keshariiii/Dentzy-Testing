'use client';
/**
 * MobileHeader — Sleek app-style top bar for mobile views.
 *
 * Shows Dentzy logo, screen title, and user avatar/initials badge.
 */
import { useRouter } from 'next/navigation';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
const dentzyLogo = '/dentzy-logo-v3.jpg';
import './MobileHeader.css';

const MobileHeader = ({ title = null, showBack = false, transparent = false, showLogin = true, onAvatarClick = null, children = null, rightElement = null }) => {
  const { user } = useAuth();
  const router = useRouter();
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const handleAvatarClick = () => {
    if (onAvatarClick) {
      onAvatarClick();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <header className={`m-header ${transparent ? 'm-header--transparent' : ''}`}>
      <div className="m-header__left">
        {showBack ? (
          <button className="m-header__back" onClick={() => router.push(-1)} aria-label="Go back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        ) : (
          <img src={dentzyLogo} alt="Dentzy" className="m-header__logo" />
        )}
      </div>

      {children ? (
        <div className="m-header__center">{children}</div>
      ) : title ? (
        <span className="m-header__title">{title}</span>
      ) : null}

      <div className="m-header__right">
        {rightElement ? (
          rightElement
        ) : user ? (
          <button className="m-header__avatar" onClick={handleAvatarClick} aria-label="Profile">
            {initials}
          </button>
        ) : showLogin ? (
          <button className="m-header__login-btn" onClick={() => router.push('/login')} aria-label="Login">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </button>
        ) : null}
      </div>
    </header>
  );
};

export default MobileHeader;
