'use client';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

export function useAdminPayments({ authFetch, ADMIN_API, admin, showToast }) {
  const [paymentData, setPaymentData] = useState({ summary: null, payments: [] });
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [payFilterStatus, setPayFilterStatus] = useState('all');
  const [payFilterMode, setPayFilterMode] = useState('all');
  const [paySearch, setPaySearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const authFetchRef = useRef(authFetch);
  useEffect(() => {
    authFetchRef.current = authFetch;
  }, [authFetch]);

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (payFilterStatus !== 'all') params.set('status', payFilterStatus);
      if (payFilterMode !== 'all') params.set('mode', payFilterMode);
      if (paySearch) params.set('search', paySearch);
      const res = await authFetchRef.current(`${ADMIN_API}/payments?${params}`);
      if (res.ok) {
        const d = await res.json();
        setPaymentData(d);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingPayments(false);
    }
  }, [ADMIN_API, payFilterStatus, payFilterMode, paySearch]);

  // Initial load & when filters change
  useEffect(() => {
    if (!admin?.username) return;
    fetchPayments();
  }, [admin?.username, fetchPayments]);

  const payments = paymentData.payments || [];
  const summary = paymentData.summary || {
    totalRevenue: 0,
    collectedRevenue: 0,
    pendingRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
  };

  const handleRecordPayment = useCallback(async (orderId, form) => {
    setActionLoading(orderId);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/orders/${orderId}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Paid',
          paymentMode: form.mode || form.paymentMode,
          referenceNumber: form.referenceNumber || '',
          amount: form.amount ? Number(form.amount) : undefined,
          notes: form.notes || '',
        }),
      });
      if (res.ok) {
        showToast?.('Payment recorded successfully.');
        fetchPayments();
        return true;
      } else {
        const err = await res.json();
        showToast?.(err.message || 'Failed to record payment', 'error');
        return false;
      }
    } catch {
      showToast?.('Network error', 'error');
      return false;
    } finally {
      setActionLoading(null);
    }
  }, [ADMIN_API, fetchPayments, showToast]);

  const handleUpdatePaymentAmount = useCallback(async (payment, amount) => {
    const orderId = payment._id || payment.id || payment.caseId;
    setActionLoading(orderId);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/orders/${orderId}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ amount: Number(amount) }),
      });
      if (res.ok) {
        showToast?.('Payment amount updated.');
        fetchPayments();
      } else {
        const err = await res.json();
        showToast?.(err.message || 'Failed to update amount', 'error');
      }
    } catch {
      showToast?.('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [ADMIN_API, fetchPayments, showToast]);

  const handleDeletePayment = useCallback(async (paymentId) => {
    setActionLoading(paymentId);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/orders/${paymentId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast?.('Payment record deleted.');
        fetchPayments();
      } else {
        const err = await res.json();
        showToast?.(err.message || 'Failed to delete payment', 'error');
      }
    } catch {
      showToast?.('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [ADMIN_API, fetchPayments, showToast]);

  return {
    paymentData,
    payments,
    summary,
    loadingPayments,
    payFilterStatus,
    setPayFilterStatus,
    payFilterMode,
    setPayFilterMode,
    paySearch,
    setPaySearch,
    actionLoading,
    fetchPayments,
    handleRecordPayment,
    handleUpdatePaymentAmount,
    handleDeletePayment,
  };
}

export default useAdminPayments;
