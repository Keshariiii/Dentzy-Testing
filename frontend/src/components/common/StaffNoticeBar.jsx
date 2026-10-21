'use client';
import React, { useEffect, useState, useCallback } from 'react';
import TwentyFirstNoticeBar from '../ui/twentyfirst-notice-bar';

const STAFF_API = '/api/staff';

export default function StaffNoticeBar({ authFetch }) {
  const [noticeData, setNoticeData] = useState({ enabled: true, messages: [] });

  const fetchNotice = useCallback(async () => {
    if (!authFetch) return;
    try {
      const res = await authFetch(`${STAFF_API}/notice`);
      if (res.ok) {
        const d = await res.json();
        const messages = Array.isArray(d.messages) && d.messages.length > 0
          ? d.messages
          : (d.message ? [d.message] : []);
        setNoticeData({
          enabled: d.enabled !== false,
          messages,
        });
      }
    } catch {
      // fallback
    }
  }, [authFetch]);

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

  return <TwentyFirstNoticeBar messages={noticeData.messages} />;
}
