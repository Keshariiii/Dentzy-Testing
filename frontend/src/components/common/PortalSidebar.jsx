'use client';

import React from 'react';
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
          {headerContent}

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
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
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
