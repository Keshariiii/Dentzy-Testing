import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import app from '../src/index.js';
import { hashPassword } from '../src/utils/crypto.js';

describe('Staff Role-Based Flows, Profile Lock, Department Isolation & Delivery Queue', () => {
  const staffSecret = 'test-staff-secret-key-staff-role-flows';
  const adminSecret = 'test-admin-secret-key-staff-role-flows';
  const userSecret = 'test-user-secret-key-staff-role-flows';

  const createToken = async (payload, secret = staffSecret) => {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(new TextEncoder().encode(secret));
  };

  let staffTable;
  let usersTable;
  let ordersTable;
  let deliveryTasksTable;
  let paymentsTable;
  let mockEnv;

  beforeEach(async () => {
    staffTable = new Map();
    usersTable = new Map();
    ordersTable = new Map();
    deliveryTasksTable = new Map();
    paymentsTable = new Map();

    const hashedPassword = await hashPassword('StaffPass123!');

    // 1. Ceramic production staff
    staffTable.set('staff-ceramic-1', {
      id: 'staff-ceramic-1',
      username: 'ceramic_tech',
      password: hashedPassword,
      displayName: 'Jane Ceramist',
      designation: 'Ceramic',
      employeeId: '101',
      email: 'jane.ceramic@dentzy.in',
      phone: '9876543210',
      dob: '1992-03-15',
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    });

    // 2. Acrylic production staff
    staffTable.set('staff-acrylic-1', {
      id: 'staff-acrylic-1',
      username: 'acrylic_tech',
      password: hashedPassword,
      displayName: 'Alex Acrylic',
      designation: 'Acrylic',
      employeeId: '102',
      email: 'alex.acrylic@dentzy.in',
      phone: '9876543211',
      dob: '1994-06-20',
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    });

    // 3. Receptionist staff
    staffTable.set('staff-receptionist-1', {
      id: 'staff-receptionist-1',
      username: 'reception_amy',
      password: hashedPassword,
      displayName: 'Amy FrontDesk',
      designation: 'Receptionist',
      employeeId: '103',
      email: 'amy@dentzy.in',
      phone: '9876543212',
      dob: '1996-09-10',
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    });

    // 4. Delivery rider staff
    staffTable.set('staff-delivery-1', {
      id: 'staff-delivery-1',
      username: 'rider_dave',
      password: hashedPassword,
      displayName: 'Dave Logistics',
      designation: 'Delivery',
      employeeId: '104',
      email: 'dave@dentzy.in',
      phone: '9876543213',
      dob: '1998-12-05',
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    });

    // Approved Dentist
    usersTable.set('dentist-1', {
      id: 'dentist-1',
      name: 'Dr. Smile Clinic',
      email: 'drsmile@dentzy.in',
      status: 'approved',
      clinicName: 'Smile Care Center',
      address: 'Shop 4, Bandra West, Mumbai',
      phone: '9820011223',
    });

    // Initial Orders
    ordersTable.set('order-cer-1', {
      id: 'order-cer-1',
      ownerId: 'dentist-1',
      patientName: 'Ramesh Patel',
      caseId: 'DZ-20261031-CER1',
      serviceType: 'Crown',
      restoration_type: 'Crown',
      service_category: 'Ceramic',
      assigned_department: 'Ceramic',
      assigned_staff_id: 'staff-ceramic-1',
      status: 'In Progress',
      stage: 'production',
      priority: 'Normal',
      dueDate: '2026-11-05',
      due_time: '14:00',
      notes: 'Porcelain fused to metal A2',
      teeth_data: JSON.stringify(['16', '17']),
      is_urgent: 0,
      qc_completed_at: null,
      dispatched_at: null,
      delivered_at: null,
      createdAt: '2026-10-31T08:00:00Z',
      updatedAt: '2026-10-31T08:00:00Z',
    });

    ordersTable.set('order-acr-1', {
      id: 'order-acr-1',
      ownerId: 'dentist-1',
      patientName: 'Suresh Shah',
      caseId: 'DZ-20261031-ACR1',
      serviceType: 'Denture',
      restoration_type: 'Full Denture',
      service_category: 'Acrylic',
      assigned_department: 'Acrylic',
      assigned_staff_id: 'staff-acrylic-1',
      status: 'In Progress',
      stage: 'production',
      priority: 'High',
      dueDate: '2026-11-06',
      due_time: '16:00',
      notes: 'Complete upper acrylic denture',
      teeth_data: JSON.stringify(['all']),
      is_urgent: 0,
      qc_completed_at: null,
      dispatched_at: null,
      delivered_at: null,
      createdAt: '2026-10-31T09:00:00Z',
      updatedAt: '2026-10-31T09:00:00Z',
    });

    const mockDb = {
      batch: async (statements) => {
        return statements.map(() => ({ results: [{ cnt: 0 }], meta: { changes: 1 } }));
      },
      prepare: (query) => {
        return {
          bind: (...args) => {
            return {
              first: async () => {
                // Rate limits
                if (query.includes('FROM rate_limits')) return null;

                // Staff by username
                if (query.includes('FROM staff WHERE username = ?')) {
                  const targetUser = (args[0] || '').toLowerCase();
                  for (const s of staffTable.values()) {
                    if (s.username.toLowerCase() === targetUser) return { ...s };
                  }
                  return null;
                }

                // Staff by id
                if (query.includes('FROM staff WHERE id = ?')) {
                  const s = staffTable.get(args[0]);
                  return s ? { ...s } : null;
                }

                // Staff by designation and status
                if (query.includes('FROM staff WHERE designation = ? AND status =')) {
                  const [desig] = args;
                  for (const s of staffTable.values()) {
                    if (s.designation === desig && s.status === 'active') {
                      return { id: s.id, ...s };
                    }
                  }
                  return null;
                }

                // Dentist by id
                if (query.includes('FROM users WHERE id = ?')) {
                  const u = usersTable.get(args[0]);
                  return u ? { ...u } : null;
                }

                // Debt check
                if (query.includes('SELECT COALESCE(SUM(amount),0) as totalDebt')) {
                  let total = 0;
                  for (const p of paymentsTable.values()) {
                    if (p.ownerId === args[0] && (p.status === 'Pending' || p.status === 'Overdue')) {
                      total += p.amount;
                    }
                  }
                  return { totalDebt: total };
                }

                // Order with user join
                if (query.includes('FROM lab_orders') && query.includes('JOIN users u')) {
                  const targetId = args[0];
                  let o = ordersTable.get(targetId);
                  if (!o) {
                    for (const ord of ordersTable.values()) {
                      if (ord.caseId === targetId) { o = ord; break; }
                    }
                  }
                  if (!o) return null;
                  const u = usersTable.get(o.ownerId) || {};
                  return {
                    id: o.id,
                    caseId: o.caseId,
                    patientName: o.patientName,
                    dueDate: o.dueDate,
                    notes: o.notes,
                    dentistName: u.name,
                    clinicName: u.clinicName,
                    address: u.address,
                    phone: u.phone,
                  };
                }

                // Order by id or caseId
                if (query.includes('FROM lab_orders WHERE id = ?') || query.includes('WHERE id = ? OR caseId = ?')) {
                  const targetId = args[0];
                  let o = ordersTable.get(targetId);
                  if (!o) {
                    for (const ord of ordersTable.values()) {
                      if (ord.caseId === targetId) { o = ord; break; }
                    }
                  }
                  if (!o) return null;
                  const u = usersTable.get(o.ownerId) || {};
                  return {
                    ...o,
                    dentistName: u.name,
                    clinicName: u.clinicName,
                    address: u.address,
                    phone: u.phone,
                  };
                }

                // Delivery task by order_id
                if (query.includes('FROM delivery_tasks WHERE order_id = ?')) {
                  for (const dt of deliveryTasksTable.values()) {
                    if (dt.order_id === args[0]) return { ...dt };
                  }
                  return null;
                }

                // App settings
                if (query.includes('FROM app_settings WHERE key = ?')) {
                  return null;
                }

                return null;
              },
              all: async () => {
                // GET /api/staff/orders
                if (query.includes('FROM lab_orders o') && query.includes('LEFT JOIN users u') && !query.includes('delivery_tasks')) {
                  let list = Array.from(ordersTable.values());

                  // Department filter: AND (o.assigned_department = ? OR o.assigned_staff_id = ?)
                  if (query.includes('o.assigned_department = ? OR o.assigned_staff_id = ?')) {
                    const dept = args[0];
                    const stId = args[1];
                    list = list.filter(o => o.assigned_department === dept || o.assigned_staff_id === stId);
                  }

                  // TaskView filter: AND o.stage IN ('received', 'design', 'production') AND o.status NOT IN ('Completed', 'Cancelled')
                  if (query.includes("o.stage IN ('received', 'design', 'production')")) {
                    list = list.filter(o => ['received', 'design', 'production'].includes(o.stage) && !['Completed', 'Cancelled'].includes(o.status));
                  }

                  // Mine filter: AND o.assigned_staff_id = ?
                  if (query.includes('AND o.assigned_staff_id = ?') && !query.includes('o.assigned_department = ?')) {
                    const staffIdIdx = query.includes('o.assigned_department = ?') ? 2 : 0;
                    list = list.filter(o => o.assigned_staff_id === args[staffIdIdx]);
                  }

                  return {
                    results: list.map(o => {
                      const u = usersTable.get(o.ownerId) || {};
                      const p = paymentsTable.get(o.caseId) || { amount: 1500, status: 'Pending' };
                      return {
                        ...o,
                        ownerName: u.name || '',
                        ownerClinicName: u.clinicName || '',
                        ownerAddress: u.address || '',
                        ownerPhone: u.phone || '',
                        amount: p.amount,
                        paymentAmount: p.amount,
                        paymentStatus: p.status,
                        paymentMode: p.paymentMode || '',
                        referenceNumber: p.referenceNumber || '',
                        batchId: p.batchId || '',
                        paidAt: p.paidAt || null,
                      };
                    }),
                  };
                }

                // GET /api/staff/deliveries
                if (query.includes('FROM lab_orders o') && query.includes('delivery_tasks dt')) {
                  const list = Array.from(ordersTable.values()).filter(o =>
                    ['qc', 'dispatched', 'completed'].includes(o.stage)
                  );

                  return {
                    results: list.map(o => {
                      const u = usersTable.get(o.ownerId) || {};
                      let dt = null;
                      for (const t of deliveryTasksTable.values()) {
                        if (t.order_id === o.id) { dt = t; break; }
                      }
                      return {
                        ...o,
                        dentistName: u.name || '',
                        clinicName: u.clinicName || '',
                        deliveryAddress: dt?.address || u.address || '',
                        contactPhone: dt?.contact_phone || u.phone || '',
                        taskStatus: dt?.status || null,
                        deliveryNotes: dt?.notes || '',
                        rider_id: dt?.rider_id || null,
                        completed_at: dt?.completed_at || null,
                      };
                    }),
                  };
                }

                return { results: [] };
              },
              run: async () => {
                // UPDATE staff SET displayName = ?, email = ?, phone = ?, dob = ?, updatedAt = ? WHERE id = ?
                if (query.includes('UPDATE staff SET displayName = ?')) {
                  const [displayName, email, phone, dob, ts, id] = args;
                  const s = staffTable.get(id);
                  if (s) {
                    staffTable.set(id, {
                      ...s,
                      displayName: displayName || s.displayName,
                      email: email || s.email,
                      phone: phone || s.phone,
                      dob: dob || s.dob,
                      updatedAt: ts,
                    });
                    return { meta: { changes: 1 } };
                  }
                  return { meta: { changes: 0 } };
                }

                // UPDATE lab_orders (stage / status update)
                if (query.includes('UPDATE lab_orders SET')) {
                  // Find id at end of args
                  const id = args[args.length - 1];
                  const o = ordersTable.get(id);
                  if (o) {
                    if (query.includes("stage = 'dispatched'")) {
                      o.stage = 'dispatched';
                      o.status = 'In Progress';
                      o.dispatched_at = args[0];
                      o.updatedAt = args[1];
                    } else if (query.includes("stage = 'completed'")) {
                      o.stage = 'completed';
                      o.status = 'Completed';
                      o.delivered_at = args[0];
                      o.updatedAt = args[1];
                    } else {
                      if (query.includes('stage = ?')) o.stage = args[0];
                      if (query.includes('status = ?')) o.status = args[1];
                      if (query.includes('assigned_staff_id = ?')) o.assigned_staff_id = args[2];
                      if (query.includes('qc_completed_at = ?')) o.qc_completed_at = args[args.indexOf(id) - 1];
                      if (query.includes('dispatched_at = ?')) o.dispatched_at = args[args.indexOf(id) - 1];
                      if (query.includes('delivered_at = ?')) o.delivered_at = args[args.indexOf(id) - 1];
                      o.updatedAt = args[3] || new Date().toISOString();
                    }
                    return { meta: { changes: 1 } };
                  }
                  return { meta: { changes: 0 } };
                }

                // INSERT INTO lab_orders
                if (query.includes('INSERT INTO lab_orders')) {
                  const [
                    id, ownerId, patientName, caseId, serviceType,
                    dueDate, notes, priority, createdBy, teeth_data, restoration_type,
                    service_category, is_urgent, assigned_department, assigned_staff_id,
                    createdAt, updatedAt
                  ] = args;
                  ordersTable.set(id, {
                    id, ownerId, patientName, caseId, serviceType,
                    status: 'Pending', stage: 'received', dueDate, notes, priority,
                    createdBy, teeth_data, restoration_type, service_category,
                    is_urgent, assigned_department, assigned_staff_id, createdAt, updatedAt,
                    qc_completed_at: null, dispatched_at: null, delivered_at: null,
                  });
                  return { meta: { changes: 1 } };
                }

                // INSERT INTO delivery_tasks
                if (query.includes('INSERT INTO delivery_tasks')) {
                  if (args.length === 12) {
                    const [
                      id, order_id, clinic_name, address,
                      contact_phone, patient_name, case_id, notes,
                      created_at, updated_at, dentist_name, due_date
                    ] = args;
                    deliveryTasksTable.set(id, {
                      id, order_id, rider_id: null, status: 'assigned', clinic_name, address,
                      contact_phone, patient_name, case_id, notes,
                      completed_at: null, created_at, updated_at, dentist_name, due_date
                    });
                  } else if (args.length === 14) {
                    const [
                      id, order_id, rider_id, status, clinic_name, address,
                      contact_phone, patient_name, case_id, notes,
                      created_at, updated_at, dentist_name, due_date
                    ] = args;
                    deliveryTasksTable.set(id, {
                      id, order_id, rider_id, status, clinic_name, address,
                      contact_phone, patient_name, case_id, notes,
                      completed_at: null, created_at, updated_at, dentist_name, due_date
                    });
                  } else if (args.length === 15) {
                    const [
                      id, order_id, rider_id, status, clinic_name, address,
                      contact_phone, patient_name, case_id, notes,
                      completed_at, created_at, updated_at, dentist_name, due_date
                    ] = args;
                    deliveryTasksTable.set(id, {
                      id, order_id, rider_id, status, clinic_name, address,
                      contact_phone, patient_name, case_id, notes,
                      completed_at, created_at, updated_at, dentist_name, due_date
                    });
                  } else {
                    const [
                      id, order_id, clinic_name, address,
                      contact_phone, patient_name, case_id, notes,
                      created_at, updated_at, dentist_name, due_date
                    ] = args;
                    deliveryTasksTable.set(id, {
                      id, order_id, rider_id: null, status: 'assigned', clinic_name, address,
                      contact_phone, patient_name, case_id, notes,
                      completed_at: null, created_at, updated_at, dentist_name, due_date
                    });
                  }
                  return { meta: { changes: 1 } };
                }

                // UPDATE delivery_tasks
                if (query.includes('UPDATE delivery_tasks')) {
                  const id = args[args.length - 1];
                  // If id is task id
                  let task = deliveryTasksTable.get(id);
                  if (!task) {
                    // Might be WHERE order_id = ?
                    for (const dt of deliveryTasksTable.values()) {
                      if (dt.order_id === id) { task = dt; break; }
                    }
                  }
                  if (task) {
                    if (query.includes("status = 'assigned'")) task.status = 'assigned';
                    if (query.includes("status = 'in_progress'")) task.status = 'in_progress';
                    if (query.includes("status = 'completed'")) task.status = 'completed';
                    if (query.includes('rider_id = ?')) task.rider_id = args[query.includes('completed_at') ? 1 : 0];
                    if (query.includes('completed_at = ?')) task.completed_at = args[0];
                    if (query.includes('notes = ?')) task.notes = args[query.includes('completed_at') ? 2 : 1];
                    return { meta: { changes: 1 } };
                  }
                  return { meta: { changes: 0 } };
                }

                // INSERT INTO payments
                if (query.includes('INSERT INTO payments')) {
                  const [id, ownerId, patientName, caseId, invoiceNumber, amount] = args;
                  paymentsTable.set(caseId, { id, ownerId, patientName, caseId, invoiceNumber, amount, status: 'Pending' });
                  return { meta: { changes: 1 } };
                }

                return { meta: { changes: 1 } };
              },
            };
          },
          all: async () => {
            if (query.includes('FROM lab_orders o') && query.includes('delivery_tasks dt')) {
              const list = Array.from(ordersTable.values()).filter(o =>
                ['qc', 'dispatched', 'completed'].includes(o.stage)
              );
              return {
                results: list.map(o => {
                  const u = usersTable.get(o.ownerId) || {};
                  let dt = null;
                  for (const t of deliveryTasksTable.values()) {
                    if (t.order_id === o.id) { dt = t; break; }
                  }
                  return {
                    ...o,
                    dentistName: u.name || '',
                    clinicName: u.clinicName || '',
                    deliveryAddress: dt?.address || u.address || '',
                    contactPhone: dt?.contact_phone || u.phone || '',
                    taskStatus: dt?.status || null,
                    deliveryNotes: dt?.notes || '',
                    rider_id: dt?.rider_id || null,
                    completed_at: dt?.completed_at || null,
                  };
                }),
              };
            }
            return { results: [] };
          },
          first: async () => null,
          run: async () => ({ meta: { changes: 1 } }),
        };
      },
    };

    mockEnv = {
      DB: mockDb,
      STAFF_JWT_SECRET: staffSecret,
      ADMIN_JWT_SECRET: adminSecret,
      JWT_SECRET: userSecret,
      ALLOWED_ORIGINS: 'http://localhost:3000',
    };
  });

  describe('1. Staff Profile Lock & Retrieval Integrity', () => {
    it('POST /api/staff/login returns token and full staff profile with employeeId and status', async () => {
      const res = await app.request('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'ceramic_tech',
          password: 'StaffPass123!',
        }),
      }, mockEnv);

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.token, 'token must be returned in response body');
      assert.equal(data.staff.username, 'ceramic_tech');
      assert.equal(data.staff.displayName, 'Jane Ceramist');
      assert.equal(data.staff.designation, 'Ceramic');
      assert.equal(data.staff.employeeId, '101');
      assert.equal(data.staff.email, 'jane.ceramic@dentzy.in');
      assert.equal(data.staff.phone, '9876543210');
      assert.equal(data.staff.dob, '1992-03-15');
      assert.equal(data.staff.status, 'active');
      assert.equal(data.staff.role, 'staff');
    });

    it('GET /api/staff/me returns full profile including employeeId', async () => {
      const token = await createToken({ id: 'staff-ceramic-1', role: 'staff', username: 'ceramic_tech' });
      const res = await app.request('/api/staff/me', {
        headers: { Cookie: `dentzy_staff_jwt=${token}` },
      }, mockEnv);

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.staff.id, 'staff-ceramic-1');
      assert.equal(data.staff.employeeId, '101');
      assert.equal(data.staff.designation, 'Ceramic');
      assert.equal(data.staff.role, 'staff');
    });

    it('PUT /api/staff/profile updates contact fields but rejects mutations to username, employeeId, designation, status', async () => {
      const token = await createToken({ id: 'staff-ceramic-1', role: 'staff', username: 'ceramic_tech' });
      const res = await app.request('/api/staff/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${token}`,
        },
        body: JSON.stringify({
          displayName: 'Jane Updated',
          email: 'jane.new@dentzy.in',
          phone: '9999988888',
          dob: '1992-04-01',
          // Malicious / illegal tamper attempts:
          username: 'super_hacker',
          employeeId: '999',
          designation: 'CEO',
          status: 'inactive',
        }),
      }, mockEnv);

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.staff.displayName, 'Jane Updated');
      assert.equal(data.staff.email, 'jane.new@dentzy.in');
      assert.equal(data.staff.phone, '9999988888');
      assert.equal(data.staff.dob, '1992-04-01');

      // Locked fields must remain unaltered
      assert.equal(data.staff.username, 'ceramic_tech');
      assert.equal(data.staff.employeeId, '101');
      assert.equal(data.staff.designation, 'Ceramic');
      assert.equal(data.staff.status, 'active');

      // Check DB directly
      const dbStaff = staffTable.get('staff-ceramic-1');
      assert.equal(dbStaff.username, 'ceramic_tech');
      assert.equal(dbStaff.employeeId, '101');
      assert.equal(dbStaff.designation, 'Ceramic');
      assert.equal(dbStaff.status, 'active');
    });
  });

  describe('2. Department Isolation & Order Creation Routing', () => {
    it('Production staff member with designation Ceramic sees only ceramic orders in GET /api/staff/orders', async () => {
      const token = await createToken({
        id: 'staff-ceramic-1',
        role: 'staff',
        username: 'ceramic_tech',
        designation: 'Ceramic',
      });

      const res = await app.request('/api/staff/orders', {
        headers: { Cookie: `dentzy_staff_jwt=${token}` },
      }, mockEnv);

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.orders));
      assert.equal(data.orders.length, 1);
      assert.equal(data.orders[0].id, 'order-cer-1');
      assert.equal(data.orders[0].assigned_department, 'Ceramic');
      assert.equal(data.orders[0].restoration_type, 'Crown');
      assert.equal(data.orders[0].service_category, 'Ceramic');
      assert.equal(data.orders[0].owner.address, 'Shop 4, Bandra West, Mumbai');
      assert.equal(data.orders[0].owner.phone, '9820011223');
    });

    it('GET /api/staff/orders with taskView=pending returns only pending production cases', async () => {
      // Add a completed order
      ordersTable.set('order-cer-completed', {
        id: 'order-cer-completed',
        ownerId: 'dentist-1',
        patientName: 'Closed Case',
        caseId: 'DZ-20261031-CER9',
        serviceType: 'Crown',
        assigned_department: 'Ceramic',
        assigned_staff_id: 'staff-ceramic-1',
        status: 'Completed',
        stage: 'completed',
        priority: 'Normal',
        createdAt: '2026-10-30T00:00:00Z',
        updatedAt: '2026-10-30T00:00:00Z',
      });

      const token = await createToken({
        id: 'staff-ceramic-1',
        role: 'staff',
        username: 'ceramic_tech',
        designation: 'Ceramic',
      });

      const res = await app.request('/api/staff/orders?taskView=pending', {
        headers: { Cookie: `dentzy_staff_jwt=${token}` },
      }, mockEnv);

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.orders.length, 1);
      assert.equal(data.orders[0].id, 'order-cer-1');
    });

    it('POST /api/staff/orders infers department and auto-assigns active staff in that department', async () => {
      const recepToken = await createToken({
        id: 'staff-receptionist-1',
        role: 'staff',
        username: 'reception_amy',
        designation: 'Receptionist',
      });

      const res = await app.request('/api/staff/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${recepToken}`,
        },
        body: JSON.stringify({
          dentistId: 'dentist-1',
          patientName: 'Kavita Verma',
          serviceType: 'Denture',
          service_category: 'Acrylic Prosthetics',
          priority: 'High',
          dueDate: '2026-11-08',
          amount: 3500,
          notes: 'Upper acrylic partial',
        }),
      }, mockEnv);

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.message, 'Order created successfully.');
      assert.equal(data.order.patientName, 'Kavita Verma');
      assert.equal(data.order.assigned_department, 'Acrylic');
      assert.equal(data.order.assigned_staff_id, 'staff-acrylic-1');
    });
  });

  describe('3. Production Stage Advancement & Delivery Task Lifecycle', () => {
    it('Advancing stage to qc in PATCH /api/staff/orders/:id/stage sets qc_completed_at and auto-creates a delivery task', async () => {
      const token = await createToken({
        id: 'staff-ceramic-1',
        role: 'staff',
        username: 'ceramic_tech',
        designation: 'Ceramic',
      });

      const res = await app.request('/api/staff/orders/order-cer-1/stage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${token}`,
        },
        body: JSON.stringify({ stage: 'qc' }),
      }, mockEnv);

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.stage, 'qc');
      assert.equal(body.status, 'In Progress');

      // Verify order has qc_completed_at timestamp
      const order = ordersTable.get('order-cer-1');
      assert.equal(order.stage, 'qc');
      assert.ok(order.qc_completed_at, 'qc_completed_at must be set');

      // Verify delivery_tasks record was created
      let task = null;
      for (const dt of deliveryTasksTable.values()) {
        if (dt.order_id === 'order-cer-1') { task = dt; break; }
      }
      assert.ok(task, 'Delivery task must exist in delivery_tasks table');
      assert.equal(task.status, 'assigned');
      assert.equal(task.clinic_name, 'Smile Care Center');
      assert.equal(task.address, 'Shop 4, Bandra West, Mumbai');
      assert.equal(task.contact_phone, '9820011223');
      assert.equal(task.patient_name, 'Ramesh Patel');
      assert.equal(task.case_id, 'DZ-20261031-CER1');
      assert.equal(task.dentist_name, 'Dr. Smile Clinic');
      assert.equal(task.due_date, '2026-11-05');
    });

    it('GET /api/staff/deliveries returns post-QC orders with WHAT, WHERE, WHEN details and human status', async () => {
      // First advance order-cer-1 to qc
      ordersTable.get('order-cer-1').stage = 'qc';
      ordersTable.get('order-cer-1').qc_completed_at = '2026-10-31T11:00:00Z';
      deliveryTasksTable.set('dt-1', {
        id: 'dt-1',
        order_id: 'order-cer-1',
        rider_id: null,
        status: 'assigned',
        clinic_name: 'Smile Care Center',
        address: 'Shop 4, Bandra West, Mumbai',
        contact_phone: '9820011223',
        patient_name: 'Ramesh Patel',
        case_id: 'DZ-20261031-CER1',
        notes: 'Handle with care',
        completed_at: null,
        created_at: '2026-10-31T11:00:00Z',
        updated_at: '2026-10-31T11:00:00Z',
        dentist_name: 'Dr. Smile Clinic',
        due_date: '2026-11-05',
      });

      const token = await createToken({
        id: 'staff-delivery-1',
        role: 'staff',
        username: 'rider_dave',
        designation: 'Delivery',
      });

      const res = await app.request('/api/staff/deliveries', {
        headers: { Cookie: `dentzy_staff_jwt=${token}` },
      }, mockEnv);

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.deliveries));
      assert.equal(data.deliveries.length, 1);

      const d = data.deliveries[0];
      // WHAT
      assert.equal(d.patientName, 'Ramesh Patel');
      assert.equal(d.caseId, 'DZ-20261031-CER1');
      assert.equal(d.serviceType, 'Crown');
      assert.equal(d.restoration_type, 'Crown');
      // WHERE
      assert.equal(d.clinicName, 'Smile Care Center');
      assert.equal(d.dentistName, 'Dr. Smile Clinic');
      assert.equal(d.deliveryAddress, 'Shop 4, Bandra West, Mumbai');
      assert.equal(d.contactPhone, '9820011223');
      // WHEN
      assert.equal(d.dueDate, '2026-11-05');
      assert.equal(d.qc_completed_at, '2026-10-31T11:00:00Z');
      // Human status
      assert.equal(d.deliveryStatus, 'Ready for Pickup (QC Passed)');
    });

    it('PATCH /api/staff/deliveries/:orderId/status updates delivery dispatch and completion lifecycle', async () => {
      // Set up order-cer-1 in qc stage with task
      ordersTable.get('order-cer-1').stage = 'qc';
      ordersTable.get('order-cer-1').qc_completed_at = '2026-10-31T11:00:00Z';
      deliveryTasksTable.set('dt-1', {
        id: 'dt-1',
        order_id: 'order-cer-1',
        rider_id: null,
        status: 'assigned',
        clinic_name: 'Smile Care Center',
        address: 'Shop 4, Bandra West, Mumbai',
        contact_phone: '9820011223',
        patient_name: 'Ramesh Patel',
        case_id: 'DZ-20261031-CER1',
        notes: '',
        completed_at: null,
        created_at: '2026-10-31T11:00:00Z',
        updated_at: '2026-10-31T11:00:00Z',
        dentist_name: 'Dr. Smile Clinic',
        due_date: '2026-11-05',
      });

      const riderToken = await createToken({
        id: 'staff-delivery-1',
        role: 'staff',
        username: 'rider_dave',
        designation: 'Delivery',
      });

      // 1. Mark as dispatched / in_progress
      const dispatchRes = await app.request('/api/staff/deliveries/order-cer-1/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${riderToken}`,
        },
        body: JSON.stringify({
          status: 'in_progress',
          notes: 'Picked up from lab, on route',
        }),
      }, mockEnv);

      assert.equal(dispatchRes.status, 200);
      const dispatchData = await dispatchRes.json();
      assert.equal(dispatchData.stage, 'dispatched');
      assert.equal(dispatchData.deliveryStatus, 'Out for Delivery');

      const dispatchedOrder = ordersTable.get('order-cer-1');
      assert.equal(dispatchedOrder.stage, 'dispatched');
      assert.equal(dispatchedOrder.status, 'In Progress');
      assert.ok(dispatchedOrder.dispatched_at, 'dispatched_at timestamp must be recorded');

      const dispatchedTask = deliveryTasksTable.get('dt-1');
      assert.equal(dispatchedTask.status, 'in_progress');
      assert.equal(dispatchedTask.rider_id, 'staff-delivery-1');

      // 2. Mark as completed
      const completeRes = await app.request('/api/staff/deliveries/order-cer-1/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `dentzy_staff_jwt=${riderToken}`,
        },
        body: JSON.stringify({
          status: 'completed',
          notes: 'Delivered to Dr. Smile receptionist',
        }),
      }, mockEnv);

      assert.equal(completeRes.status, 200);
      const completeData = await completeRes.json();
      assert.equal(completeData.stage, 'completed');
      assert.equal(completeData.deliveryStatus, 'Delivered');

      const completedOrder = ordersTable.get('order-cer-1');
      assert.equal(completedOrder.stage, 'completed');
      assert.equal(completedOrder.status, 'Completed');
      assert.ok(completedOrder.delivered_at, 'delivered_at timestamp must be recorded');

      const completedTask = deliveryTasksTable.get('dt-1');
      assert.equal(completedTask.status, 'completed');
      assert.ok(completedTask.completed_at, 'completed_at must be recorded on task');
    });
  });
});
