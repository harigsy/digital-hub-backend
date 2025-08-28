// utils/emailService.js - Email Service Utilities
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || 'your-email@gmail.com',
          pass: process.env.SMTP_PASS || 'your-app-password'
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      console.log('✅ Email transporter initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing email transporter:', error);
    }
  }

  // Generate German Program Email Template
  generateGermanProgramEmailTemplate(emailData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🇩🇪 New German Work Program Application</h1>
          <p style="margin: 10px 0 0 0;">Payana Overseas Solutions</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
            Application Details
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background: #e2e8f0;">
              <td style="padding: 12px; font-weight: bold; border: 1px solid #cbd5e1;">👤 Name:</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${emailData.name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; border: 1px solid #cbd5e1;">🎂 Age:</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${emailData.age}</td>
            </tr>
            <tr style="background: #e2e8f0;">
              <td style="padding: 12px; font-weight: bold; border: 1px solid #cbd5e1;">📧 Email:</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${emailData.email}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; border: 1px solid #cbd5e1;">🎯 Purpose:</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${emailData.purpose}</td>
            </tr>
            <tr style="background: #e2e8f0;">
              <td style="padding: 12px; font-weight: bold; border: 1px solid #cbd5e1;">📘 Passport:</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${emailData.passport}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; border: 1px solid #cbd5e1;">📄 Resume:</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${emailData.resume_upload || 'Not provided'}</td>
            </tr>
            <tr style="background: #e2e8f0;">
              <td style="padding: 12px; font-weight: bold; border: 1px solid #cbd5e1;">🎓 Qualification:</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${emailData.qualification}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; border: 1px solid #cbd5e1;">💼 Experience:</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${emailData.experience}</td>
            </tr>
            <tr style="background: #e2e8f0;">
              <td style="padding: 12px; font-weight: bold; border: 1px solid #cbd5e1;">🇩🇪 German Language:</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${emailData.germanLanguage}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; border: 1px solid #cbd5e1;">📋 Continue Program:</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${emailData.continueProgram || 'Not answered'}</td>
            </tr>
            <tr style="background: #e2e8f0;">
              <td style="padding: 12px; font-weight: bold; border: 1px solid #cbd5e1;">⏰ Submitted:</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
          
          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-top: 30px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0;">📞 Next Steps:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
              <li>Our team will review the application within 24 hours</li>
              <li>We'll contact ${emailData.name} at ${emailData.email}</li>
              <li>Prepare for initial consultation call</li>
            </ul>
          </div>
        </div>
        
        <div style="background: #374151; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0;">© 2025 Payana Overseas Solutions | +91 9003619777</p>
        </div>
      </div>
    `;
  }

  // Send German Program Email
  async sendGermanProgramEmail(emailData) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const htmlContent = this.generateGermanProgramEmailTemplate(emailData);
      
      const mailOptions = {
        from: `"Payana Overseas" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL || 'admin@payanaoverseaa.com',
        cc: emailData.email,
        subject: `🇩🇪 New German Program Application - ${emailData.name}`,
        html: htmlContent,
        text: `
          New German Work Program Application
          
          Name: ${emailData.name}
          Age: ${emailData.age}
          Email: ${emailData.email}
          Purpose: ${emailData.purpose}
          Passport: ${emailData.passport}
          Resume: ${emailData.resume_upload || 'Not provided'}
          Qualification: ${emailData.qualification}
          Experience: ${emailData.experience}
          German Language: ${emailData.germanLanguage}
          Continue Program: ${emailData.continueProgram || 'Not answered'}
          Submitted: ${new Date().toLocaleString()}
        `
      };
      
      // For development - just log the email
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Email content (DEV MODE):', {
          to: mailOptions.to,
          cc: mailOptions.cc,
          subject: mailOptions.subject,
          contentLength: htmlContent.length
        });
        
        return {
          success: true,
          messageId: `DEV-${Date.now()}`,
          message: 'Email sent successfully (DEV MODE)'
        };
      }
      
      // Send actual email in production
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ German Program email sent successfully:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully'
      };
      
    } catch (error) {
      console.error('❌ Error sending German Program email:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to send email'
      };
    }
  }

  // Test email connection
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