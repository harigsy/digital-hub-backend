// server.js - Clean Main Server
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import Routes
const chatbotRoutes = require('./routes/chatbotRoutes.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ✅ Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'Payana Overseas Backend - Modular Structure'
  });
});

// ✅ Routes
app.use('/api', chatbotRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ✅ 404 handler (Express 5 compatible)
app.use('/*catchAll', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Payana Overseas Backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Chatbot endpoints: http://localhost:${PORT}/api/chatbot/*`);
  console.log(`📧 Email endpoints: http://localhost:${PORT}/api/send-*`);
  console.log(`✅ Modular backend structure loaded`);
});

module.exports = app;
