'use client';
/**
 * StaffManagementView — Shared staff management component for Admin Dashboard.
 * Sub-views: Members, Attendance, Inventory, Metrics.
 * Ponytail: one component, shared by desktop + mobile.
 * Impeccable: no emojis, no card borders (shadows only), premium micro-animations.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';

const DESIGNATIONS = [
  'Lab Assistant', 'Lab Technician', 'Senior Technician', 'CAD/CAM Specialist',
  'Ceramist', 'Quality Control', 'Intern', 'IT Department', 'Receptionist',
  'Accountant', 'Manager', 'Operations Head', 'Director', 'CTO', 'CEO',
];

const SUB_VIEWS = [
  { key: 'members', label: 'Members' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'metrics', label: 'Metrics' },
];

const StaffManagementView = ({
  authFetch, ADMIN_API, showToast,
  staffList, loadingStaff, staffSearch, setStaffSearch,
  fetchStaff, setStaffList, Ico, setConfirmConfig,
}) => {
  const [subView, setSubView] = useState('members');
  const [activeDesignation, setActiveDesignation] = useState(null);

  // ── Create Staff Modal ──────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ displayName: '', username: '', password: '', email: '', designation: 'Lab Assistant' });
  const [createError, setCreateError] = useState('');
  const [createSaving, setCreateSaving] = useState(false);

  const handleCreateStaff = async () => {
    setCreateError('');
    if (!createForm.displayName.trim() || !createForm.username.trim() || !createForm.password.trim()) {
      setCreateError('All fields are required.');
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters.');
      return;
    }
    setCreateSaving(true);
    try {
      const res = await authFetch(`${ADMIN_API}/staff`, {
        method: 'POST',
        body: JSON.stringify({
          displayName: createForm.displayName.trim(),
          username: createForm.username.trim(),
          password: createForm.password,
          email: createForm.email.trim(),
          designation: createForm.designation,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Staff account created.');
        setShowCreateModal(false);
        setCreateForm({ displayName: '', username: '', password: '', email: '', designation: 'Lab Assistant' });
        fetchStaff();
      } else {
        setCreateError(data.message || 'Failed to create staff.');
      }
    } catch { setCreateError('Network error.'); }
    setCreateSaving(false);
  };

  // ── Toggle Staff Status ─────────────────────────────────────────────────
  const handleToggleStatus = (staff) => {
    const newStatus = staff.status === 'active' ? 'deactivate' : 'activate';
    setConfirmConfig({
      title: `${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} Staff`,
      message: `Are you sure you want to ${newStatus} "${staff.displayName}"?`,
      type: newStatus === 'deactivate' ? 'warning' : 'primary',
      confirmText: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, loading: true }));
        try {
          const res = await authFetch(`${ADMIN_API}/staff/${staff.id}/status`, { method: 'PATCH' });
          const data = await res.json();
          if (res.ok) { showToast(data.message || 'Status updated.'); fetchStaff(); }
          else showToast(data.message || 'Failed', 'error');
        } catch { showToast('Network error', 'error'); }
        setConfirmConfig(null);
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  // ── Delete Staff ────────────────────────────────────────────────────────
  const handleDeleteStaff = (staff) => {
    setConfirmConfig({
      title: 'Delete Staff',
      message: `Are you sure you want to delete "${staff.displayName}"? This cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, loading: true }));
        try {
          const res = await authFetch(`${ADMIN_API}/staff/${staff.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) { showToast(data.message || 'Staff deleted.'); fetchStaff(); }
          else showToast(data.message || 'Failed', 'error');
        } catch { showToast('Network error', 'error'); }
        setConfirmConfig(null);
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  // ── Attendance State ────────────────────────────────────────────────────
  const [attendanceStaff, setAttendanceStaff] = useState(null); // staff member being marked
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceStatus, setAttendanceStatus] = useState('Present');
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedStaffForHistory, setSelectedStaffForHistory] = useState(null);

  const handleMarkAttendance = async () => {
    if (!attendanceStaff) return;
    setAttendanceSaving(true);
    try {
      const res = await authFetch(`${ADMIN_API}/staff/${attendanceStaff.id}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ date: attendanceDate, status: attendanceStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Attendance marked.');
        setAttendanceStaff(null);
      } else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Network error', 'error'); }
    setAttendanceSaving(false);
  };

  const fetchAttendanceHistory = useCallback(async (staffId) => {
    try {
      const res = await authFetch(`${ADMIN_API}/staff/${staffId}/attendance?month=${attendanceMonth}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceHistory(data.attendance || []);
      }
    } catch {}
  }, [authFetch, ADMIN_API, attendanceMonth]);

  useEffect(() => {
    if (selectedStaffForHistory) fetchAttendanceHistory(selectedStaffForHistory.id);
  }, [selectedStaffForHistory, attendanceMonth, fetchAttendanceHistory]);

  // ── Inventory State ─────────────────────────────────────────────────────
  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState({ item_name: '', quantity: '', unit: 'pcs', min_stock: '' });
  const [itemFormError, setItemFormError] = useState('');
  const [itemFormSaving, setItemFormSaving] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const res = await authFetch(`${ADMIN_API}/staff/inventory`);
      if (res.ok) { const d = await res.json(); setInventory(d.items || []); }
    } catch {}
    setLoadingInventory(false);
  }, [authFetch, ADMIN_API]);

  useEffect(() => { if (subView === 'inventory') fetchInventory(); }, [subView, fetchInventory]);

  const handleAddItem = async () => {
    setItemFormError('');
    if (!itemForm.item_name.trim() || !itemForm.unit.trim()) {
      setItemFormError('Item name and unit are required.');
      return;
    }
    setItemFormSaving(true);
    try {
      const res = await authFetch(`${ADMIN_API}/staff/inventory`, {
        method: 'POST',
        body: JSON.stringify({
          item_name: itemForm.item_name.trim(),
          quantity: parseInt(itemForm.quantity) || 0,
          unit: itemForm.unit.trim(),
          min_stock: parseInt(itemForm.min_stock) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Item added.');
        setShowAddItem(false);
        setItemForm({ item_name: '', quantity: '', unit: 'pcs', min_stock: '' });
        fetchInventory();
      } else setItemFormError(data.message || 'Failed');
    } catch { setItemFormError('Network error.'); }
    setItemFormSaving(false);
  };

  const handleUpdateStock = async (item, delta) => {
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    try {
      const res = await authFetch(`${ADMIN_API}/staff/inventory/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) fetchInventory();
      else showToast('Failed to update stock', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  const handleDeleteItem = (item) => {
    setConfirmConfig({
      title: 'Delete Item',
      message: `Remove "${item.item_name}" from inventory?`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, loading: true }));
        try {
          const res = await authFetch(`${ADMIN_API}/staff/inventory/${item.id}`, { method: 'DELETE' });
          if (res.ok) { showToast('Item deleted.'); fetchInventory(); }
          else showToast('Failed', 'error');
        } catch { showToast('Network error', 'error'); }
        setConfirmConfig(null);
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  // ── Metrics State ───────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState(null);
  const [metricsMonth, setMetricsMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const res = await authFetch(`${ADMIN_API}/staff/metrics?month=${metricsMonth}`);
      if (res.ok) { const d = await res.json(); setMetrics(d); }
    } catch {}
    setLoadingMetrics(false);
  }, [authFetch, ADMIN_API, metricsMonth]);

  useEffect(() => { if (subView === 'metrics') fetchMetrics(); }, [subView, metricsMonth, fetchMetrics]);

  // ── Edit Staff Modal ────────────────────────────────────────────────────
  const [editStaff, setEditStaff] = useState(null);
  const [editForm, setEditForm] = useState({ displayName: '', email: '', designation: '' });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const openEditModal = (s) => {
    setEditStaff(s);
    setEditForm({ displayName: s.displayName || '', email: s.email || '', designation: s.designation || 'Lab Assistant' });
    setEditError('');
  };

  const handleEditStaff = async () => {
    setEditError('');
    if (!editForm.displayName.trim()) { setEditError('Display name is required.'); return; }
    setEditSaving(true);
    try {
      const res = await authFetch(`${ADMIN_API}/staff/${editStaff.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Staff updated.');
        setEditStaff(null);
        fetchStaff();
      } else setEditError(data.message || 'Failed');
    } catch { setEditError('Network error.'); }
    setEditSaving(false);
  };

  // ── Filtered staff list ─────────────────────────────────────────────────
  const filtered = (staffList || []).filter(s =>
    (s.displayName || '').toLowerCase().includes((staffSearch || '').toLowerCase()) ||
    (s.username || '').toLowerCase().includes((staffSearch || '').toLowerCase())
  );

  // ── Designation Groups ──────────────────────────────────────────────────
  const designationGroups = useMemo(() => {
    const groups = {};
    (staffList || []).forEach(s => {
      const d = s.designation || 'Unassigned';
      if (!groups[d]) groups[d] = [];
      groups[d].push(s);
    });
    return groups;
  }, [staffList]);

  /* ── Shared Styles ─────────────────────────────────────────────────────── */
  const cardStyle = {
    background: '#fff', borderRadius: '14px', padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s',
  };
  const btnPrimary = {
    padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    background: '#1e5038', color: '#fff', fontWeight: 600, fontSize: '0.82rem',
  };
  const btnSecondary = {
    padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    background: '#e8f5ee', color: '#1e5038', fontWeight: 600, fontSize: '0.78rem',
  };

  return (
    <div>
      {/* Sub-Nav */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 0', marginBottom: '16px', flexWrap: 'wrap' }}>
        {SUB_VIEWS.map(sv => (
          <button key={sv.key}
            onClick={() => setSubView(sv.key)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: subView === sv.key ? '#1e5038' : '#f0f7f3',
              color: subView === sv.key ? '#fff' : '#4a7060',
              fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s ease',
            }}>
            {sv.label}
          </button>
        ))}
      </div>

      {/* ── MEMBERS ────────────────────────────────────── */}
      {subView === 'members' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div className="ad-header-search" style={{ flex: 1, maxWidth: '320px' }}>
                <span className="ad-search-icon">{Ico.search(14)}</span>
                <input type="text" className="ad-search" placeholder="Search staff..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {activeDesignation && (
                <button onClick={() => setActiveDesignation(null)} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {Ico.arrowLeft ? Ico.arrowLeft(14) : '<'} All Designations
                </button>
              )}
              <button onClick={fetchStaff} style={btnSecondary}>Refresh</button>
              <button onClick={() => setShowCreateModal(true)} style={btnPrimary}>+ Add Staff</button>
            </div>
          </div>

          {loadingStaff ? (
            <div className="ad-loading"><div className="ad-skeleton-list">{[1,2,3].map(i => <div key={i} className="ad-skeleton-card"/>)}</div></div>
          ) : !activeDesignation ? (
            /* ── Designation Cards Grid ── */
            Object.keys(designationGroups).length === 0 ? (
              <div className="ad-empty" style={{ textAlign: 'center', padding: '60px 20px' }}>
                {Ico.usersS ? Ico.usersS(48) : Ico.grid(48)}
                <p style={{ marginTop: '16px', color: '#708c80' }}>No staff members found. Click "+ Add Staff" to create accounts.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {Object.entries(designationGroups).map(([designation, members]) => (
                  <div key={designation}
                    onClick={() => setActiveDesignation(designation)}
                    style={{
                      ...cardStyle, cursor: 'pointer', textAlign: 'center', padding: '24px 16px',
                      transition: 'box-shadow 0.25s, transform 0.25s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '50%', background: '#e8f5ee',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, color: '#1e5038', fontSize: '1.1rem', margin: '0 auto 12px',
                    }}>{members.length}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1a3028' }}>{designation}</div>
                    <div style={{ fontSize: '0.75rem', color: '#708c80', marginTop: '4px' }}>
                      {members.length} member{members.length !== 1 ? 's' : ''}
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {members.filter(m => m.status === 'active').length > 0 && (
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 600, background: '#dcfce7', color: '#16a34a' }}>
                          {members.filter(m => m.status === 'active').length} active
                        </span>
                      )}
                      {members.filter(m => m.status !== 'active').length > 0 && (
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 600, background: '#fee2e2', color: '#dc2626' }}>
                          {members.filter(m => m.status !== 'active').length} inactive
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* ── Staff List Within Designation ── */
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700, color: '#1a3028' }}>
                {activeDesignation} ({(designationGroups[activeDesignation] || []).length})
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {(designationGroups[activeDesignation] || []).filter(s =>
                  (s.displayName || '').toLowerCase().includes((staffSearch || '').toLowerCase()) ||
                  (s.username || '').toLowerCase().includes((staffSearch || '').toLowerCase())
                ).map(s => (
                  <div key={s.id} className="ad-staff-card" style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%', background: '#e8f5ee',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: '#1e5038', fontSize: '0.92rem', flexShrink: 0,
                      }}>
                        {(s.displayName || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.displayName}
                          {s.employeeId && (
                            <span style={{ marginLeft: '8px', fontSize: '0.72rem', fontWeight: 600, color: '#708c80', background: '#f0f7f3', padding: '2px 8px', borderRadius: '8px' }}>
                              #{s.employeeId}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#708c80', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          @{s.username}{s.email ? ` | ${s.email}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="ad-staff-card-actions">
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600,
                        background: s.status === 'active' ? '#dcfce7' : '#fee2e2',
                        color: s.status === 'active' ? '#16a34a' : '#dc2626',
                      }}>{s.status}</span>
                      <button onClick={() => openEditModal(s)} style={{ ...btnSecondary, fontSize: '0.72rem', padding: '4px 10px' }}>
                        Edit
                      </button>
                      <button onClick={() => handleToggleStatus(s)} style={{ ...btnSecondary, fontSize: '0.72rem', padding: '4px 10px' }}>
                        {s.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDeleteStaff(s)} style={{ ...btnSecondary, background: '#fef2f2', color: '#dc2626', fontSize: '0.72rem', padding: '4px 10px' }}>
                        {Ico.trash(13)}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ATTENDANCE ──────────────────────────────────── */}
      {subView === 'attendance' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a3028' }}>Staff Attendance</h3>
          </div>

          {selectedStaffForHistory ? (
            <div>
              <button onClick={() => { setSelectedStaffForHistory(null); setAttendanceHistory([]); }}
                style={{ ...btnSecondary, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {Ico.arrowLeft ? Ico.arrowLeft(14) : '<'} Back to Staff List
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#1a3028' }}>{selectedStaffForHistory.displayName} - Attendance History</h4>
                <input type="month" value={attendanceMonth} onChange={e => setAttendanceMonth(e.target.value)}
                  style={{ ...inputStyle, width: 'auto', maxWidth: '180px' }} />
              </div>
              {attendanceHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#708c80' }}>No records for this month.</div>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {attendanceHistory.map(a => (
                    <div key={a.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a3028' }}>
                        {new Date(a.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </span>
                      <span style={{
                        padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                        background: a.status === 'Present' ? '#dcfce7' : a.status === 'Half-day' ? '#fef9c3' : '#fee2e2',
                        color: a.status === 'Present' ? '#16a34a' : a.status === 'Half-day' ? '#92400e' : '#dc2626',
                      }}>{a.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {(staffList || []).filter(s => s.status === 'active').map(s => (
                <div key={s.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', background: '#e8f5ee',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: '#1e5038', fontSize: '0.88rem',
                    }}>{(s.displayName || 'S').charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a' }}>{s.displayName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#708c80' }}>@{s.username}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setAttendanceStaff(s); setAttendanceDate(new Date().toISOString().slice(0, 10)); setAttendanceStatus('Present'); }}
                      style={btnPrimary}>Mark</button>
                    <button onClick={() => setSelectedStaffForHistory(s)} style={btnSecondary}>History</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── INVENTORY ──────────────────────────────────── */}
      {subView === 'inventory' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a3028' }}>Inventory</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={fetchInventory} style={btnSecondary}>Refresh</button>
              <button onClick={() => setShowAddItem(true)} style={btnPrimary}>+ Add Item</button>
            </div>
          </div>

          {loadingInventory ? (
            <div className="ad-loading"><div className="ad-skeleton-list">{[1,2,3].map(i => <div key={i} className="ad-skeleton-card"/>)}</div></div>
          ) : inventory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#708c80' }}>
              <p>No inventory items yet. Click "+ Add Item" to track materials.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {inventory.map(item => (
                <div key={item.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1a1a1a' }}>{item.item_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#708c80', marginTop: '2px' }}>
                      {item.quantity} {item.unit} {item.min_stock > 0 ? `(min: ${item.min_stock})` : ''}
                      {item.quantity <= item.min_stock && item.min_stock > 0 &&
                        <span style={{ color: '#dc2626', fontWeight: 600, marginLeft: '8px' }}>LOW STOCK</span>
                      }
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={() => handleUpdateStock(item, -1)}
                      style={{ ...btnSecondary, width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>-</button>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e5038', minWidth: '28px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => handleUpdateStock(item, 1)}
                      style={{ ...btnSecondary, width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>+</button>
                    <button onClick={() => handleDeleteItem(item)} style={{ ...btnSecondary, background: '#fef2f2', color: '#dc2626', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {Ico.trash(13)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── METRICS / LEADERBOARD ──────────────────────── */}
      {subView === 'metrics' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a3028' }}>Staff Leaderboard</h3>
            <input type="month" value={metricsMonth} onChange={e => setMetricsMonth(e.target.value)}
              style={{ ...inputStyle, width: 'auto', maxWidth: '180px' }} />
          </div>

          {loadingMetrics ? (
            <div className="ad-loading"><div className="ad-skeleton-list">{[1,2,3].map(i => <div key={i} className="ad-skeleton-card"/>)}</div></div>
          ) : !metrics?.leaderboard?.length ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#708c80' }}>No data for this month.</div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {metrics.leaderboard.map((s, i) => (
                <div key={s.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: i === 0 ? '#fef9c3' : '#e8f5ee',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, color: i === 0 ? '#92400e' : '#1e5038', fontSize: '0.88rem',
                    }}>#{i + 1}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1a1a1a' }}>
                        {s.displayName}
                        {i === 0 && s.casesProcessed > 0 && (
                          <span style={{ marginLeft: '8px', fontSize: '0.72rem', fontWeight: 700, color: '#92400e', background: '#fef9c3', padding: '2px 8px', borderRadius: '10px' }}>
                            Staff of the Month
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#708c80', marginTop: '2px' }}>
                        @{s.username} {s.status !== 'active' && <span style={{ color: '#dc2626' }}>(inactive)</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, background: '#dbeafe', color: '#1d4ed8' }}>
                      {s.casesProcessed} cases
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, background: '#dcfce7', color: '#16a34a' }}>
                      {s.presentDays}d present
                    </span>
                    {s.halfDays > 0 && (
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, background: '#fef9c3', color: '#92400e' }}>
                        {s.halfDays} half
                      </span>
                    )}
                    {s.absentDays > 0 && (
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, background: '#fee2e2', color: '#dc2626' }}>
                        {s.absentDays} absent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE STAFF MODAL ────────────────────────── */}
      {showCreateModal && (
        <div className="ad-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="ad-pay-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="ad-pay-modal-header">
              <h3>Create Staff Account</h3>
              <button className="ad-pay-modal-close" onClick={() => setShowCreateModal(false)}>{Ico.x(16)}</button>
            </div>
            <div className="ad-pay-modal-body">
              <div className="ad-pay-form-group">
                <label>Display Name</label>
                <input type="text" placeholder="e.g. Rahul Sharma" value={createForm.displayName}
                  onChange={e => setCreateForm(f => ({ ...f, displayName: e.target.value }))} />
              </div>
              <div className="ad-pay-form-group">
                <label>Email</label>
                <input type="email" placeholder="e.g. rahul@example.com" value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="ad-pay-form-group">
                <label>Designation</label>
                <select value={createForm.designation}
                  onChange={e => setCreateForm(f => ({ ...f, designation: e.target.value }))}>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="ad-pay-form-group">
                <label>Username</label>
                <input type="text" placeholder="e.g. rahul_tech" value={createForm.username}
                  onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div className="ad-pay-form-group">
                <label>Password</label>
                <input type="text" placeholder="Min 6 characters" value={createForm.password}
                  onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
            {createError && <div className="ad-pay-form-error">{createError}</div>}
            <div className="ad-pay-modal-actions">
              <button className="ad-pay-btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="ad-pay-btn-confirm" onClick={handleCreateStaff} disabled={createSaving}>
                {createSaving ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MARK ATTENDANCE MODAL ─────────────────────── */}
      {attendanceStaff && (
        <div className="ad-modal-overlay" onClick={() => setAttendanceStaff(null)}>
          <div className="ad-pay-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="ad-pay-modal-header">
              <h3>Mark Attendance</h3>
              <button className="ad-pay-modal-close" onClick={() => setAttendanceStaff(null)}>{Ico.x(16)}</button>
            </div>
            <div style={{ padding: '8px 22px', fontSize: '0.88rem', color: '#4a7060' }}>
              Marking for <strong style={{ color: '#1a3028' }}>{attendanceStaff.displayName}</strong>
            </div>
            <div className="ad-pay-modal-body">
              <div className="ad-pay-form-group">
                <label>Date</label>
                <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
              </div>
              <div className="ad-pay-form-group">
                <label>Status</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Present', 'Absent', 'Half-day'].map(st => (
                    <button key={st} onClick={() => setAttendanceStatus(st)}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s',
                        background: attendanceStatus === st ? (st === 'Present' ? '#16a34a' : st === 'Half-day' ? '#d97706' : '#dc2626') : '#f0f7f3',
                        color: attendanceStatus === st ? '#fff' : '#4a7060',
                      }}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="ad-pay-modal-actions">
              <button className="ad-pay-btn-cancel" onClick={() => setAttendanceStaff(null)}>Cancel</button>
              <button className="ad-pay-btn-confirm" onClick={handleMarkAttendance} disabled={attendanceSaving}>
                {attendanceSaving ? 'Saving...' : 'Mark Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD INVENTORY ITEM MODAL ──────────────────── */}
      {showAddItem && (
        <div className="ad-modal-overlay" onClick={() => setShowAddItem(false)}>
          <div className="ad-pay-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="ad-pay-modal-header">
              <h3>Add Inventory Item</h3>
              <button className="ad-pay-modal-close" onClick={() => setShowAddItem(false)}>{Ico.x(16)}</button>
            </div>
            <div className="ad-pay-modal-body">
              <div className="ad-pay-form-group">
                <label>Item Name</label>
                <input type="text" placeholder="e.g. Zirconia Disc 98mm" value={itemForm.item_name}
                  onChange={e => setItemForm(f => ({ ...f, item_name: e.target.value }))} />
              </div>
              <div className="ad-pay-form-row">
                <div>
                  <label>Quantity</label>
                  <input type="number" min="0" placeholder="0" value={itemForm.quantity}
                    onChange={e => setItemForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div>
                  <label>Unit</label>
                  <input type="text" placeholder="pcs / grams / ml" value={itemForm.unit}
                    onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
              </div>
              <div className="ad-pay-form-group">
                <label>Min Stock Alert</label>
                <input type="number" min="0" placeholder="0 (disabled)" value={itemForm.min_stock}
                  onChange={e => setItemForm(f => ({ ...f, min_stock: e.target.value }))} />
              </div>
            </div>
            {itemFormError && <div className="ad-pay-form-error">{itemFormError}</div>}
            <div className="ad-pay-modal-actions">
              <button className="ad-pay-btn-cancel" onClick={() => setShowAddItem(false)}>Cancel</button>
              <button className="ad-pay-btn-confirm" onClick={handleAddItem} disabled={itemFormSaving}>
                {itemFormSaving ? 'Saving...' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT STAFF MODAL ────────────────────────────── */}
      {editStaff && (
        <div className="ad-modal-overlay" onClick={() => setEditStaff(null)}>
          <div className="ad-pay-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="ad-pay-modal-header">
              <h3>Edit Staff — {editStaff.displayName}</h3>
              <button className="ad-pay-modal-close" onClick={() => setEditStaff(null)}>{Ico.x(16)}</button>
            </div>
            <div style={{ padding: '8px 22px', fontSize: '0.82rem', color: '#708c80' }}>
              Employee ID: <strong style={{ color: '#1a3028' }}>#{editStaff.employeeId || 'N/A'}</strong>
              {' | '} Username: <strong style={{ color: '#1a3028' }}>@{editStaff.username}</strong>
            </div>
            <div className="ad-pay-modal-body">
              <div className="ad-pay-form-group">
                <label>Display Name</label>
                <input type="text" value={editForm.displayName}
                  onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))} />
              </div>
              <div className="ad-pay-form-group">
                <label>Email</label>
                <input type="email" value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="ad-pay-form-group">
                <label>Designation</label>
                <select value={editForm.designation}
                  onChange={e => setEditForm(f => ({ ...f, designation: e.target.value }))}>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            {editError && <div className="ad-pay-form-error">{editError}</div>}
            <div className="ad-pay-modal-actions">
              <button className="ad-pay-btn-cancel" onClick={() => setEditStaff(null)}>Cancel</button>
              <button className="ad-pay-btn-confirm" onClick={handleEditStaff} disabled={editSaving}>
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementView;
