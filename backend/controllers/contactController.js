import Contact from '../models/Contact.js';
import logger from '../utils/logger.js';

// @desc    Submit a contact form
// @access  Public
// Body is pre-validated by Zod (submitContactSchema)
export const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const savedContact = await Contact.create({ name, email, phone, subject, message });

    logger.info('Contact form submitted', { contactId: savedContact._id });

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully'
    });

  } catch (error) {
    logger.error('Error saving contact form', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Server Error. Could not submit contact form.'
    });
  }
};
