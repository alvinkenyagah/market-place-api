require('dotenv').config();
const express = require('express');
const http = require('http'); // 1. Import native HTTP module
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./src/config/db');
const initSocket = require('./src/socket'); // 2. Import your socket initializer

const authRoutes = require('./src/routes/authRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const chatRoutes = require('./src/routes/chatRoutes'); // 3. Import new chat routes
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app); // 4. Wrap the express app inside HTTP server

// 5. Initialize Socket.io with the HTTP server
initSocket(server);

// Security & utilities
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
app.use('/api', limiter);
app.use('/api/auth', authLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) =>
  res.status(200).json({ success: true, message: 'Server is running.', timestamp: new Date() })
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chats', chatRoutes); // 6. Mount chat routes

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// 7. Change app.listen to server.listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Exporting both if needed for testing suites
module.exports = { app, server };