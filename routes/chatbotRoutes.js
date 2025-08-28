// routes/chatbotRoutes.js - Enhanced for Vercel
const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const consultationController = require('../controllers/consultationController');
const { validateInput, validateConsultationForm } = require('../middleware/validation');
const multer = require('multer');
const os = require('os');
const path = require('path');

// ✅ UPDATED: Vercel-compatible multer configuration
const upload = multer({
  dest: path.join(os.tmpdir(), 'uploads', 'resumes'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('📎 File upload attempt:', file.originalname, file.mimetype);
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.');
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});

// Existing Chatbot Routes
router.get('/chatbot/flow', chatbotController.getChatbotFlow);
router.post('/chatbot/validate', validateInput, chatbotController.validateUserInput);
router.post('/chatbot/save-conversation', chatbotController.saveConversation);

// Existing Email Routes
router.post('/send-german-program-email', chatbotController.sendGermanProgramEmail);

// Existing Meeting Routes
router.post('/schedule-meeting', chatbotController.scheduleGoogleMeeting);

// ✅ ENHANCED: Consultation Routes with better error handling
router.post('/consultation/book', 
  (req, res, next) => {
    console.log('📞 Consultation booking request received');
    next();
  },
  upload.single('resume'),
  (error, req, res, next) => {
    if (error) {
      console.error('❌ Multer error:', error);
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File too large',
          error: 'Maximum file size is 5MB'
        });
      }
      if (error.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type',
          error: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'File upload error',
        error: error.message
      });
    }
    next();
  },
  validateConsultationForm,
  consultationController.bookConsultation.bind(consultationController)
);

router.get('/consultation/bookings', 
  consultationController.getConsultationBookings.bind(consultationController)
);

router.put('/consultation/:id/status', 
  consultationController.updateConsultationStatus.bind(consultationController)
);

router.delete('/consultation/:id', 
  consultationController.deleteConsultation.bind(consultationController)
);

// Existing Analytics Routes
router.get('/chatbot/analytics', chatbotController.getChatbotAnalytics);
router.post('/chatbot/feedback', chatbotController.saveFeedback);

// Enhanced health check for consultation service
router.get('/consultation/health', (req, res) => {
  console.log('🏥 Consultation health check requested');
  res.status(200).json({
    success: true,
    service: 'Consultation Booking Service',
    status: 'Active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    platform: 'vercel'
  });
});

module.exports = router;
