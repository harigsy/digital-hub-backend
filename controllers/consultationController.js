// controllers/consultationController.js - FIXED: Proper Class Method Binding
const fs = require('fs').promises;
const path = require('path');
const emailService = require('../utils/emailServiceGuidance');

class ConsultationController {

  // ✅ FIXED: Use standard class method (not arrow function)
  async bookConsultation(req, res) {
    try {
      console.log('📞 Processing consultation booking request...');
      
      const formData = req.body;
      const resumeFile = req.file; // Multer file object
      
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

      // ✅ FIXED: Now 'this' refers to the class instance
      await this.saveConsultationToFile(consultationData);

      // Send email notifications
      const emailResult = await emailService.sendConsultationEmails(consultationData);

      if (emailResult.success) {
        console.log('✅ Consultation booked successfully:', consultationId);
        
        res.json({
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
        // Consultation saved but email failed
        console.warn('⚠️ Consultation saved but email notification failed');
        
        res.json({
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
      
      // Clean up uploaded file if error occurs
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
          console.log('🗑️ Cleaned up uploaded file after error');
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup file:', cleanupError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to book consultation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // ✅ Get All Consultation Bookings (Admin)
  async getConsultationBookings(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      
      const consultations = await this.loadConsultationsFromFile();
      
      let filteredConsultations = consultations;
      
      // Filter by status if provided
      if (status && status !== 'all') {
        filteredConsultations = consultations.filter(c => c.status === status);
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedConsultations = filteredConsultations.slice(startIndex, endIndex);

      res.json({
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

      // Update consultation
      consultations[consultationIndex] = {
        ...consultations[consultationIndex],
        status,
        notes: notes || consultations[consultationIndex].notes,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user?.id || 'admin'
      };

      await this.saveConsultationsToFile(consultations);

      // Send status update email to user
      if (status === 'confirmed') {
        await emailService.sendConsultationConfirmationEmail(consultations[consultationIndex]);
      }

      res.json({
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
      
      // Delete resume file if exists
      if (consultation.resume && consultation.resume.path) {
        try {
          await fs.unlink(consultation.resume.path);
          console.log('🗑️ Resume file deleted:', consultation.resume.filename);
        } catch (fileError) {
          console.warn('⚠️ Failed to delete resume file:', fileError.message);
        }
      }

      // Remove consultation from array
      consultations.splice(consultationIndex, 1);
      await this.saveConsultationsToFile(consultations);

      res.json({
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

  // ✅ Helper: Save consultation to file
  async saveConsultationToFile(consultationData) {
    try {
      const consultationsDir = path.join(__dirname, '..', 'data');
      const consultationsFile = path.join(consultationsDir, 'consultations.json');
      
      // Ensure directory exists
      const fs_sync = require('fs');
      if (!fs_sync.existsSync(consultationsDir)) {
        await fs.mkdir(consultationsDir, { recursive: true });
      }

      let consultations = [];
      
      // Load existing consultations
      if (fs_sync.existsSync(consultationsFile)) {
        const fileContent = await fs.readFile(consultationsFile, 'utf8');
        consultations = JSON.parse(fileContent);
      }

      // Add new consultation
      consultations.push(consultationData);

      // Save back to file
      await fs.writeFile(consultationsFile, JSON.stringify(consultations, null, 2));
      
      console.log('💾 Consultation saved to file:', consultationData.id);
      
    } catch (error) {
      console.error('❌ Error saving consultation to file:', error);
      throw error;
    }
  }

  // ✅ Helper: Load consultations from file
  async loadConsultationsFromFile() {
    try {
      const consultationsFile = path.join(__dirname, '..', 'data', 'consultations.json');
      
      const fs_sync = require('fs');
      if (!fs_sync.existsSync(consultationsFile)) {
        return [];
      }

      const fileContent = await fs.readFile(consultationsFile, 'utf8');
      return JSON.parse(fileContent);
      
    } catch (error) {
      console.error('❌ Error loading consultations from file:', error);
      return [];
    }
  }

  // ✅ Helper: Save consultations to file
  async saveConsultationsToFile(consultations) {
    try {
      const consultationsFile = path.join(__dirname, '..', 'data', 'consultations.json');
      await fs.writeFile(consultationsFile, JSON.stringify(consultations, null, 2));
    } catch (error) {
      console.error('❌ Error saving consultations to file:', error);
      throw error;
    }
  }
}

// ✅ FIXED: Export class instance with proper binding
const consultationController = new ConsultationController();
module.exports = consultationController;
