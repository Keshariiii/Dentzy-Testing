import express from 'express';
import { validate } from '../middleware/validate.js';
import { submitContactSchema } from '../validators/contactValidators.js';
import { submitContact } from '../controllers/contactController.js';

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit a contact form
// @access  Public
router.post('/', validate(submitContactSchema), submitContact);

export default router;
