// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const analyticsRoutes = require('./routes/analytics');
const logsRoutes = require('./routes/logs');
const whatsappRoutes = require('./routes/whatsapp');

const app = express();

// Middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); // logging only in dev
}

app.use(express.json());

// CORS setup
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['numen-tracker-frontend.vercel.app'] // replace with your live frontend URL
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Routes
app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/logs', logsRoutes);
app.use('/whatsapp', whatsappRoutes);

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
