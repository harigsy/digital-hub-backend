// controllers/chatbotController.js - Chatbot Business Logic
const fs = require('fs').promises;
const path = require('path');
const emailService = require('../utils/emailService');

class ChatbotController {
  
  // ✅ Get Chatbot Flow
  async getChatbotFlow(req, res) {
    try {
      const flowPath = path.join(__dirname, '..', 'flows', 'chatbot_flow.json');
      console.log('📂 Loading chatbot flow from:', flowPath);
      
      // Check if file exists
      const fs_sync = require('fs');
      if (!fs_sync.existsSync(flowPath)) {
        console.error('❌ Flow file does not exist at:', flowPath);
        return res.status(404).json({ 
          success: false, 
          error: 'Chatbot flow file not found',
          path: flowPath
        });
      }
      
      const flowData = await fs.readFile(flowPath, 'utf8');
      console.log('✅ Flow file loaded successfully, size:', flowData.length);
      
      const flow = JSON.parse(flowData);
      console.log('✅ Flow parsed successfully, steps:', flow.flow?.length || 0);
      
      res.json({
        success: true,
        data: flow,
        timestamp: new Date().toISOString(),
        version: flow.metadata?.version || '1.0'
      });
      
    } catch (error) {
      console.error('❌ Error loading chatbot flow:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to load chatbot flow',
        message: error.message
      });
    }
  }

  // ✅ Validate User Input
  async validateUserInput(req, res) {
    try {
      const { field, value, validationType } = req.body;
      
      const result = req.validationResult || { valid: true, message: 'No validation required' };
      
      console.log(`✅ Validation result for ${field}:`, result);
      res.json(result);
      
    } catch (error) {
      console.error('❌ Error in validation:', error);
      res.status(500).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
  }

  // ✅ Send German Program Email
  async sendGermanProgramEmail(req, res) {
    try {
      const emailData = req.body;
      console.log('📧 Processing German Program email for:', emailData.name);
      
      // Validate required fields
      const requiredFields = ['name', 'age', 'email', 'purpose'];
      const missingFields = requiredFields.filter(field => !emailData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          missingFields
        });
      }

      // Send email using email service
      const emailResult = await emailService.sendGermanProgramEmail(emailData);
      
      if (emailResult.success) {
        console.log('✅ German Program email sent successfully');
        res.json({
          success: true,
          message: 'German Program email sent successfully',
          data: {
            timestamp: new Date().toISOString(),
            recipient: emailData.email,
            name: emailData.name,
            messageId: emailResult.messageId
          }
        });
      } else {
        console.error('❌ Failed to send German Program email:', emailResult.error);
        res.status(500).json({
          success: false,
          message: 'Failed to send email',
          error: emailResult.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error in sendGermanProgramEmail:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send German Program email',
        error: error.message
      });
    }
  }

  // ✅ Schedule Google Meeting
  async scheduleGoogleMeeting(req, res) {
    try {
      const meetingData = req.body;
      console.log('📅 Processing meeting request for:', meetingData.name);
      
      // Validate required fields
      const requiredFields = ['name', 'email', 'date', 'time'];
      const missingFields = requiredFields.filter(field => !meetingData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields for meeting',
          missingFields
        });
      }

      // For development - simulate successful scheduling
      if (process.env.NODE_ENV !== 'production') {
        console.log('📅 Meeting scheduled (DEV MODE):', meetingData);
        return res.json({
          success: true,
          message: 'Meeting scheduled successfully (DEV MODE)',
          data: {
            ...meetingData,
            meetingLink: `https://meet.google.com/dev-${Date.now()}`,
            timestamp: new Date().toISOString(),
            meetingId: `DEV-${Date.now()}`
          }
        });
      }
      
      // TODO: Integrate with Google Calendar API in production
      // const meetingResult = await googleCalendarService.createMeeting(meetingData);
      
      res.json({
        success: true,
        message: 'Meeting scheduled successfully',
        data: {
          ...meetingData,
          meetingLink: 'https://meet.google.com/your-production-link',
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Error scheduling meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule meeting',
        error: error.message
      });
    }
  }

  // ✅ Save Conversation Data
  async saveConversation(req, res) {
    try {
      const conversationData = req.body;
      
      // Create log entry
      const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...conversationData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      // For now, just log to console (later: save to database)
      console.log('💾 Conversation completed:', {
        id: logEntry.id,
        name: conversationData.responses?.name,
        email: conversationData.responses?.email,
        completed: conversationData.completed
      });
      
      // TODO: Save to database
      // await database.conversations.create(logEntry);
      
      res.json({
        success: true,
        message: 'Conversation data saved successfully',
        data: { 
          id: logEntry.id,
          timestamp: logEntry.timestamp
        }
      });
      
    } catch (error) {
      console.error('❌ Error saving conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save conversation data',
        error: error.message
      });
    }
  }

  // ✅ Get Chatbot Analytics (Future feature)
  async getChatbotAnalytics(req, res) {
    try {
      // TODO: Implement analytics
      const analytics = {
        totalConversations: 0,
        completionRate: 0,
        averageSteps: 0,
        topDropOffPoints: [],
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: analytics,
        message: 'Analytics feature coming soon'
      });
      
    } catch (error) {
      console.error('❌ Error getting analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get analytics',
        error: error.message
      });
    }
  }

  // ✅ Save User Feedback (Future feature)
  async saveFeedback(req, res) {
    try {
      const { rating, feedback, conversationId } = req.body;
      
      const feedbackEntry = {
        id: Date.now(),
        conversationId,
        rating,
        feedback,
        timestamp: new Date().toISOString(),
        ipAddress: req.ip
      };
      
      console.log('📝 Feedback received:', feedbackEntry);
      
      // TODO: Save to database
      // await database.feedback.create(feedbackEntry);
      
      res.json({
        success: true,
        message: 'Feedback saved successfully',
        data: { id: feedbackEntry.id }
      });
      
    } catch (error) {
      console.error('❌ Error saving feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save feedback',
        error: error.message
      });
    }
  }
}

module.exports = new ChatbotController();
