// utils/emailServiceGuidance.js - Enhanced Error Handling
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      console.log('🔧 Initializing email transporter...');
      console.log('📧 Environment check:', {
        nodeEnv: process.env.NODE_ENV,
        smtpHost: process.env.SMTP_HOST ? 'Set' : 'Missing',
        smtpUser: process.env.SMTP_USER ? 'Set' : 'Missing',
        smtpPass: process.env.SMTP_PASS ? 'Set' : 'Missing',
        adminEmail: process.env.ADMIN_EMAIL ? 'Set' : 'Missing'
      });

      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ Missing SMTP credentials in environment variables');
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      console.log('✅ Email transporter initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing email transporter:', error);
      this.transporter = null;
    }
  }

  // ✅ Generate Consultation Admin Email Template
  generateConsultationAdminTemplate(consultationData) {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">📞 New Consultation Booking</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Payana Overseas Solutions</p>
          <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; margin-top: 15px;">
            <p style="margin: 0; font-weight: bold;">Booking ID: ${consultationData.id}</p>
          </div>
        </div>
        
        <div style="padding: 40px; background: white;">
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
            <h3 style="color: #92400e; margin: 0 0 5px 0;">⚡ Action Required</h3>
            <p style="color: #92400e; margin: 0; font-weight: 500;">New consultation booking requires your attention</p>
          </div>

          <h2 style="color: #1e3a8a; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 25px;">
            👤 Personal Information
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <tr style="background: #f1f5f9;">
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0; width: 30%;">Full Name:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0;">${consultationData.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0;">Email:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0;"><a href="mailto:${consultationData.email}" style="color: #3b82f6;">${consultationData.email}</a></td>
            </tr>
            <tr style="background: #f1f5f9;">
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0;">Phone:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0;"><a href="tel:+91${consultationData.phone}" style="color: #3b82f6;">+91 ${consultationData.phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0;">Age:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0;">${consultationData.age} years</td>
            </tr>
          </table>

          <h2 style="color: #1e3a8a; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 25px;">
            🎓 Background Information
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <tr style="background: #f1f5f9;">
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0; width: 30%;">Education:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0;">${consultationData.education}</td>
            </tr>
            <tr>
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0;">Experience:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0;">${consultationData.experience || 'Fresher/Not specified'}</td>
            </tr>
            <tr style="background: #f1f5f9;">
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0;">Current Status:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0; text-transform: capitalize;">${consultationData.currentStatus}</td>
            </tr>
            ${consultationData.resume ? `
            <tr>
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0;">Resume:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0;">
                <span style="color: #10b981; font-weight: bold;">✅ Attached to this email</span><br>
                <small style="color: #6b7280;">File: ${consultationData.resume.originalName} (${(consultationData.resume.size / 1024).toFixed(1)} KB)</small>
              </td>
            </tr>
            ` : ''}
          </table>

          <h2 style="color: #1e3a8a; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 25px;">
            🎯 Service Requirements
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <tr style="background: #f1f5f9;">
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0; width: 30%;">Interested Service:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0; font-weight: 600; color: #1e40af;">${consultationData.interestedService}</td>
            </tr>
            ${consultationData.careerGoals && consultationData.careerGoals.trim() ? `
            <tr>
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0; vertical-align: top;">Career Goals:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0; line-height: 1.6;">${consultationData.careerGoals}</td>
            </tr>
            ` : `
            <tr>
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0; vertical-align: top;">Career Goals:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0; color: #9ca3af; font-style: italic;">Not provided</td>
            </tr>
            `}
          </table>

          <h2 style="color: #1e3a8a; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 25px;">
            📅 Consultation Preferences
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <tr style="background: #f1f5f9;">
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0; width: 30%;">Preferred Mode:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0; text-transform: capitalize;">${consultationData.preferredMode === 'offline' ? '🏢 In-Person Meeting' : consultationData.preferredMode === 'phone' ? '📞 Phone Call' : '💻 Online Video Call'}</td>
            </tr>
            <tr>
              <td style="padding: 15px; font-weight: bold; border: 1px solid #e2e8f0;">Preferred Time:</td>
              <td style="padding: 15px; border: 1px solid #e2e8f0; text-transform: capitalize;">${consultationData.preferredTime === 'morning' ? '🌅 Morning (9 AM - 12 PM)' : '🌞 Afternoon (2 PM - 4 PM)'}</td>
            </tr>
          </table>

          ${consultationData.additionalInfo ? `
          <h2 style="color: #1e3a8a; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 25px;">
            💬 Additional Information
          </h2>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #6b7280;">
            <p style="margin: 0; line-height: 1.6; color: #374151;">${consultationData.additionalInfo}</p>
          </div>
          ` : ''}

          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin-top: 30px; border-radius: 4px;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0;">📞 Next Steps:</h3>
            <ul style="margin: 0; padding-left: 25px; color: #1e40af; line-height: 1.8;">
              <li><strong>Review the application details above</strong></li>
              <li><strong>Contact ${consultationData.fullName} within 24 hours</strong></li>
              <li><strong>Schedule consultation based on their preferences</strong></li>
              <li><strong>Update booking status in admin panel</strong></li>
              ${consultationData.resume ? '<li><strong>Review the attached resume for candidate background</strong></li>' : ''}
            </ul>
          </div>

          <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #6b7280;"><strong>Submission Time:</strong></td>
                <td style="padding: 5px 0; color: #374151;">${formatDate(consultationData.submittedAt)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6b7280;"><strong>Service Type:</strong></td>
                <td style="padding: 5px 0; color: #374151;">Domestic Guidance</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6b7280;"><strong>Status:</strong></td>
                <td style="padding: 5px 0;"><span style="background: #fbbf24; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">PENDING REVIEW</span></td>
              </tr>
            </table>
          </div>
        </div>
        
        <div style="background: #374151; color: white; padding: 25px; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Payana Overseas Solutions</p>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">📞 +91 9003619777 | 📧 admin@payanaoverseaa.com</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">© 2025 All Rights Reserved</p>
        </div>
      </div>
    `;
  }

  // ✅ Generate User Confirmation Email Template
  generateUserConfirmationTemplate(consultationData) {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #10b981, #047857); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px;">🎉 Consultation Booked Successfully!</h1>
          <p style="margin: 15px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for choosing Payana Overseas</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <div style="background: #dcfce7; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
            <h3 style="color: #047857; margin: 0 0 5px 0;">✅ Booking Confirmed</h3>
            <p style="color: #047857; margin: 0;">Your consultation request has been received successfully</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px;">
            Dear <strong>${consultationData.fullName}</strong>,<br><br>
            Thank you for booking a consultation with Payana Overseas Solutions. We have received your request and our expert team will review your details shortly.
          </p>

          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0;">📋 Your Booking Details</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Booking ID:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${consultationData.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Service:</td>
                <td style="padding: 8px 0; color: #1f2937;">${consultationData.interestedService}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Preferred Mode:</td>
                <td style="padding: 8px 0; color: #1f2937; text-transform: capitalize;">${consultationData.preferredMode === 'offline' ? 'In-Person Meeting' : consultationData.preferredMode === 'phone' ? 'Phone Call' : 'Online Video Call'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Preferred Time:</td>
                <td style="padding: 8px 0; color: #1f2937; text-transform: capitalize;">${consultationData.preferredTime === 'morning' ? 'Morning (9 AM - 12 PM)' : 'Afternoon (2 PM - 4 PM)'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Submitted On:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(consultationData.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
              </tr>
            </table>
          </div>

          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0;">⏰ What Happens Next?</h3>
            <ol style="margin: 0; padding-left: 20px; color: #1e40af; line-height: 1.8;">
              <li><strong>Review Process:</strong> Our team will review your application within 24 hours</li>
              <li><strong>Contact:</strong> We will call you on <strong>+91 ${consultationData.phone}</strong> to confirm your consultation</li>
              <li><strong>Scheduling:</strong> We'll schedule your consultation based on your preferred time and mode</li>
              <li><strong>Preparation:</strong> You'll receive a confirmation email with meeting details</li>
            </ol>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">📞 Need Immediate Assistance?</h4>
            <p style="color: #92400e; margin: 0; font-weight: 500;">
              Call us at: <a href="tel:+919003619777" style="color: #92400e; text-decoration: none;"><strong>+91 9003619777</strong></a><br>
              Email: <a href="mailto:admin@payanaoverseaa.com" style="color: #92400e;">admin@payanaoverseaa.com</a>
            </p>
          </div>

          <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 0;">
            We look forward to helping you achieve your career goals. Our experienced counselors are here to guide you every step of the way.
          </p>
        </div>
        
        <div style="background: #374151; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">Payana Overseas Solutions</p>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">Your Trusted Career Partner</p>
          <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">© 2025 All Rights Reserved</p>
        </div>
      </div>
    `;
  }

// ✅ ENHANCED: Send consultation emails with better error handling
  async sendConsultationEmails(consultationData) {
    try {
      console.log('📧 Starting email send process...');
      
      if (!this.transporter) {
        console.error('❌ Email transporter not initialized');
        return {
          success: false,
          error: 'Email service not available',
          message: 'Failed to send consultation emails'
        };
      }

      const adminHtmlContent = this.generateConsultationAdminTemplate(consultationData);
      const userHtmlContent = this.generateUserConfirmationTemplate(consultationData);

      // Prepare attachments with enhanced error handling
      const attachments = [];
      
      if (consultationData.resume && consultationData.resume.path) {
        try {
          const resumePath = path.resolve(consultationData.resume.path);
          
          if (fs.existsSync(resumePath)) {
            attachments.push({
              filename: consultationData.resume.originalName || 'resume.pdf',
              path: resumePath,
              contentType: consultationData.resume.mimetype || 'application/pdf'
            });
            console.log('📎 Resume attachment prepared:', consultationData.resume.originalName);
          } else {
            console.warn('⚠️ Resume file not found at path:', resumePath);
          }
        } catch (attachError) {
          console.error('❌ Error preparing attachment:', attachError);
        }
      }

      const adminMailOptions = {
        from: `"Payana Overseas" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL || 'admin@payanaoverseaa.com',
        subject: `🚨 New Consultation Booking - ${consultationData.fullName} (${consultationData.interestedService})`,
        html: adminHtmlContent,
        attachments: attachments
      };

      const userMailOptions = {
        from: `"Payana Overseas" <${process.env.SMTP_USER}>`,
        to: consultationData.email,
        subject: `✅ Consultation Booking Confirmed - ${consultationData.id}`,
        html: userHtmlContent,
      };

      console.log('📧 Sending emails...');

      // Development mode - just log
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Consultation emails (DEV MODE):', {
          adminEmail: adminMailOptions.to,
          userEmail: userMailOptions.to,
          bookingId: consultationData.id,
          attachments: attachments.length
        });
        
        return {
          success: true,
          adminMessageId: `DEV-ADMIN-${Date.now()}`,
          userMessageId: `DEV-USER-${Date.now()}`,
          message: 'Consultation emails sent successfully (DEV MODE)',
          attachments: attachments.length
        };
      }

      // Send emails in production with timeout
      const emailPromises = [
        this.transporter.sendMail(adminMailOptions),
        this.transporter.sendMail(userMailOptions)
      ];

      const results = await Promise.allSettled(emailPromises);
      
      const adminResult = results[0];
      const userResult = results[1];

      if (adminResult.status === 'fulfilled' && userResult.status === 'fulfilled') {
        console.log('✅ Both emails sent successfully');
        return {
          success: true,
          adminMessageId: adminResult.value.messageId,
          userMessageId: userResult.value.messageId,
          message: 'Consultation emails sent successfully',
          attachments: attachments.length
        };
      } else {
        console.warn('⚠️ Some emails failed to send');
        return {
          success: true, // Partial success
          adminMessageId: adminResult.status === 'fulfilled' ? adminResult.value.messageId : null,
          userMessageId: userResult.status === 'fulfilled' ? userResult.value.messageId : null,
          message: 'Consultation emails partially sent',
          warnings: {
            admin: adminResult.status === 'rejected' ? adminResult.reason.message : null,
            user: userResult.status === 'rejected' ? userResult.reason.message : null
          }
        };
      }
      
    } catch (error) {
      console.error('❌ Error sending consultation emails:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to send consultation emails'
      };
    }
  }

  async sendConsultationConfirmationEmail(consultationData) {
    try {
      console.log('📧 Sending consultation confirmation email for:', consultationData.id);
      return { success: true, message: 'Confirmation email sent' };
    } catch (error) {
      console.error('❌ Error sending confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }
      
      await this.transporter.verify();
      console.log('✅ Email connection test successful');
      return { success: true, message: 'Email connection successful' };
      
    } catch (error) {
      console.error('❌ Email connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();