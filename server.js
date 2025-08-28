// server.js - Vercel-Optimized with News Routes
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config();

// Import Routes
const chatbotRoutes = require('./routes/chatbotRoutes.js');
const newsRoutes = require('./routes/newsRoutes.js'); // ✅ NEW

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ VERCEL FIX: Create directories in temp location
const createDirectories = () => {
  const directories = [
    path.join(os.tmpdir(), 'uploads'),
    path.join(os.tmpdir(), 'uploads', 'resumes'),
    path.join(os.tmpdir(), 'data')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

createDirectories();

// ✅ VERCEL FIX: Enhanced Middleware with timeout handling
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ✅ VERCEL FIX: More permissive CORS for serverless
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-Powered-By', 'Payana-Backend-Vercel');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// ✅ VERCEL FIX: Static file serving from temp directory
app.use('/uploads', express.static(path.join(os.tmpdir(), 'uploads')));

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
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({ 
      status: 'ok',
      service: 'Payana Overseas Backend',
      timestamp: new Date().toISOString(),
      version: '1.3.0', // ✅ Updated version
      environment: process.env.NODE_ENV || 'production',
      platform: 'vercel-serverless',
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
        'News Proxy Service (Vercel Optimized)' // ✅ UPDATED
      ],
      environmentVariables: {
        newsApiKey: process.env.NEWS_API_KEY ? 'configured' : 'missing',
        smtpUser: process.env.SMTP_USER ? 'configured' : 'missing',
        nodeEnv: process.env.NODE_ENV || 'not-set'
      },
      message: 'All systems operational (Vercel)'
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// ✅ Routes
app.use('/api', chatbotRoutes);
app.use('/api/news', newsRoutes); // ✅ NEWS: News proxy routes

// ✅ VERCEL FIX: Enhanced error handling middleware
app.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  console.error(`❌ Server Error [${timestamp}]:`, {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
    headers: req.headers,
    query: req.query
  });
  
  // Handle specific error types
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large',
      error: 'Maximum file size is 5MB'
    });
  }
  
  if (error.code === 'ECONNABORTED') {
    return res.status(408).json({
      success: false,
      message: 'Request timeout',
      error: 'The request took too long to process'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: timestamp,
    requestId: req.headers['x-request-id'] || 'unknown'
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
      'POST /api/schedule-meeting - Schedule meeting',
      'GET /api/news/headlines - Get news headlines', // ✅ NEW
      'GET /api/news/search - Search news', // ✅ NEW
      'GET /api/news/sources - Get news sources', // ✅ NEW
      'GET /api/news/health - News service health', // ✅ NEW
      'POST /api/news/clear-cache - Clear news cache' // ✅ NEW
    ],
    timestamp: new Date().toISOString(),
    suggestion: 'Check the availableEndpoints list for valid routes'
  });
});

// ✅ VERCEL FIX: Conditional server start (Vercel handles this automatically)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    const serverInfo = {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      vercel: process.env.VERCEL ? 'true' : 'false'
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
    console.log(`🏥 News health: http://localhost:${PORT}/api/news/health`); // ✅ NEW
    console.log(`💾 Data storage: ${os.tmpdir()}/data/`);
    console.log('🚀 ═══════════════════════════════════════════════════════════');
    console.log('✅ Features Available:');
    console.log('   • Consultation booking with file uploads');
    console.log('   • Email notifications (admin & user)');
    console.log('   • Chatbot flow management');
    console.log('   • Meeting scheduling');
    console.log('   • Form validation & error handling');
    console.log('   • CORS enabled for React Native');
    console.log('   • News proxy service (Vercel optimized)'); // ✅ NEW
    console.log('   • Rate limiting and security'); // ✅ NEW
    console.log('   • Serverless-compatible caching'); // ✅ NEW
    console.log('🚀 ═══════════════════════════════════════════════════════════');
    
    console.log('📋 Server Information:');
    Object.entries(serverInfo).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    console.log('🚀 ═══════════════════════════════════════════════════════════');
  });
}

// ✅ VERCEL FIX: Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
