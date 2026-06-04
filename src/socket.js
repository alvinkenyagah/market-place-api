const { Server } = require('socket.io');
const Message = require('./models/Message');
const Chat = require('./models/Chat');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*', // Adapt this to match your client configuration
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins a dedicated room matching their unique chatId
    socket.on('join_room', (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined room: ${chatId}`);
    });

    // Listening for active typing messages
    socket.on('send_message', async (data) => {
      const { chatId, senderId, text } = data;

      try {
        // 1. Persist message directly into database
        const newMessage = await Message.create({
          chatId,
          senderId,
          text,
        });

        // 2. Refresh Chat model's latest dynamic reference tracker
        await Chat.findByIdAndUpdate(chatId, { lastMessage: newMessage._id });

        // 3. Dispatch the message object out to everyone listening inside that exact room
        io.to(chatId).emit('receive_message', newMessage);
      } catch (error) {
        console.error('Socket message handling error:', error);
        socket.emit('error', { message: 'Failed to deliver message.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;