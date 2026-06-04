const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Service = require('../models/Service');

// POST /api/chats/inquiry — Customer submits structured inquiry
exports.createInquiryChat = async (req, res, next) => {
  try {
    const { serviceId, description, budget, deadline } = req.body;
    const customerId = req.user._id;

    // 1. Validate service
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not found or inactive.' });
    }

    if (service.providerId.toString() === customerId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself.' });
    }

    const providerId = service.providerId;

    // 2. Find or create the Chat entry
    let chat = await Chat.findOne({ serviceId, customerId, providerId });
    let isNewChat = false;

    if (!chat) {
      chat = await Chat.create({ serviceId, customerId, providerId });
      isNewChat = true;
    }

    // 3. Format the structured initial inquiry text
    const inquiryText = `I need: ${description}\nBudget: ${budget}\nDeadline: ${deadline}`;

    // 4. Persist the inquiry message
    const initialMessage = await Message.create({
      chatId: chat._id,
      senderId: customerId,
      text: inquiryText,
      isSystemInquiry: true,
    });

    // 5. Link the last message to the chat
    chat.lastMessage = initialMessage._id;
    await chat.save();

    // 6. Return payload (If socket is connected, the client can use this room ID to join)
    res.status(201).json({
      success: true,
      message: isNewChat ? 'Inquiry submitted and chat thread opened.' : 'Inquiry added to existing thread.',
      chatId: chat._id,
      initialMessage,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/chats — Fetch active conversations for logged-in user
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({
      $or: [{ customerId: userId }, { providerId: userId }],
    })
      .populate('serviceId', 'title price')
      .populate('customerId', 'name profileImage')
      .populate('providerId', 'name profileImage')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, chats });
  } catch (error) {
    next(error);
  }
};

// GET /api/chats/:chatId/messages — Fetch message history
exports.getChatMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Authorization check
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });

    if (chat.customerId.toString() !== userId.toString() && chat.providerId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this chat.' });
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};