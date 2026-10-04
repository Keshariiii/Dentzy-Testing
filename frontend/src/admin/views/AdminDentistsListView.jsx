'use client';
import React from 'react';
import { Icons as Ico } from '../../components/common/DashboardIcons';
import EmptyState from '../../components/common/EmptyState';
import { TwentyFirstBadge } from '../../components/ui/twentyfirst-badge';
import { TwentyFirstSegmentedTabs } from '../../components/ui/twentyfirst-segmented-tabs';

const DENTIST_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminDentistsListView({
  users,
  filteredUsers,
  loadingUsers,
  stats,
  activeTab,
  setActiveTab,
  sortOrder,
  setSortOrder,
  search,
  setSearch,
  onSelectUser,
  onApprove,
  onReject,
  onDelete,
  visiblePw,
  setVisiblePw,
  isMobile = false,
  onBack,
}) {
  return (
    <div className="admin-subview-root">
      {/* Mobile Back Header */}
      {isMobile && onBack && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px 4px' }}>
          <button
            onClick={onBack}
            aria-label="Back"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--dz-color-primary-dark)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--dz-color-charcoal)' }}>Back</span>
        </div>
      )}

      {/* Section Heading */}
      <div style={{ padding: isMobile ? '0 16px' : '0 0 12px 0', marginBottom: '8px' }}>
        <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 800, color: 'var(--dz-color-charcoal)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          Registered Dentists
          <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--dz-color-primary-muted)', color: 'var(--dz-color-primary-dark)', padding: '2px 8px', borderRadius: '12px' }}>
            {stats.total || users.length}
          </span>
        </h2>
      </div>

      {/* Search Bar */}
      <div className={isMobile ? 'ma-search-wrap' : 'ad-search-wrap'} style={{ marginBottom: '12px' }}>
        <div className={isMobile ? 'ma-search-bar' : 'ad-search-bar'}>
          {Ico.search(14)}
          <input
            type="text"
            className={isMobile ? 'ma-search-input' : 'ad-search-input'}
            placeholder="Search dentists by name, clinic, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className={isMobile ? 'ma-search-clear' : 'ad-search-clear'}
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              {Ico.x(12)}
            </button>
          )}
        </div>
      </div>

      {/* Controls: Segmented Tabs & Sort */}
      <div className={isMobile ? 'ma-tabs-wrap' : 'ad-controls'} style={{ padding: isMobile ? '0 16px' : '0', marginBottom: '16px' }}>
        {isMobile ? (
          <TwentyFirstSegmentedTabs
            tabs={DENTIST_TABS.map((tab) => ({
              key: tab.key,
              label: tab.label,
              count: tab.key !== 'all' ? stats[tab.key] || 0 : undefined,
            }))}
            activeKey={activeTab}
            onTabChange={setActiveTab}
            layoutId="dentist-filter-pill"
          />
        ) : (
          <div className="ad-tabs">
            {DENTIST_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`ad-tab ${activeTab === tab.key ? 'ad-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.key !== 'all' && (
                  <span className="ad-tab-count">{stats[tab.key] || 0}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className={isMobile ? 'ma-sort-wrap' : 'ad-controls-right'}>
          <div className="ad-sort" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--dz-color-text-muted)' }}>Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={isMobile ? 'ma-sort-select' : 'ad-sort-select'}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className={isMobile ? 'ma-main' : 'ad-content'}>
        {loadingUsers ? (
          <div className={isMobile ? 'ma-loading' : 'ad-loading'}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={isMobile ? 'ma-skeleton-card' : 'ad-skeleton-card'} />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            variant="dentists"
            message={`No ${activeTab === 'all' ? '' : activeTab + ' '}dentists found`}
            subtext="New dentists will appear here once they register and await approval."
          />
        ) : (
          <div className={isMobile ? 'ma-user-list' : 'ad-user-list'}>
            {filteredUsers.map((user) => {
              const uId = user._id || user.id;
              return (
                <div
                  key={uId}
                  className={isMobile ? `ma-user-card ma-uc--${user.status}` : `ad-user-card ${user.status}`}
                  onClick={() => onSelectUser(uId)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={isMobile ? 'ma-uc-top' : 'ad-user-row'}>
                    <div className={isMobile ? 'ma-uc-avatar' : 'ad-avatar'}>
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className={isMobile ? 'ma-uc-info' : 'ad-user-info'}>
                      <div className={isMobile ? 'ma-uc-name' : 'ad-user-name'} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{user?.name || 'Unnamed Dentist'}</span>
                        <TwentyFirstBadge
                          variant={user.status === 'approved' ? 'approved' : user.status === 'rejected' ? 'rejected' : 'pending'}
                          pulse={user.status === 'pending'}
                        >
                          {user.status}
                        </TwentyFirstBadge>
                      </div>
                      <div className={isMobile ? 'ma-uc-email' : 'ad-user-email'}>{user?.email || '—'}</div>
                      {user.clinicName && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--dz-color-text-muted)' }}>
                          {user.clinicName}
                        </div>
                      )}
                      <div className={isMobile ? 'ma-uc-date' : 'ad-user-date'}>
                        {Ico.clock(11)}
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </div>
                    </div>
                  </div>

                  {user.plainPassword && (
                    <div className={isMobile ? 'ma-uc-pw' : 'ad-user-pw'} style={{ marginTop: '8px' }}>
                      {Ico.lock(11)}
                      <span className="ma-pw-value" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {visiblePw === uId ? user.plainPassword : '••••••••'}
                      </span>
                      <button
                        type="button"
                        className="ma-pw-toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVisiblePw(visiblePw === uId ? null : uId);
                        }}
                        title={visiblePw === uId ? 'Hide password' : 'Show password'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
                      >
                        {visiblePw === uId ? Ico.eyeOff(13) : Ico.eye(13)}
                      </button>
                    </div>
                  )}

                  {/* Inline action buttons */}
                  <div
                    className={isMobile ? 'ma-card-actions' : 'ad-card-actions'}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {user.status === 'pending' && (
                      <button
                        type="button"
                        className={isMobile ? 'ma-card-action-btn ma-action-approve' : 'ad-card-action-btn ad-action-approve'}
                        onClick={() => onApprove(uId, user.name)}
                        title="Approve"
                      >
                        {Ico.check(14)} Accept
                      </button>
                    )}
                    {user.status === 'pending' && (
                      <button
                        type="button"
                        className={isMobile ? 'ma-card-action-btn ma-action-reject' : 'ad-card-action-btn ad-action-reject'}
                        onClick={() => onReject(uId, user.name)}
                        title="Reject"
                      >
                        {Ico.x(14)} Reject
                      </button>
                    )}
                    {user.status === 'approved' && (
                      <button
                        type="button"
                        className={isMobile ? 'ma-card-action-btn ma-action-reject' : 'ad-card-action-btn ad-action-reject'}
                        onClick={() => onReject(uId, user.name)}
                        title="Revoke Approval"
                      >
                        {Ico.x(14)} Reject
                      </button>
                    )}
                    {user.status === 'rejected' && (
                      <button
                        type="button"
                        className={isMobile ? 'ma-card-action-btn ma-action-approve' : 'ad-card-action-btn ad-action-approve'}
                        onClick={() => onApprove(uId, user.name)}
                        title="Approve"
                      >
                        {Ico.check(14)} Accept
                      </button>
                    )}
                    <button
                      type="button"
                      className={isMobile ? 'ma-card-action-btn ma-action-delete' : 'ad-card-action-btn ad-action-delete'}
                      onClick={() => onDelete(uId, user.name)}
                      title="Delete Dentist"
                    >
                      {Ico.trash(14)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
