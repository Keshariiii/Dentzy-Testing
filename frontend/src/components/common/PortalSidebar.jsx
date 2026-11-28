'use client';

import React from 'react';
import { Ico } from './DashboardIcons';
import './PortalNav.css';

/**
 * PortalSidebar — Canonical unified sidebar navigation drawer across all Dentzy portals:
 * Dentist, Admin (CEO/CTO), and Staff designations.
 */
export default function PortalSidebar({
  isOpen = false,
  onClose,
  items = [],
  activeKey,
  onSelect,
  user,
  headerContent,
  footerContent,
  onLogout,
  logoutText = 'Logout',
  logoutId = 'portal-logout-btn',
  className = '',
}) {
  return (
    <>
      {/* ── Overlay Backdrop ────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="dz-portal-sidebar-overlay ud-sidebar-overlay ad-sidebar-overlay sd-sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar Aside ───────────────────────────────────────────────── */}
      <aside
        className={`dz-portal-sidebar ud-sidebar ad-sidebar sd-sidebar ${
          isOpen ? 'dz-portal-sidebar--open ud-sidebar--open ad-sidebar--open sd-sidebar--open' : ''
        } ${className}`}
        aria-label="Sidebar navigation"
      >
        <div className="dz-portal-sidebar-top ad-sidebar-top sd-sidebar-top">
          {headerContent ?? (user && (
            <button
              type="button"
              className="dz-portal-sidebar-user"
              onClick={() => {
                user.onProfileClick?.();
                onClose?.();
              }}
              title={user.title || user.name || 'Profile'}
              aria-label={user.title || user.name || 'Profile'}
              style={{ cursor: user.onProfileClick ? 'pointer' : 'default' }}
            >
              <div className="dz-portal-sidebar-avatar">
                {user.avatar || (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
              </div>
              <div className="dz-portal-sidebar-user-info">
                <div className="dz-portal-sidebar-user-name-row">
                  <span className="dz-portal-sidebar-user-name">{user.name}</span>
                  {user.designationBadge && (
                    <span className="dz-portal-sidebar-badge">{user.designationBadge}</span>
                  )}
                </div>
                {user.role && (
                  <span className="dz-portal-sidebar-user-role">
                    {user.isLive && <span className="dz-portal-live-dot ad-live-dot" />}
                    {user.role}
                  </span>
                )}
              </div>
            </button>
          ))}

          <nav className="dz-portal-nav ud-nav ad-nav sd-nav">
            {items.map((item) => {
              const isActive = item.key === activeKey;
              const itemId = item.id || `nav-${item.key}`;

              const handleClick = () => {
                if (item.disabled) return;
                if (item.onClick) {
                  item.onClick(item.key);
                } else if (onSelect) {
                  onSelect(item.key);
                }
                onClose?.();
              };

              return (
                <button
                  key={item.key}
                  id={itemId}
                  type="button"
                  disabled={item.disabled}
                  className={`dz-portal-nav-item ud-nav-item ad-nav-item sd-nav-item ${
                    isActive ? 'active ad-tab-active' : ''
                  }`}
                  onClick={handleClick}
                  aria-label={item.label}
                >
                  {item.icon && (
                    <span className="dz-portal-nav-icon ud-nav-icon ad-nav-icon sd-nav-icon">
                      {typeof item.icon === 'function' ? item.icon(16, isActive) : item.icon}
                    </span>
                  )}
                  <span className="dz-portal-nav-label sd-nav-label">{item.label}</span>

                  {item.badge != null && (
                    <span className="dz-portal-nav-badge sd-nav-badge">
                      {item.badge}
                    </span>
                  )}

                  {item.count != null && (
                    <span className="dz-portal-nav-badge sd-nav-badge">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Sidebar Bottom / Footer & Logout ─────────────────────────── */}
        <div className="dz-portal-sidebar-bottom">
          {footerContent}

          {onLogout && (
            <button
              id={logoutId}
              type="button"
              className="dz-portal-logout ud-logout ad-logout"
              onClick={onLogout}
              aria-label={logoutText}
            >
              <span className="dz-portal-nav-icon">
                {Ico.logout(15)}
              </span>
              <span>{logoutText}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export { PortalSidebar };
