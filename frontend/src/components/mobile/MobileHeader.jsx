'use client';
/**
 * MobileHeader — Sleek app-style top bar for mobile views.
 *
 * Shows Dentzy logo, screen title, and user avatar/initials badge.
 */
import { useRouter } from 'next/navigation';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, LogIn } from 'lucide-react';
const dentzyLogo = '/dentzy-logo-v2.png';
import './MobileHeader.css';

const MobileHeader = ({ title = null, showBack = false, transparent = false, showLogin = true, onAvatarClick = null, onLogoClick = null, children = null, rightElement = null }) => {
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
            <ChevronLeft size={22} strokeWidth={2} />
          </button>
        ) : onLogoClick ? (
          <button
            type="button"
            onClick={onLogoClick}
            aria-label="Settings"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <img src={dentzyLogo} alt="Dentzy" className="m-header__logo" />
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
            <LogIn size={22} strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </header>
  );
};

export default MobileHeader;
