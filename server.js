// // server.js
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const morgan = require('morgan');
// require('dotenv').config();

// // Import routes
// const authRoutes = require('./routes/auth');
// const transactionRoutes = require('./routes/transactions');
// const analyticsRoutes = require('./routes/analytics');
// const logsRoutes = require('./routes/logs');
// const whatsappRoutes = require('./routes/whatsapp');

// const app = express();

// // Middleware
// if (process.env.NODE_ENV !== 'production') {
//   app.use(morgan('dev')); // logging only in dev
// }

// app.use(express.json());

// // CORS setup
// const allowedOrigins = process.env.NODE_ENV === 'production'
//   ? ['https://numen-tracker-frontend.vercel.app'] // full URL with https
//   : ['http://localhost:3000'];

// app.use(cors({
//   origin: allowedOrigins,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   credentials: true,
// }));

// // MongoDB connection
// mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('✅ MongoDB Connected'))
//   .catch(err => {
//     console.error('❌ MongoDB Connection Error:', err.message);
//     process.exit(1);
//   });

// // Routes
// app.use('/auth', authRoutes);
// app.use('/transactions', transactionRoutes);
// app.use('/analytics', analyticsRoutes);
// app.use('/logs', logsRoutes);
// app.use('/whatsapp', whatsappRoutes);

// // Start server
// const PORT = process.env.PORT || 5050;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const analyticsRoutes = require('./routes/analytics');
const logsRoutes = require('./routes/logs');
const whatsappRoutes = require('./routes/whatsapp');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://numen-tracker-frontend.vercel.app'] // full URL with https
      : ['http://localhost:3000'],
    credentials: true,
  }
});
app.set('io', io);

// Middleware
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://numen-tracker-frontend.vercel.app']
    : ['http://localhost:3000'],
  credentials: true,
}));

// MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => { 
    console.error('❌ MongoDB Error:', err.message); 
    process.exit(1); 
  });

// Routes
app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/logs', logsRoutes);
app.use('/whatsapp', whatsappRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('⚡ Socket connected:', socket.id);

  socket.on('joinRoom', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    }
  });

  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
