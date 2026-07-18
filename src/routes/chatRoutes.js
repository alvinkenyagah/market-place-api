const express = require('express');
const { body } = require('express-validator');
const { createInquiryChat, getConversations, getChatMessages } = require('../controllers/chatController');
const { protect, restrictTo } = require('../middleware/auth');
const validateFields = require('../middleware/validateFields'); // Custom validator error handler

const router = express.Router();

router.use(protect);

router.post(
  '/inquiry',
  restrictTo('customer'),
  [
    body('serviceId').notEmpty().withMessage('Service ID is required'),
    body('description').notEmpty().withMessage('Project description is required'),

  ],
  createInquiryChat
);

router.get('/', getConversations);
router.get('/:chatId/messages', getChatMessages);

module.exports = router;