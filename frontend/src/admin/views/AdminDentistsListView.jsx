'use client';
import React from 'react';
import { Icons as Ico } from '../../components/common/DashboardIcons';
import EmptyState from '../../components/common/EmptyState';
import { TwentyFirstSegmentedTabs } from '../../components/ui/twentyfirst-segmented-tabs';
import TwentyFirstIconButton from '../../components/ui/twentyfirst-icon-button';
import { DentzyRowCard, DentzyStatusPill } from '../../components/common/DentzyCard';
import DentzySearchBar from '../../components/common/DentzySearchBar';
import SubViewHeader from '../../components/common/SubViewHeader';
import { formatDoctorName } from '../../utils/format';

const DENTIST_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'archived', label: 'Archived' },
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
      <SubViewHeader
        title="Registered Dentists"
        count={stats.total || users.length}
        onBack={isMobile && onBack ? onBack : undefined}
        backLabel="Back"
        style={{ padding: isMobile ? '12px 16px 0' : 0, marginBottom: '12px' }}
      />

      {/* Search Bar */}
      <div style={{ marginBottom: '12px' }}>
        <DentzySearchBar
          placeholder="Search dentists by name, clinic, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
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
              const isArchived = user.status === 'archived' || Boolean(user.isArchived);
              const statusLabel = isArchived
                ? (user.archiveReason || 'Archived')
                : (user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Pending');
              const dateFormatted = user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—';

              return (
                <DentzyRowCard
                  key={uId}
                  title={formatDoctorName(user?.name, 'Unnamed Dentist')}
                  avatarMuted={isArchived}
                  badge={<DentzyStatusPill status={isArchived ? 'archived' : user.status} label={statusLabel} type="account" />}
                  subtitle={`${user?.email || '—'}${user?.phone ? ` · ${user.phone}` : ''}`}
                  dateIcon={Ico.clock(11)}
                  dateText={dateFormatted}
                  onClick={() => onSelectUser(uId)}
                  rightPills={
                    <>
                      {user?.clinicName && <DentzyStatusPill label={user.clinicName} type="clinic" />}
                    </>
                  }
                  actions={
                    !isArchived && (user.status === 'pending' || user.status === 'rejected') ? (
                      <>
                        <TwentyFirstIconButton
                          icon={Ico.check(14)}
                          title="Approve Dentist"
                          ariaLabel="Approve Dentist"
                          onClick={() => onApprove(uId, user.name)}
                          size={isMobile ? 'lg' : 'sm'}
                          variant="success"
                        />
                        {user.status === 'pending' && (
                          <TwentyFirstIconButton
                            icon={Ico.x(14)}
                            title="Reject Dentist"
                            ariaLabel="Reject Dentist"
                            onClick={() => onReject(uId, user.name)}
                            size={isMobile ? 'lg' : 'sm'}
                            variant="danger"
                          />
                        )}
                        <TwentyFirstIconButton
                          icon={Ico.trash(14)}
                          title="Delete Dentist"
                          ariaLabel="Delete Dentist"
                          onClick={() => onDelete(uId, user.name)}
                          size={isMobile ? 'lg' : 'sm'}
                          variant="danger"
                        />
                      </>
                    ) : null
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
