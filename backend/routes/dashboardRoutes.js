import express from 'express';
import verifyUser from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  createOrderSchema,
  updateOrderSchema,
  createPaymentSchema,
} from '../validators/dashboardValidators.js';
import {
  sseEvents,
  getStats,
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getPayments,
  createPayment,
  getMe,
} from '../controllers/dashboardController.js';

const router = express.Router();

// All routes require a logged-in, approved user
router.use(verifyUser);

// SSE — user dashboard live updates
router.get('/events',        sseEvents);

// Stats
router.get('/stats',         getStats);

// Orders
router.get('/orders',        getOrders);
router.post('/orders',       validate(createOrderSchema),  createOrder);
router.patch('/orders/:id',  validate(updateOrderSchema),  updateOrder);
router.delete('/orders/:id', deleteOrder);

// Payments
router.get('/payments',      getPayments);
router.post('/payments',     validate(createPaymentSchema), createPayment);

// Profile
router.get('/me',            getMe);

export default router;
