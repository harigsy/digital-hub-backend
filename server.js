// server.js - Add news routes
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import Routes
const chatbotRoutes = require('./routes/chatbotRoutes.js');
const newsRoutes = require('./routes/newsRoutes.js'); // ✅ NEW

const app = express();
const PORT = process.env.PORT || 5000;

// Create necessary directories
const createDirectories = () => {
  const directories = [
    './uploads',
    './uploads/resumes',
    './data'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

createDirectories();

// Enhanced Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware for React Native
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.path;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`${timestamp} - ${method} ${url} - ${userAgent.substring(0, 50)}${userAgent.length > 50 ? '...' : ''}`);
  next();
});

// Enhanced Health Check Endpoint
app.get('/api/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({ 
    status: 'ok',
    service: 'Payana Overseas Backend',
    timestamp: new Date().toISOString(),
    version: '1.2.0', // ✅ Updated version
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    },
    features: [
      'Chatbot Flow Management',
      'Email Notifications',
      'Consultation Booking',
      'File Upload Support',
      'Meeting Scheduling',
      'News Proxy Service' // ✅ NEW
    ],
    message: 'All systems operational'
  });
});

// ✅ Routes
app.use('/api', chatbotRoutes);
app.use('/api/news', newsRoutes); // ✅ NEW: News proxy routes

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`❌ Server Error [${timestamp}]:`, {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large',
      error: 'Maximum file size is 5MB'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: timestamp
  });
});

// Enhanced 404 handler
app.use('/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/health - System health check',
      'GET /api/stats - System statistics',
      'GET /api/chatbot/flow - Get chatbot flow',
      'POST /api/consultation/book - Book consultation',
      'GET /api/consultation/bookings - Get bookings (admin)',
      'POST /api/send-german-program-email - German program email',
      'POST /api/schedule-meeting - Schedule meeting',
      'GET /api/news/headlines - Get news headlines', // ✅ NEW
      'GET /api/news/search - Search news', // ✅ NEW
      'GET /api/news/sources - Get news sources', // ✅ NEW
      'GET /api/news/health - News service health' // ✅ NEW
    ],
    timestamp: new Date().toISOString()
  });
});

// Start server with enhanced logging
app.listen(PORT, () => {
  const serverInfo = {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform
  };
  
  console.log('🚀 ═══════════════════════════════════════════════════════════');
  console.log('🌟 Payana Overseas Backend Server Started Successfully!');
  console.log('🚀 ═══════════════════════════════════════════════════════════');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Statistics: http://localhost:${PORT}/api/stats`);
  console.log(`🤖 Chatbot: http://localhost:${PORT}/api/chatbot/flow`);
  console.log(`📞 Consultation: http://localhost:${PORT}/api/consultation/book`);
  console.log(`📧 Email service: http://localhost:${PORT}/api/send-*`);
  console.log(`📰 News headlines: http://localhost:${PORT}/api/news/headlines`); // ✅ NEW
  console.log(`🔍 News search: http://localhost:${PORT}/api/news/search`); // ✅ NEW
  console.log(`📡 News sources: http://localhost:${PORT}/api/news/sources`); // ✅ NEW
  console.log(`💾 Data storage: ./data/`);
  console.log('🚀 ═══════════════════════════════════════════════════════════');
  console.log('✅ Features Available:');
  console.log('   • Consultation booking with file uploads');
  console.log('   • Email notifications (admin & user)');
  console.log('   • Chatbot flow management');
  console.log('   • Meeting scheduling');
  console.log('   • Form validation & error handling');
  console.log('   • CORS enabled for React Native');
  console.log('   • News proxy service with caching'); // ✅ NEW
  console.log('   • Rate limiting and security'); // ✅ NEW
  console.log('🚀 ═══════════════════════════════════════════════════════════');
  
  console.log('📋 Server Information:');
  Object.entries(serverInfo).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  console.log('🚀 ═══════════════════════════════════════════════════════════');
});

module.exports = app;
