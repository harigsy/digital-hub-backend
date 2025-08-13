// routes/chatbotRoutes.js - Chatbot API Routes
const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { validateInput } = require('../middleware/validation');

// ✅ Chatbot Flow Routes
router.get('/chatbot/flow', chatbotController.getChatbotFlow);
router.post('/chatbot/validate', validateInput, chatbotController.validateUserInput);
router.post('/chatbot/save-conversation', chatbotController.saveConversation);

// ✅ Email Routes
router.post('/send-german-program-email', chatbotController.sendGermanProgramEmail);

// ✅ Meeting Routes
router.post('/schedule-meeting', chatbotController.scheduleGoogleMeeting);

// ✅ Analytics Routes (Future use)
router.get('/chatbot/analytics', chatbotController.getChatbotAnalytics);
router.post('/chatbot/feedback', chatbotController.saveFeedback);

module.exports = router;
