'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ChevronLeft, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstSidebar — 21st.dev Collapsible Sidebar
 * Theme-aware, supports light & dark modes with CSS custom properties.
 */
export function TwentyFirstSidebar({
  items = [],
  activeKey,
  onSelect,
  isCollapsed,
  onToggleCollapse,
  brandLogo,
  brandName = 'Dentzy',
  userProfile,
  onLogout,
  className = '',
}) {
  const [hoveredKey, setHoveredKey] = useState(null);

  return (
    <motion.aside
      className={cn(
        'h-screen flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
        'relative z-20 select-none flex-shrink-0 transition-colors duration-200',
        className,
      )}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header: Toggle + Brand */}
      <div className={cn(
        'flex items-center h-16 px-3 border-b border-sidebar-border flex-shrink-0',
        isCollapsed ? 'justify-center' : 'gap-3',
      )}>
        <button
          onClick={onToggleCollapse}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl',
            'hover:bg-sidebar-accent transition-colors cursor-pointer',
            'text-sidebar-foreground',
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isCollapsed ? (
              <motion.div key="menu" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Menu className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div key="chevron" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <ChevronLeft className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {!isCollapsed && (
          <motion.div
            className="flex items-center gap-2 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {brandLogo || (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                D
              </div>
            )}
            <span className="font-bold text-sidebar-foreground text-base tracking-tight whitespace-nowrap">
              {brandName}
            </span>
          </motion.div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto overflow-x-hidden">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = item.key === activeKey;
            const isHovered = item.key === hoveredKey;

            return (
              <li key={item.key} className="relative">
                <button
                  onClick={() => onSelect?.(item.key)}
                  onMouseEnter={() => setHoveredKey(item.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl transition-colors duration-150',
                    'cursor-pointer relative z-10',
                    isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5',
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                  )}
                  title={isCollapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  {/* Active pill background */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <span className="relative z-10 flex-shrink-0">
                    {item.icon}
                  </span>

                  {/* Label */}
                  {!isCollapsed && (
                    <motion.span
                      className="relative z-10 text-sm whitespace-nowrap overflow-hidden"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {/* Count badge */}
                  {item.count != null && !isCollapsed && (
                    <span className="relative z-10 ml-auto text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {item.count}
                    </span>
                  )}
                </button>

                {/* Collapsed tooltip */}
                <AnimatePresence>
                  {isCollapsed && isHovered && (
                    <motion.div
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 px-2.5 py-1.5 rounded-lg bg-popover text-popover-foreground border border-border text-xs font-medium whitespace-nowrap shadow-lg"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.1 }}
                    >
                      {item.label}
                      {item.count != null && (
                        <span className="ml-1.5 text-[10px] opacity-70">({item.count})</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: User Profile + Logout */}
      <div className={cn(
        'border-t border-sidebar-border flex-shrink-0',
        isCollapsed ? 'p-2' : 'p-3',
      )}>
        {userProfile && !isCollapsed && (
          <div className="flex items-center gap-2.5 mb-2 px-1">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
              {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{userProfile.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{userProfile.role || 'Admin'}</p>
            </div>
          </div>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-xl transition-colors duration-150',
              'text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer',
              isCollapsed ? 'justify-center py-3 px-0' : 'px-3 py-2.5',
            )}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm">Logout</span>}
          </button>
        )}
      </div>
    </motion.aside>
  );
}

export default TwentyFirstSidebar;
