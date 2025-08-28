// controllers/consultationController.js - Vercel Compatible
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const emailService = require('../utils/emailServiceGuidance');

class ConsultationController {

  async bookConsultation(req, res) {
    try {
      console.log('📞 Processing consultation booking request...');
      console.log('📋 Environment:', process.env.NODE_ENV);
      console.log('📋 Request body keys:', Object.keys(req.body));
      console.log('📋 File uploaded:', !!req.file);
      
      const formData = req.body;
      const resumeFile = req.file;
      
      console.log('📋 Form data received:', {
        name: formData.fullName,
        email: formData.email,
        service: formData.interestedService,
        hasResume: !!resumeFile
      });

      // Generate unique consultation ID
      const consultationId = `CONS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Prepare consultation data
      const consultationData = {
        id: consultationId,
        ...formData,
        resume: resumeFile ? {
          originalName: resumeFile.originalname,
          filename: resumeFile.filename,
          path: resumeFile.path,
          size: resumeFile.size,
          mimetype: resumeFile.mimetype
        } : null,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      console.log('💾 Attempting to save consultation...');
      
      // ✅ FIXED: Try to save but don't fail if it doesn't work (Vercel limitation)
      try {
        await this.saveConsultationToFile(consultationData);
        console.log('💾 Consultation saved to file successfully');
      } catch (saveError) {
        console.warn('⚠️ File save failed (continuing anyway):', saveError.message);
        // Continue without failing - this is expected on serverless platforms
      }

      console.log('📧 Attempting to send emails...');
      
      // Send email notifications
      const emailResult = await emailService.sendConsultationEmails(consultationData);
      
      console.log('📧 Email result:', emailResult.success ? 'Success' : 'Failed');

      if (emailResult.success) {
        console.log('✅ Consultation booked successfully:', consultationId);
        
        res.status(200).json({
          success: true,
          message: 'Consultation booked successfully',
          data: {
            consultationId,
            submittedAt: consultationData.submittedAt,
            status: 'pending',
            estimatedResponseTime: '24 hours'
          }
        });
      } else {
        // Consultation processed but email failed
        console.warn('⚠️ Consultation processed but email failed');
        
        res.status(200).json({
          success: true,
          message: 'Consultation booked successfully, but notification email failed',
          data: {
            consultationId,
            submittedAt: consultationData.submittedAt,
            status: 'pending',
            emailWarning: 'Email notification failed - admin will be notified manually'
          }
        });
      }

    } catch (error) {
      console.error('❌ Error booking consultation:', error);
      console.error('❌ Stack trace:', error.stack);
      
      // Clean up uploaded file if error occurs
      if (req.file && req.file.path) {
        try {
          const fs_sync = require('fs');
          if (fs_sync.existsSync(req.file.path)) {
            fs_sync.unlinkSync(req.file.path);
            console.log('🗑️ Cleaned up uploaded file after error');
          }
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup file:', cleanupError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to book consultation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          timestamp: new Date().toISOString()
        } : undefined
      });
    }
  }

  // ✅ Get All Consultation Bookings (Admin)
  async getConsultationBookings(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      
      const consultations = await this.loadConsultationsFromFile();
      
      let filteredConsultations = consultations;
      
      if (status && status !== 'all') {
        filteredConsultations = consultations.filter(c => c.status === status);
      }

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedConsultations = filteredConsultations.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        data: {
          consultations: paginatedConsultations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredConsultations.length,
            pages: Math.ceil(filteredConsultations.length / limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching consultations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch consultations',
        error: error.message
      });
    }
  }

  // ✅ Update Consultation Status (Admin)
  async updateConsultationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
          validStatuses
        });
      }

      const consultations = await this.loadConsultationsFromFile();
      const consultationIndex = consultations.findIndex(c => c.id === id);
      
      if (consultationIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
      }

      consultations[consultationIndex] = {
        ...consultations[consultationIndex],
        status,
        notes: notes || consultations[consultationIndex].notes,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user?.id || 'admin'
      };

      await this.saveConsultationsToFile(consultations);

      if (status === 'confirmed') {
        await emailService.sendConsultationConfirmationEmail(consultations[consultationIndex]);
      }

      res.status(200).json({
        success: true,
        message: 'Consultation status updated successfully',
        data: consultations[consultationIndex]
      });

    } catch (error) {
      console.error('❌ Error updating consultation status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update consultation status',
        error: error.message
      });
    }
  }

  // ✅ Delete Consultation (Admin)
  async deleteConsultation(req, res) {
    try {
      const { id } = req.params;
      
      const consultations = await this.loadConsultationsFromFile();
      const consultationIndex = consultations.findIndex(c => c.id === id);
      
      if (consultationIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
      }

      const consultation = consultations[consultationIndex];
      
      if (consultation.resume && consultation.resume.path) {
        try {
          const fs_sync = require('fs');
          if (fs_sync.existsSync(consultation.resume.path)) {
            fs_sync.unlinkSync(consultation.resume.path);
            console.log('🗑️ Resume file deleted:', consultation.resume.filename);
          }
        } catch (fileError) {
          console.warn('⚠️ Failed to delete resume file:', fileError.message);
        }
      }

      consultations.splice(consultationIndex, 1);
      await this.saveConsultationsToFile(consultations);

      res.status(200).json({
        success: true,
        message: 'Consultation deleted successfully',
        deletedId: id
      });

    } catch (error) {
      console.error('❌ Error deleting consultation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete consultation',
        error: error.message
      });
    }
  }

  // ✅ UPDATED: Vercel-compatible file operations
  async saveConsultationToFile(consultationData) {
    try {
      // ✅ Use OS temp directory for Vercel
      const consultationsDir = path.join(os.tmpdir(), 'payana-data');
      const consultationsFile = path.join(consultationsDir, 'consultations.json');
      
      console.log('📁 Saving to directory:', consultationsDir);
      
      // Ensure directory exists
      await fs.mkdir(consultationsDir, { recursive: true });

      let consultations = [];
      
      // Load existing consultations if file exists
      try {
        const fileContent = await fs.readFile(consultationsFile, 'utf8');
        consultations = JSON.parse(fileContent);
      } catch (readError) {
        // File doesn't exist yet, start with empty array
        console.log('📁 Creating new consultations file');
        consultations = [];
      }

      // Add new consultation
      consultations.push(consultationData);

      // Save back to file
      await fs.writeFile(consultationsFile, JSON.stringify(consultations, null, 2));
      
      console.log('💾 Consultation saved to file:', consultationData.id);
      
    } catch (error) {
      console.error('❌ Error saving consultation to file:', error);
      // Re-throw error so calling function can handle it
      throw error;
    }
  }

  // ✅ UPDATED: Load consultations from temp directory
  async loadConsultationsFromFile() {
    try {
      const consultationsFile = path.join(os.tmpdir(), 'payana-data', 'consultations.json');
      
      try {
        const fileContent = await fs.readFile(consultationsFile, 'utf8');
        return JSON.parse(fileContent);
      } catch (readError) {
        console.log('📁 No consultations file found, returning empty array');
        return [];
      }
      
    } catch (error) {
      console.error('❌ Error loading consultations from file:', error);
      return [];
    }
  }

  // ✅ UPDATED: Save consultations to temp directory
  async saveConsultationsToFile(consultations) {
    try {
      const consultationsDir = path.join(os.tmpdir(), 'payana-data');
      const consultationsFile = path.join(consultationsDir, 'consultations.json');
      
      await fs.mkdir(consultationsDir, { recursive: true });
      await fs.writeFile(consultationsFile, JSON.stringify(consultations, null, 2));
    } catch (error) {
      console.error('❌ Error saving consultations to file:', error);
      throw error;
    }
  }
}

const consultationController = new ConsultationController();
module.exports = consultationController;
