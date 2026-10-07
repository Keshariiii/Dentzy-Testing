# Dentist Detail Modal Runtime Crash Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the runtime React crash (`ReferenceError: confirmConfig is not defined`) occurring when clicking any dentist card in the admin dashboard, causing the global error boundary (`error.jsx`, "We hit a technical issue") to render.

**Architecture:** Ponytail-minimalist ladder fix:
- In [DentistDetailModal.jsx](file:///c:/Dentzy%20Testing/frontend/src/admin/DentistDetailModal.jsx#L171), remove the undeclared identifier `!confirmConfig` and set `closeOnEscape={true}` directly on `<BaseModal>`.
- In `handleDeleteOrder` within [DentistDetailModal.jsx](file:///c:/Dentzy%20Testing/frontend/src/admin/DentistDetailModal.jsx#L140-L162), replace the undeclared `setConfirmConfig` calls with native `window.confirm` (Ponytail Ladder Rung 4: Native platform feature).
- Verify compilation with `npm run build` in `frontend/`.

**Tech Stack:** Next.js 14/15, React 18, BaseModal.

**Spec:** Fix runtime ReferenceError in DentistDetailModal causing "We hit a technical issue" error screen.

---

## Global Constraints
- Apply Ponytail rules: deletion over addition, zero new abstractions, minimal diff (touch only the broken lines in `DentistDetailModal.jsx`).
- No undeclared identifiers in render scope.
- Frontend static build (`npm run build`) must pass cleanly.

---

### Task 1: Eliminate Undeclared confirmConfig References in DentistDetailModal.jsx

**Files:**
- Modify: `frontend/src/admin/DentistDetailModal.jsx:140-175`

**Root Cause:**
- Line 171 evaluates `closeOnEscape={!confirmConfig}` during JSX render. Because `confirmConfig` state was removed during the previous refactoring, this throws `ReferenceError: confirmConfig is not defined` whenever `<DentistDetailModal>` mounts upon clicking any dentist card.
- Lines 141, 147, 158, 160 call `setConfirmConfig(...)`, which is also undeclared.

- [ ] **Step 1: Update handleDeleteOrder and closeOnEscape in DentistDetailModal.jsx**

Replace lines 140-174 in `frontend/src/admin/DentistDetailModal.jsx`:
```javascript
  /* ── Delete order ─────────────────────────────────────────────────────── */
  const handleDeleteOrder = async (orderId, caseId) => {
    if (!window.confirm(`Are you sure you want to delete order ${caseId}? This cannot be undone.`)) return;
    try {
      const res = await authFetch(`${ADMIN_API}/orders/${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.filter(o => (o._id || o.id) !== orderId));
        showToast('Order deleted successfully.');
      } else {
        showToast(data.message || 'Failed to delete order', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <>
      <BaseModal
        isOpen={Boolean(userId)}
        onClose={onClose}
        maxWidth="max-w-3xl"
        className="ddm-panel-wrap"
        closeOnEscape={true}
        raw={true}
        id={`dentist-${userId}`}
      >
```

- [ ] **Step 2: Verify zero remaining references to confirmConfig in DentistDetailModal.jsx**

Run a grep/check on `frontend/src/admin/DentistDetailModal.jsx` to confirm 0 instances of `confirmConfig`.

- [ ] **Step 3: Run frontend production build**

Run:
```powershell
npm run build --prefix frontend
```
Expected: PASS (15/15 static pages exported).

- [ ] **Step 4: Commit and push the fix**

```bash
git add frontend/src/admin/DentistDetailModal.jsx docs/superpowers/plans/2026-10-07-fix-dentist-detail-modal-runtime-error.md
git commit -m "fix(admin): resolve ReferenceError confirmConfig in DentistDetailModal"
git push origin main
```
