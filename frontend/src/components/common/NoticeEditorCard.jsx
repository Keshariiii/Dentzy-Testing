'use client';
import React, { useState } from 'react';
import { TICKER_MESSAGES } from '../dashboard/shared/constants';
import { NoticeEditorSkeleton } from '../SkeletonBlocks';
import TwentyFirstNoticeBar from '../ui/twentyfirst-notice-bar';
import TwentyFirstNoticeList from '../ui/twentyfirst-notice-list';
import TwentyFirstIconButton from '../ui/twentyfirst-icon-button';
import ToggleSwitch from './ToggleSwitch';
import { Icons } from './DashboardIcons';

export const STAFF_TICKER_MESSAGES = [
  'Welcome to Dentzy Lab Operations Portal',
  'Ensure all case scans & QC checklists are logged before dispatch',
  'Priority cases marked Urgent must be completed within 24 hours',
  'Standard daily shift handover meeting at 6:00 PM',
  'Lab Support & Rush Desk hotline: +91 9503668112',
];

/**
 * NoticeEditorCard — Unified announcement ticker manager for Admin PC & Mobile dashboards.
 */
export default function NoticeEditorCard({
  title,
  toggleLabel = 'Show Notice Bar',
  toggleDescription = 'When disabled, the announcement ticker is hidden across portals',
  enabled = true,
  onToggle,
  messages = [],
  onChange,
  newMessage,
  onNewMessageChange,
  onSave,
  saving = false,
  loaded = true,
  isMobile = false,
  defaultMessages = TICKER_MESSAGES,
  placeholder = 'Type a new announcement message...',
  listLabel = 'Announcements',
}) {
  const [draftMessage, setDraftMessage] = useState('');
  const currentDraft = newMessage !== undefined ? newMessage : draftMessage;
  const setDraft = (val) => {
    if (onNewMessageChange) onNewMessageChange(val);
    else setDraftMessage(val);
  };

  if (!loaded) {
    return <NoticeEditorSkeleton />;
  }

  const safeMessages = Array.isArray(messages) ? messages : [];
  const trimmedDraft = (currentDraft || '').trim();
  const resolvedDefaults =
    Array.isArray(defaultMessages) && defaultMessages.length > 0
      ? defaultMessages
      : TICKER_MESSAGES;

  const handleAddMessage = () => {
    if (!trimmedDraft) return;
    onChange?.([...safeMessages, trimmedDraft]);
    setDraft('');
  };

  const handleResetDefaults = () => {
    onChange?.([...resolvedDefaults]);
    if (!enabled) onToggle?.(true);
  };

  const cardSurface = {
    background: '#ffffff',
    border: '1px solid var(--dz-color-border-mint, #e2ece6)',
    borderRadius: isMobile ? '14px' : '16px',
    padding: isMobile ? '16px' : '24px',
    boxShadow: isMobile
      ? '0 1px 3px rgba(0, 0, 0, 0.04)'
      : '0 4px 16px rgba(0, 0, 0, 0.04)',
  };

  return (
    <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' } : cardSurface}>
      {title ? (
        <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#1a3028' }}>
          {title}
        </h3>
      ) : null}

      {/* Master Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: isMobile ? '14px 16px' : '16px 20px',
          marginBottom: isMobile ? 0 : '24px',
          background: isMobile ? '#ffffff' : '#f8faf9',
          border: '1px solid var(--dz-color-border-mint, #e2ece6)',
          borderRadius: '14px',
          boxShadow: isMobile ? '0 1px 3px rgba(0, 0, 0, 0.04)' : 'none',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: isMobile ? '0.88rem' : '0.92rem', color: '#1a3028' }}>
            {toggleLabel}
          </div>
          {toggleDescription ? (
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#6b8a7a', marginTop: '2px' }}>
              {toggleDescription}
            </div>
          ) : null}
        </div>
        <ToggleSwitch
          checked={Boolean(enabled)}
          onChange={onToggle}
          ariaLabel={toggleLabel}
          variant="success"
          size={isMobile ? 'md' : 'lg'}
        />
      </div>

      {/* Live Preview */}
      {safeMessages.length > 0 && (
        <div
          style={
            isMobile
              ? {
                  background: '#ffffff',
                  border: '1px solid var(--dz-color-border-mint, #e2ece6)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }
              : { marginBottom: '24px' }
          }
        >
          <div
            style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: 700,
              color: '#6b8a7a',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: isMobile ? '8px' : '10px',
            }}
          >
            Live Preview
          </div>
          <div
            style={{
              opacity: enabled ? 1 : 0.4,
              transition: 'opacity 0.2s',
              pointerEvents: enabled ? 'auto' : 'none',
            }}
          >
            <TwentyFirstNoticeBar messages={safeMessages} />
          </div>
        </div>
      )}

      {/* Editor & List Wrapper */}
      <div
        style={
          isMobile
            ? {
                background: '#ffffff',
                border: '1px solid var(--dz-color-border-mint, #e2ece6)',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }
            : { display: 'flex', flexDirection: 'column', gap: '20px' }
        }
      >
        {isMobile && listLabel ? (
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#6b8a7a',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {listLabel}
          </div>
        ) : null}

        {/* Add New Message */}
        <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', width: '100%' }}>
          <input
            type="text"
            value={currentDraft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && trimmedDraft) {
                e.preventDefault();
                handleAddMessage();
              }
            }}
            placeholder={placeholder}
            maxLength={250}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: '44px',
              padding: isMobile ? '10px 12px' : '10px 16px',
              borderRadius: isMobile ? '10px' : '12px',
              border: '1px solid #d4ddd8',
              fontSize: isMobile ? '0.84rem' : '0.88rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <TwentyFirstIconButton
            icon={Icons.plus(18)}
            title="Add Message"
            ariaLabel="Add Message"
            disabled={!trimmedDraft}
            onClick={handleAddMessage}
            variant="primary"
            size="lg"
          />
        </div>

        {/* Draggable Reorderable List */}
        <TwentyFirstNoticeList messages={safeMessages} onChange={onChange} />

        {/* Action Footer */}
        <div
          style={{
            display: 'flex',
            gap: isMobile ? '8px' : '12px',
            justifyContent: 'flex-end',
            paddingTop: isMobile ? '6px' : '16px',
            borderTop: isMobile ? 'none' : '1px solid #edf2ef',
          }}
        >
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              padding: isMobile ? '8px 14px' : '10px 20px',
              borderRadius: isMobile ? '10px' : '12px',
              border: '1px solid #d4ddd8',
              background: '#ffffff',
              color: '#6b8a7a',
              fontWeight: 600,
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            {isMobile ? 'Defaults' : 'Reset to Defaults'}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !loaded}
            style={{
              padding: isMobile ? '8px 18px' : '10px 26px',
              borderRadius: isMobile ? '10px' : '12px',
              border: 'none',
              background: '#1e5038',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: isMobile ? '0.82rem' : '0.88rem',
              cursor: saving || !loaded ? 'default' : 'pointer',
              opacity: saving || !loaded ? 0.7 : 1,
              minHeight: '44px',
            }}
          >
            {saving ? 'Saving...' : isMobile ? 'Save' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
