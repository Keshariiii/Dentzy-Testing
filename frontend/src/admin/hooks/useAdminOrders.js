'use client';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

export function useAdminOrders({ authFetch, ADMIN_API, admin, showToast }) {
  const [allOrders, setAllOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const authFetchRef = useRef(authFetch);
  useEffect(() => {
    authFetchRef.current = authFetch;
  }, [authFetch]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/orders?limit=200&sort=createdAt&order=desc`);
      if (res.ok) {
        const d = await res.json();
        setAllOrders(d.orders || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingOrders(false);
    }
  }, [ADMIN_API]);

  // Initial load
  useEffect(() => {
    if (!admin?.username) return;
    fetchOrders();
  }, [admin?.username, fetchOrders]);

  // Filtered orders memoized
  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      // Status filter
      if (orderFilter !== 'all') {
        const statusMatch = (o.status || '').toLowerCase() === orderFilter.toLowerCase();
        const stageMatch = (o.stage || '').toLowerCase() === orderFilter.toLowerCase();
        if (!statusMatch && !stageMatch) return false;
      }
      // Search query
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const patient = (o.patientName || '').toLowerCase();
        const caseId = (o.caseId || '').toLowerCase();
        const dentist = (o.owner?.name || o.dentistName || '').toLowerCase();
        const clinic = (o.owner?.clinicName || o.clinicName || '').toLowerCase();
        if (!patient.includes(q) && !caseId.includes(q) && !dentist.includes(q) && !clinic.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allOrders, orderFilter, orderSearch]);

  const handleStageChange = useCallback(async (orderId, newStage) => {
    setActionLoading(orderId);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/orders/${orderId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        showToast?.(`Order stage updated to "${newStage}".`);
        fetchOrders();
      } else {
        const err = await res.json();
        showToast?.(err.message || 'Failed to update stage', 'error');
      }
    } catch {
      showToast?.('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [ADMIN_API, fetchOrders, showToast]);

  const handleUpdateOrderAmount = useCallback(async (order, amount) => {
    const orderId = order._id || order.id || order.caseId;
    setActionLoading(orderId);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/orders/${orderId}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ amount: Number(amount) }),
      });
      if (res.ok) {
        showToast?.('Order amount updated.');
        fetchOrders();
      } else {
        const err = await res.json();
        showToast?.(err.message || 'Failed to update amount', 'error');
      }
    } catch {
      showToast?.('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [ADMIN_API, fetchOrders, showToast]);

  const handleDeleteOrder = useCallback(async (orderId) => {
    setActionLoading(orderId);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/orders/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast?.('Order deleted.');
        fetchOrders();
      } else {
        const err = await res.json();
        showToast?.(err.message || 'Failed to delete order', 'error');
      }
    } catch {
      showToast?.('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [ADMIN_API, fetchOrders, showToast]);

  return {
    allOrders,
    setAllOrders,
    loadingOrders,
    orderFilter,
    setOrderFilter,
    orderSearch,
    setOrderSearch,
    actionLoading,
    filteredOrders,
    fetchOrders,
    handleStageChange,
    handleUpdateOrderAmount,
    handleDeleteOrder,
  };
}

export default useAdminOrders;
