// server.js - Enhanced with Consultation Support
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import Routes
const chatbotRoutes = require('./routes/chatbotRoutes.js');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ NEW: Create necessary directories
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

// Create directories on startup
createDirectories();

// ✅ NEW: Enhanced Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ✅ NEW: CORS middleware for React Native
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// ✅ NEW: Static file serving for uploaded resumes
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

// ✅ Enhanced Health Check Endpoint
app.get('/api/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({ 
    status: 'ok',
    service: 'Payana Overseas Backend',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
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
      'Meeting Scheduling'
    ],
    message: 'All systems operational'
  });
});

// ✅ Routes
app.use('/api', chatbotRoutes);

// ✅ NEW: File download endpoint for resumes
app.get('/api/download/resume/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'uploads', 'resumes', filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    res.download(filepath, filename);
    console.log(`📥 Resume downloaded: ${filename}`);
    
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
});

// ✅ NEW: System statistics endpoint
app.get('/api/stats', (req, res) => {
  try {
    const consultationsFile = path.join(__dirname, 'data', 'consultations.json');
    let totalConsultations = 0;
    
    if (fs.existsSync(consultationsFile)) {
      const consultations = JSON.parse(fs.readFileSync(consultationsFile, 'utf8'));
      totalConsultations = consultations.length;
    }
    
    const uploadsDir = path.join(__dirname, 'uploads', 'resumes');
    let totalResumes = 0;
    
    if (fs.existsSync(uploadsDir)) {
      totalResumes = fs.readdirSync(uploadsDir).length;
    }
    
    res.json({
      success: true,
      data: {
        totalConsultations,
        totalResumes,
        serverUptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

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
  
  // Handle specific error types
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large',
      error: 'Maximum file size is 5MB'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file upload',
      error: 'Unexpected file field'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: timestamp
  });
});

// ✅ Enhanced 404 handler
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
      'POST /api/schedule-meeting - Schedule meeting'
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
  console.log(`📥 File uploads: ./uploads/resumes/`);
  console.log(`💾 Data storage: ./data/`);
  console.log('🚀 ═══════════════════════════════════════════════════════════');
  console.log('✅ Features Available:');
  console.log('   • Consultation booking with file uploads');
  console.log('   • Email notifications (admin & user)');
  console.log('   • Chatbot flow management');
  console.log('   • Meeting scheduling');
  console.log('   • Form validation & error handling');
  console.log('   • CORS enabled for React Native');
  console.log('🚀 ═══════════════════════════════════════════════════════════');
  
  // Log server info
  console.log('📋 Server Information:');
  Object.entries(serverInfo).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  console.log('🚀 ═══════════════════════════════════════════════════════════');
});

// ✅ NEW: Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
