// routes/chatbotRoutes.js - FIXED: Proper method binding
const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const consultationController = require('../controllers/consultationController');
const { validateInput, validateConsultationForm } = require('../middleware/validation');
const multer = require('multer');

// Configure multer for resume uploads
const upload = multer({
  dest: 'uploads/resumes/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
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

// ✅ FIXED: Consultation Routes with proper method binding
router.post('/consultation/book', 
  upload.single('resume'),
  validateConsultationForm,
  // ✅ FIXED: Use .bind() to ensure 'this' context is preserved
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

// Health check for consultation service
router.get('/consultation/health', (req, res) => {
  res.json({
    success: true,
    service: 'Consultation Booking Service',
    status: 'Active',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
