'use client';
import React, { useEffect, useState, useCallback } from 'react';
import TwentyFirstNoticeBar from '../ui/twentyfirst-notice-bar';
import { useStaffAuth } from '../../staff/StaffAuthContext';
import { triggerBirthdayConfettiOnce } from '../../utils/birthdayConfetti';

const STAFF_API = '/api/staff';

export default function StaffNoticeBar({ authFetch: propAuthFetch }) {
  const staffAuth = useStaffAuth();
  const authFetch = propAuthFetch || staffAuth?.authFetch;
  const staff = staffAuth?.staff;

  const [noticeData, setNoticeData] = useState({ enabled: true, isBirthday: false, messages: [] });

  const fetchNotice = useCallback(async () => {
    if (!authFetch) return;
    try {
      const res = await authFetch(`${STAFF_API}/notice`);
      if (res.ok) {
        const d = await res.json();
        const messages = Array.isArray(d.messages) && d.messages.length > 0
          ? d.messages
          : (d.message ? [d.message] : []);
        const isBirthday = Boolean(d.isBirthday);
        setNoticeData({
          enabled: isBirthday ? true : d.enabled !== false,
          isBirthday,
          messages,
        });
        if (isBirthday && d.birthdayDate) {
          triggerBirthdayConfettiOnce(staff?.id || staff?.username || 'staff', d.birthdayDate);
        }
      }
    } catch {
      // fallback
    }
  }, [authFetch, staff?.id, staff?.username]);

  useEffect(() => {
    fetchNotice();
  }, [fetchNotice]);

  useEffect(() => {
    const onFocus = () => fetchNotice();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchNotice]);

  if (!noticeData.enabled || !noticeData.messages || noticeData.messages.length === 0) {
    return null;
  }

  return (
    <TwentyFirstNoticeBar
      messages={noticeData.messages}
      label={noticeData.isBirthday ? '🎂 Birthday' : 'Notice'}
    />
  );
}
