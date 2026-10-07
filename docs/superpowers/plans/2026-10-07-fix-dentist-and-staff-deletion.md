# Dentist and Staff Deletion Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the delete dentist feature across desktop and mobile admin dashboards, verify and harden database cascade/foreign key behavior in Cloudflare D1 for both dentists and staff, eliminate UI status gating that hides delete buttons on approved dentists, and prevent nested modal history crashes.

**Architecture:** Ponytail-minimalist ladder fix:
1. **Un-gate dentist cards:** Remove the restrictive `(user.status === 'pending' || user.status === 'rejected')` condition in [AdminDashboard.jsx](file:///c:/Dentzy%20Testing/frontend/src/admin/AdminDashboard.jsx), [MobileAdminDashboard.jsx](file:///c:/Dentzy%20Testing/frontend/src/views/mobile/MobileAdminDashboard.jsx), and [AdminDentistsListView.jsx](file:///c:/Dentzy%20Testing/frontend/src/admin/views/AdminDentistsListView.jsx) so approved dentists expose the delete button just like staff.
2. **Eliminate nested modal collision:** In [DentistDetailModal.jsx](file:///c:/Dentzy%20Testing/frontend/src/admin/DentistDetailModal.jsx), stop rendering a nested `ConfirmDialog` with a duplicate `useBackNavigation` history trap. Instead, delegate deletion to the parent's existing root `handleDelete` handler.
3. **Database & Backend verification:** Verify and harden batch query execution in Cloudflare D1 for both `DELETE /api/admin/users/:id` (delete `lab_orders` -> `payments` -> `users`) and `DELETE /api/admin/staff/:id` (unassign `lab_orders.assigned_staff_id` -> delete `staff_attendance` -> delete `staff`).
4. **Staff UI state cleanup:** In [StaffManagementView.jsx](file:///c:/Dentzy%20Testing/frontend/src/admin/StaffManagementView.jsx), reset `attendanceStaff` and `editStaff` when a staff member is deleted to prevent stale drawer crashes.

**Tech Stack:** Next.js 14, React 18, Cloudflare D1 (SQLite), Cloudflare Workers (Hono), Node.js test runner (`node:test`).

**Spec:** Fix dentist delete failure, database constraint verification, and staff deletion audit.

---

## Global Constraints
- Apply Ponytail rules: deletion over addition, zero unneeded abstractions, minimal diffs, reuse existing handlers (`handleDelete` and root `ConfirmDialog`).
- Preserve Cloudflare D1 SQLite relational integrity and foreign key constraints (`PRAGMA foreign_keys = ON`).
- Ensure both desktop (`AdminDashboard.jsx`) and mobile (`MobileAdminDashboard.jsx`) receive identical functional fixes.
- All backend tests in `backend/test/` must pass cleanly.
- Frontend production build (`npm run build`) must succeed with 0 errors.

---

### Task 1: Backend Database & Deletion Routes Verification

**Files:**
- Modify: `backend/src/routes/admin.js:214-235` (Dentist deletion)
- Modify: `backend/src/routes/admin.js:662-684` (Staff deletion)
- Test: `backend/test/deletion.test.js`

**Interfaces:**
- Consumes: Cloudflare D1 database binding `c.env.DB`
- Produces: `DELETE /api/admin/users/:id` -> `{ message: 'User deleted successfully.' }` (200) | `{ message: 'User not found.' }` (404)
- Produces: `DELETE /api/admin/staff/:id` -> `{ message: 'Staff account deleted.' }` (200) | `{ message: 'Staff not found.' }` (404)

- [ ] **Step 1: Inspect backend/test/deletion.test.js to verify test coverage**

Confirm existing test scenarios for:
- `DELETE /api/admin/users/:id` (success and 404)
- `DELETE /api/admin/staff/:id` (success and 404)

- [ ] **Step 2: Run backend tests to verify baseline passes**

Run:
```powershell
npm test --prefix backend
```
Expected: PASS (119/119 tests passing).

- [ ] **Step 3: Verify and harden batch deletion in backend/src/routes/admin.js**

Ensure `DELETE /api/admin/users/:id` deletes dependent `lab_orders` and `payments` before deleting `users`, with proper audit logging:
```javascript
// DELETE /api/admin/users/:id
admin.delete('/users/:id', verifyAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const user = await c.env.DB.prepare('SELECT id, name, email FROM users WHERE id = ?').bind(id).first();
    if (!user) return c.json({ message: 'User not found.' }, 404);

    // Delete dependent records first to satisfy FK constraints, then delete user
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM lab_orders WHERE ownerId = ?').bind(id),
      c.env.DB.prepare('DELETE FROM payments WHERE ownerId = ?').bind(id),
      c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id),
    ]);

    auditLog('USER_DELETED_BY_ADMIN', { userId: id, name: user.name, email: user.email, adminUsername: c.get('admin').username });
    return c.json({ message: 'User deleted successfully.' });
  } catch (error) {
    logger.error('Delete user error', { error: error.message });
    return c.json({ message: 'Failed to delete user.' }, 500);
  }
});
```

Ensure `DELETE /api/admin/staff/:id` cleans up `lab_orders.assigned_staff_id` and `staff_attendance` before deleting `staff`:
```javascript
// DELETE /api/admin/staff/:id -- delete staff account
admin.delete('/staff/:id', verifyAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const row = await c.env.DB.prepare(
      'SELECT id, username FROM staff WHERE id = ?'
    ).bind(id).first();
    if (!row) return c.json({ message: 'Staff not found.' }, 404);

    // ponytail: clean up assigned orders, attendance records, and staff account
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE lab_orders SET assigned_staff_id = NULL WHERE assigned_staff_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM staff_attendance WHERE staff_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM staff WHERE id = ?').bind(id),
    ]);
    auditLog('STAFF_DELETED', { staffId: id, username: row.username });
    return c.json({ message: 'Staff account deleted.' });
  } catch (err) {
    logger.error('Failed to delete staff', { error: err.message });
    return c.json({ message: 'Failed to delete staff account.' }, 500);
  }
});
```

- [ ] **Step 4: Run tests to verify backend changes**

Run:
```powershell
npm test --prefix backend
```
Expected: PASS.

- [ ] **Step 5: Commit backend deletion hardening**

```bash
git add backend/src/routes/admin.js backend/test/deletion.test.js
git commit -m "fix(backend): verify and harden dentist and staff batch deletion in D1"
```

---

### Task 2: Un-gate Dentist Deletion on Dentist Cards (Desktop, Mobile & ListView)

**Files:**
- Modify: `frontend/src/admin/AdminDashboard.jsx:1040-1056`
- Modify: `frontend/src/views/mobile/MobileAdminDashboard.jsx:820-836`
- Modify: `frontend/src/admin/views/AdminDentistsListView.jsx:220-255`

**Interfaces:**
- Consumes: `user.status` ('pending' | 'approved' | 'rejected'), `handleDelete(uId, user.name)`, `handleApprove(uId, user.name)`, `handleReject(uId, user.name)`
- Produces: Visible Delete button on **all** dentist cards regardless of status (matching staff cards behavior)

- [ ] **Step 1: Update frontend/src/admin/AdminDashboard.jsx**

Replace lines 1042-1056:
```jsx
{/* Inline action buttons based on status */}
<div className="ad-card-actions" onClick={e => e.stopPropagation()}>
  {user.status === 'pending' && (
    <button className="ad-card-action-btn ad-action-approve" onClick={() => handleApprove(uId, user.name)} title="Approve">
      {Ico.check(14)} Accept
    </button>
  )}
  {user.status === 'pending' && (
    <button className="ad-card-action-btn ad-action-reject" onClick={() => handleReject(uId, user.name)} title="Reject">
      {Ico.x(14)} Reject
    </button>
  )}
  {user.status === 'approved' && (
    <button className="ad-card-action-btn ad-action-reject" onClick={() => handleReject(uId, user.name)} title="Revoke Approval">
      {Ico.x(14)} Reject
    </button>
  )}
  {user.status === 'rejected' && (
    <button className="ad-card-action-btn ad-action-approve" onClick={() => handleApprove(uId, user.name)} title="Approve">
      {Ico.check(14)} Accept
    </button>
  )}
  <button className="ad-card-action-btn ad-action-delete" onClick={() => handleDelete(uId, user.name)} title="Delete Dentist">
    {Ico.trash(14)}
  </button>
</div>
```

- [ ] **Step 2: Update frontend/src/views/mobile/MobileAdminDashboard.jsx**

Apply the same un-gating on mobile cards (lines 820-836):
```jsx
{/* Inline action buttons based on status */}
<div className="ma-card-actions" onClick={e => e.stopPropagation()}>
  {user.status === 'pending' && (
    <button className="ma-card-action-btn ma-action-approve" onClick={() => handleApprove(uId, user.name)}>
      {Ico.check(14)} Accept
    </button>
  )}
  {user.status === 'pending' && (
    <button className="ma-card-action-btn ma-action-reject" onClick={() => handleReject(uId, user.name)}>
      {Ico.x(14)} Reject
    </button>
  )}
  {user.status === 'approved' && (
    <button className="ma-card-action-btn ma-action-reject" onClick={() => handleReject(uId, user.name)} title="Revoke Approval">
      {Ico.x(14)} Reject
    </button>
  )}
  {user.status === 'rejected' && (
    <button className="ma-card-action-btn ma-action-approve" onClick={() => handleApprove(uId, user.name)}>
      {Ico.check(14)} Accept
    </button>
  )}
  <button className="ma-card-action-btn ma-action-delete" onClick={() => handleDelete(uId, user.name)}>
    {Ico.trash(14)}
  </button>
</div>
```

- [ ] **Step 3: Update frontend/src/admin/views/AdminDentistsListView.jsx**

Apply the same un-gating in `AdminDentistsListView.jsx` (lines 222-254) so the component maintains consistent behavior.

- [ ] **Step 4: Verify frontend builds without syntax or type errors**

Run:
```powershell
npm run build --prefix frontend
```
Expected: PASS.

- [ ] **Step 5: Commit un-gated dentist cards**

```bash
git add frontend/src/admin/AdminDashboard.jsx frontend/src/views/mobile/MobileAdminDashboard.jsx frontend/src/admin/views/AdminDentistsListView.jsx
git commit -m "fix(admin): enable delete button on all dentist cards regardless of status"
```

---

### Task 3: Refactor DentistDetailModal to Eliminate Nested Confirm Dialog Collision

**Files:**
- Modify: `frontend/src/admin/DentistDetailModal.jsx:52,61,350-391`
- Modify: `frontend/src/admin/AdminDashboard.jsx:1367-1379`
- Modify: `frontend/src/views/mobile/MobileAdminDashboard.jsx:1675-1685`

**Interfaces:**
- Consumes: `onDelete(userId, userName)` passed from `AdminDashboard` and `MobileAdminDashboard`
- Produces: Clean modal dismissal followed by parent `handleDelete` invocation, eliminating conflicting double `useBackNavigation` history pushes

- [ ] **Step 1: Update DentistDetailModal.jsx**

1. Update props signature: `const DentistDetailModal = ({ userId, onClose, onDeleteUser, onDelete }) => {`
2. Remove local `const [confirmConfig, setConfirmConfig] = useState(null);` and the nested `<ConfirmDialog isOpen={!!confirmConfig} {...confirmConfig} />`.
3. In the danger zone button:
```jsx
{/* ── Delete Dentist Account ────────────────────────────── */}
<div className="ddm-danger-zone">
  <button
    type="button"
    className="ddm-delete-user-btn"
    onClick={() => {
      const userName = user?.name || 'this dentist';
      onClose(); // Close the detail modal first to clean up its history popstate
      if (onDelete) {
        onDelete(userId, userName);
      } else {
        onDeleteUser?.(userId, userName);
      }
    }}
  >
    {Ico.trash(14)} Delete Dentist Account
  </button>
</div>
```

- [ ] **Step 2: Update DentistDetailModal rendering in AdminDashboard.jsx**

In `AdminDashboard.jsx`:
```jsx
{selectedUserId && (
  <DentistDetailModal
    userId={selectedUserId}
    onClose={() => setSelectedUserId(null)}
    onDelete={(uId, uName) => {
      setSelectedUserId(null);
      handleDelete(uId, uName);
    }}
    onDeleteUser={() => {
      fetchUsers();
      fetchStats();
      fetchAllOrders();
      fetchPayments();
      if (drillDentistOrders?._id === selectedUserId) setDrillDentistOrders(null);
    }}
  />
)}
```

- [ ] **Step 3: Update DentistDetailModal rendering in MobileAdminDashboard.jsx**

In `MobileAdminDashboard.jsx`:
```jsx
{selectedUserId && (
  <DentistDetailModal
    userId={selectedUserId}
    onClose={() => setSelectedUserId(null)}
    onDelete={(uId, uName) => {
      setSelectedUserId(null);
      handleDelete(uId, uName);
    }}
    onDeleteUser={() => {
      fetchUsers();
      fetchStats();
      fetchAllOrders();
      fetchPayments();
    }}
  />
)}
```

- [ ] **Step 4: Verify frontend build passes**

Run:
```powershell
npm run build --prefix frontend
```
Expected: PASS.

- [ ] **Step 5: Commit modal refactoring**

```bash
git add frontend/src/admin/DentistDetailModal.jsx frontend/src/admin/AdminDashboard.jsx frontend/src/views/mobile/MobileAdminDashboard.jsx
git commit -m "fix(modal): delegate dentist deletion to parent root confirm dialog to avoid history pop collision"
```

---

### Task 4: Staff Management UI State Cleanup on Deletion

**Files:**
- Modify: `frontend/src/admin/StaffManagementView.jsx:100-118`

**Interfaces:**
- Consumes: `handleDeleteStaff(staff)`
- Produces: Deletes staff member via `DELETE /api/admin/staff/:id`, clears `attendanceStaff` and `editStaff` if matching, refreshes staff list

- [ ] **Step 1: Update handleDeleteStaff in StaffManagementView.jsx**

In `frontend/src/admin/StaffManagementView.jsx`:
```javascript
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
        if (res.ok) {
          showToast(data.message || 'Staff deleted.');
          if (attendanceStaff?.id === staff.id) setAttendanceStaff(null);
          if (editStaff?.id === staff.id) setEditStaff(null);
          fetchStaff();
        } else {
          showToast(data.message || 'Failed to delete staff account.', 'error');
        }
      } catch {
        showToast('Network error', 'error');
      }
      setConfirmConfig(null);
    },
    onCancel: () => setConfirmConfig(null),
  });
};
```

- [ ] **Step 2: Run backend test suite**

Run:
```powershell
npm test --prefix backend
```
Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run:
```powershell
npm run build --prefix frontend
```
Expected: PASS.

- [ ] **Step 4: Commit staff state cleanup**

```bash
git add frontend/src/admin/StaffManagementView.jsx
git commit -m "fix(staff): reset attendance and edit drawers when staff member is deleted"
```

---

### Task 5: End-to-End Verification & Cloudflare Deployment Checklist

**Files:**
- Verify: Remote D1 tables (`users`, `lab_orders`, `payments`, `staff`, `staff_attendance`)
- Verify: Backend test suite
- Verify: Frontend static build

- [ ] **Step 1: Run complete backend unit test suite**

Run:
```powershell
npm test --prefix backend
```
Expected: 119/119 tests passing.

- [ ] **Step 2: Run Cloudflare D1 foreign-key check on remote database**

Run:
```powershell
npx wrangler d1 execute dentzy-db --remote --command "PRAGMA foreign_key_check; PRAGMA foreign_keys;"
```
Expected: 0 FK check violations; foreign_keys: 1.

- [ ] **Step 3: Run full frontend static build**

Run:
```powershell
npm run build --prefix frontend
```
Expected: Static build completes with 0 errors and outputs to `/out`.

- [ ] **Step 4: Backend Deployment (if required)**

From `backend/`:
```powershell
npx wrangler deploy
```
Ensure the live Worker serves the updated endpoints with batch deletions.

- [ ] **Step 5: Final Git Status and Commit**

Verify all changes are committed and working tree is clean:
```powershell
git status
```
