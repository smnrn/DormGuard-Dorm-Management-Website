const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database connection to test on startup
const { pool } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const tenantSpecificRoutes = require('./routes/tenantSpecificRoutes');
const adminRoutes = require('./routes/adminRoutes');
const visitorLogRoutes = require('./routes/visitorLogRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Increased limit for base64 images

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'DormGuard API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/tenant', tenantSpecificRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/visitor-logs', visitorLogRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET  /api/health',
      'POST /api/auth/login',
      'GET  /api/tenants',
      'GET  /api/visitors',
      'GET  /api/visitor-logs',
      'GET  /api/admin/dashboard-stats'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;
    
  res.status(statusCode).json({ 
    error: 'Server Error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 DormGuard Backend Server`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    pool.end(() => {
      console.log('✅ Database connection pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    pool.end(() => {
      console.log('✅ Database connection pool closed');
      process.exit(0);
    });
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});