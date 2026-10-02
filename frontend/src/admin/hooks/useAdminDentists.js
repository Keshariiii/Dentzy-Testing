'use client';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

export function useAdminDentists({ authFetch, ADMIN_API, admin, showToast }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const authFetchRef = useRef(authFetch);
  useEffect(() => {
    authFetchRef.current = authFetch;
  }, [authFetch]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      // Ignore
    }
  }, [ADMIN_API]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const statusParam = activeTab === 'all' ? '' : `status=${activeTab}&`;
      const res = await authFetchRef.current(`${ADMIN_API}/users?${statusParam}sort=createdAt&order=${sortOrder}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      // Ignore
    } finally {
      setLoadingUsers(false);
    }
  }, [ADMIN_API, activeTab, sortOrder]);

  // Initial load
  useEffect(() => {
    if (!admin?.username) return;
    fetchStats();
    fetchUsers();
  }, [admin?.username, fetchStats, fetchUsers]);

  // Re-fetch on filter changes
  useEffect(() => {
    if (!admin?.username) return;
    fetchUsers();
  }, [admin?.username, activeTab, sortOrder, fetchUsers]);

  // Filtered users memoized
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.clinicName && u.clinicName.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  }, [users, search]);

  const handleApprove = useCallback(async (userId) => {
    setActionLoading(userId);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/users/${userId}/approve`, { method: 'PATCH' });
      if (res.ok) {
        showToast?.('User approved successfully.');
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.json();
        showToast?.(err.message || 'Failed to approve user', 'error');
      }
    } catch {
      showToast?.('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [ADMIN_API, fetchUsers, fetchStats, showToast]);

  const handleReject = useCallback(async (userId, note = '') => {
    setActionLoading(userId);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/users/${userId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ note }),
      });
      if (res.ok) {
        showToast?.('User rejected.');
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.json();
        showToast?.(err.message || 'Failed to reject user', 'error');
      }
    } catch {
      showToast?.('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [ADMIN_API, fetchUsers, fetchStats, showToast]);

  const handleDeleteUser = useCallback(async (userId) => {
    setActionLoading(userId);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast?.('User deleted.');
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.json();
        showToast?.(err.message || 'Failed to delete user', 'error');
      }
    } catch {
      showToast?.('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [ADMIN_API, fetchUsers, fetchStats, showToast]);

  return {
    users,
    setUsers,
    stats,
    loadingUsers,
    activeTab,
    setActiveTab,
    sortOrder,
    setSortOrder,
    search,
    setSearch,
    actionLoading,
    filteredUsers,
    fetchUsers,
    fetchStats,
    handleApprove,
    handleReject,
    handleDeleteUser,
  };
}

export default useAdminDentists;
