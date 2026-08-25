import express from 'express';
import { validate } from '../middleware/validate.js';
import {
  adminLoginSchema,
  rejectUserSchema,
  createOrderSchema,
  updateOrderStageSchema,
} from '../validators/adminValidators.js';
import {
  verifyAdmin,
  sseEvents,
  adminLogin,
  adminLogout,
  getMe,
  getStats,
  getUsers,
  getApprovedUsers,
  getUserById,
  approveUser,
  rejectUser,
  deleteUser,
  getOrders,
  createOrder,
  updateOrderStage,
  deleteOrder,
} from '../controllers/adminController.js';

// Re-export SSE helpers so other modules can import from routes (backward compat)
export { broadcastToAdmin, userClients } from '../controllers/adminController.js';

const router = express.Router();

// SSE — admin dashboard live events
router.get('/events',                verifyAdmin, sseEvents);

// Admin auth
router.post('/login',                validate(adminLoginSchema), adminLogin);
router.post('/logout',               adminLogout);
router.get('/me',                    verifyAdmin, getMe);

// User management
router.get('/stats',                 verifyAdmin, getStats);
router.get('/users',                 verifyAdmin, getUsers);
router.get('/users/approved',        verifyAdmin, getApprovedUsers);
router.get('/users/:id',             verifyAdmin, getUserById);
router.patch('/users/:id/approve',   verifyAdmin, approveUser);
router.patch('/users/:id/reject',    verifyAdmin, validate(rejectUserSchema), rejectUser);
router.delete('/users/:id',          verifyAdmin, deleteUser);

// Order management
router.get('/orders',                verifyAdmin, getOrders);
router.post('/orders',               verifyAdmin, validate(createOrderSchema), createOrder);
router.patch('/orders/:id/stage',    verifyAdmin, validate(updateOrderStageSchema), updateOrderStage);
router.delete('/orders/:id',         verifyAdmin, deleteOrder);

export default router;
