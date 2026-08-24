import express from 'express';
import verifyUser from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../validators/authValidators.js';
import {
  getCaptcha,
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/authController.js';

const router = express.Router();

router.get('/captcha',          getCaptcha);
router.post('/register',        validate(registerSchema),         register);
router.post('/login',           validate(loginSchema),            login);
router.post('/logout',          logout);
router.get('/me',               verifyUser, getMe);
router.post('/forgot-password', validate(forgotPasswordSchema),   forgotPassword);
router.put('/profile',          verifyUser, validate(updateProfileSchema),   updateProfile);
router.put('/change-password',  verifyUser, validate(changePasswordSchema),  changePassword);
router.delete('/profile',       verifyUser, validate(deleteAccountSchema),   deleteAccount);

export default router;
