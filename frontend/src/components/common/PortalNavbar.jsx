'use client';

import React from 'react';
import Link from 'next/link';
import DentzySearchBar from './DentzySearchBar';
import { Ico } from './DashboardIcons';
import './PortalNav.css';

const DEFAULT_LOGO = '/dentzy-logo-v2.png';

/**
 * PortalNavbar — Canonical unified top navigation bar across all Dentzy portals:
 * Dentist, Admin (CEO/CTO), and Staff designations (Receptionist, Delivery, Production).
 */
export default function PortalNavbar({
  onToggleSidebar,
  sidebarOpen = false,
  logoSrc = DEFAULT_LOGO,
  logoAlt = 'Dentzy',
  onLogoClick,
  logoHref,
  portalTitle,
  portalBadge,
  search,
  centerContent,
  badges,
  user,
  actions,
  onLogout,
  logoutText = 'Logout',
  className = '',
}) {
  const renderLogo = () => {
    const img = (
      <img
        src={logoSrc}
        alt={logoAlt}
        className="dz-portal-logo ud-logo-img ad-logo-img sd-logo"
      />
    );

    if (onLogoClick) {
      return (
        <button
          type="button"
          onClick={onLogoClick}
          aria-label={logoAlt}
          className="dz-portal-logo-btn ud-header-logo ad-header-logo sd-header-logo-btn"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          {img}
        </button>
      );
    }

    if (logoHref) {
      return (
        <Link
          href={logoHref}
          className="dz-portal-logo-btn ud-header-logo ad-header-logo sd-header-logo-btn"
          aria-label={logoAlt}
        >
          {img}
        </Link>
      );
    }

    return (
      <div className="dz-portal-logo-btn ud-header-logo ad-header-logo sd-header-logo-btn">
        {img}
      </div>
    );
  };

  return (
    <header className={`dz-portal-navbar ud-header ad-top-header sd-header ${className}`}>
      {/* ── Left Area: Hamburger + Logo + Optional Portal Title ───────── */}
      <div className="dz-portal-navbar-left sd-header-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="dz-portal-hamburger ud-hamburger ad-hamburger sd-hamburger"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <span />
            <span />
            <span />
          </button>
        )}

        {renderLogo()}

        {(portalTitle || portalBadge) && (
          <div className="dz-portal-title-wrap">
            {portalTitle && (
              <span className="dz-portal-title sd-header-title">{portalTitle}</span>
            )}
            {portalBadge && (
              <span className="dz-portal-badge">{portalBadge}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Center Area: Search Bar or Custom Tab Switchers ──────────── */}
      <div className="dz-portal-navbar-center">
        {centerContent}

        {!centerContent && search && (
          React.isValidElement(search) ? (
            search
          ) : (
            <div
              className="ud-header-search ad-header-search"
              style={{
                maxWidth: search.width || '320px',
                width: '100%',
                border: 'none',
                background: 'transparent',
                padding: 0,
              }}
            >
              <DentzySearchBar
                placeholder={search.placeholder || 'Search...'}
                value={search.value}
                onChange={search.onChange}
                onClear={search.onClear}
                onKeyDown={search.onKeyDown}
                style={{ width: '100%' }}
              />
            </div>
          )
        )}
      </div>

      {/* ── Right Area: Badges + User Profile + Actions + Logout ─────── */}
      <div className="dz-portal-navbar-right sd-header-right">
        {badges}

        {user && (
          <button
            type="button"
            className="dz-portal-user ud-header-user ad-header-user sd-header-user"
            onClick={user.onProfileClick}
            title={user.title || user.name || 'Profile'}
            aria-label={user.title || user.name || 'Profile'}
            style={{
              background: 'none',
              border: 'none',
              cursor: user.onProfileClick ? 'pointer' : 'default',
            }}
          >
            <div className="dz-portal-user-details ud-user-details ad-header-user-details sd-header-user-details">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="dz-portal-user-name ud-user-name ad-header-admin-name sd-header-name">
                  {user.name}
                </span>
                {user.designationBadge && (
                  <span className="dz-portal-designation-badge">
                    {user.designationBadge}
                  </span>
                )}
              </div>
              {user.role && (
                <span className="dz-portal-user-role ud-user-role ad-header-admin-role sd-header-role">
                  {user.isLive && (
                    <span className="dz-portal-live-dot ad-live-dot" />
                  )}
                  {user.role}
                </span>
              )}
            </div>
            <div className="dz-portal-avatar ud-user-avatar ad-header-avatar sd-avatar">
              {user.avatar || (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
            </div>
          </button>
        )}

        {actions}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="dz-portal-header-logout-btn sd-logout-btn"
            title="Log Out"
            aria-label="Log Out"
          >
            {Ico.logout(15)}
            <span className="dz-portal-logout-text sd-logout-text">{logoutText}</span>
          </button>
        )}
      </div>
    </header>
  );
}

export { PortalNavbar };
