// middleware/validation.js - Enhanced with Consultation Validation
const validationRules = {
  name: (value) => {
    if (!value || typeof value !== 'string') return { valid: false, message: 'Name is required' };
    const trimmed = value.trim();
    if (trimmed.length < 2) return { valid: false, message: 'Name must be at least 2 characters' };
    if (trimmed.length > 50) return { valid: false, message: 'Name must be less than 50 characters' };
    if (!/^[a-zA-Z\s]+$/.test(trimmed)) return { valid: false, message: 'Name can only contain letters and spaces' };
    return { valid: true, message: 'Valid name' };
  },
  
  age: (value) => {
    const age = parseInt(value);
    if (isNaN(age)) return { valid: false, message: 'Age must be a number' };
    if (age < 16) return { valid: false, message: 'Age must be at least 16 years' };
    if (age > 65) return { valid: false, message: 'Age must be less than 65 years' };
    return { valid: true, message: 'Valid age' };
  },
  
  email: (value) => {
    if (!value || typeof value !== 'string') return { valid: false, message: 'Email is required' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return { valid: false, message: 'Please enter a valid email address' };
    return { valid: true, message: 'Valid email' };
  },

  // ✅ NEW: Phone validation
  phone: (value) => {
    if (!value || typeof value !== 'string') return { valid: false, message: 'Phone number is required' };
    const phoneRegex = /^[0-9]{10}$/;
    const cleanPhone = value.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) return { valid: false, message: 'Please enter a valid 10-digit phone number' };
    return { valid: true, message: 'Valid phone number' };
  },

  // ✅ NEW: Education validation
  education: (value) => {
    if (!value || typeof value !== 'string') return { valid: false, message: 'Education details are required' };
    const trimmed = value.trim();
    if (trimmed.length < 5) return { valid: false, message: 'Please provide more education details' };
    if (trimmed.length > 200) return { valid: false, message: 'Education details too long' };
    return { valid: true, message: 'Valid education details' };
  },

  // ✅ NEW: Career goals validation
  careerGoals: (value) => {
    if (!value || typeof value !== 'string') return { valid: false, message: 'Career goals are required' };
    const trimmed = value.trim();
    if (trimmed.length < 10) return { valid: false, message: 'Please describe your career goals in more detail' };
    if (trimmed.length > 500) return { valid: false, message: 'Career goals description too long' };
    return { valid: true, message: 'Valid career goals' };
  },
  
  date: (value) => {
    if (!value || typeof value !== 'string') return { valid: false, message: 'Date is required' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { valid: false, message: 'Date must be in YYYY-MM-DD format' };
    
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return { valid: false, message: 'Please select a future date' };
    
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    if (date > sixMonthsFromNow) return { valid: false, message: 'Please select a date within 6 months' };
    
    return { valid: true, message: 'Valid date' };
  }
};

const validateInput = (req, res, next) => {
  try {
    const { field, value, validationType } = req.body;
    
    console.log(`🔍 Validating ${field} with type ${validationType}:`, value);
    
    if (!validationType || !validationRules[validationType]) {
      req.validationResult = { valid: true, message: 'No validation required' };
      return next();
    }
    
    const validationResult = validationRules[validationType](value);
    req.validationResult = validationResult;
    
    console.log(`✅ Validation result for ${field}:`, validationResult);
    next();
    
  } catch (error) {
    console.error('❌ Validation middleware error:', error);
    req.validationResult = { valid: false, message: 'Validation error occurred' };
    next();
  }
};

// ✅ NEW: Consultation form validation middleware
const validateConsultationForm = (req, res, next) => {
  try {
    const errors = [];
    const formData = req.body;

    console.log('🔍 Validating consultation form data...');

    // Required field validations
    const requiredFields = [
      { field: 'fullName', rule: 'name' },
      { field: 'email', rule: 'email' },
      { field: 'phone', rule: 'phone' },
      { field: 'age', rule: 'age' },
      { field: 'education', rule: 'education' },
    ];

    requiredFields.forEach(({ field, rule }) => {
      if (!formData[field]) {
        errors.push(`${field} is required`);
      } else {
        const validation = validationRules[rule](formData[field]);
        if (!validation.valid) {
          errors.push(`${field}: ${validation.message}`);
        }
      }
    });

        // ✅ NEW: Optional validation for careerGoals - only validate if provided
    if (formData.careerGoals && formData.careerGoals.trim() !== '') {
      const validation = validationRules.careerGoals(formData.careerGoals);
      if (!validation.valid) {
        errors.push(`careerGoals: ${validation.message}`);
      }
    }

    // Validate optional fields if provided
    if (formData.experience && formData.experience.trim().length > 1000) {
      errors.push('Experience description too long (max 1000 characters)');
    }

    if (formData.additionalInfo && formData.additionalInfo.trim().length > 500) {
      errors.push('Additional information too long (max 500 characters)');
    }

    // Validate enum fields
    const validStatuses = ['student', 'graduate', 'working', 'jobseeker', 'entrepreneur'];
    if (formData.currentStatus && !validStatuses.includes(formData.currentStatus)) {
      errors.push('Invalid current status');
    }

    const validModes = ['online', 'offline', 'phone'];
    if (formData.preferredMode && !validModes.includes(formData.preferredMode)) {
      errors.push('Invalid preferred mode');
    }

    const validTimes = ['morning', 'afternoon', 'evening'];
    if (formData.preferredTime && !validTimes.includes(formData.preferredTime)) {
      errors.push('Invalid preferred time');
    }

    if (errors.length > 0) {
      console.error('❌ Consultation form validation failed:', errors);
      return res.status(400).json({
        success: false,
        message: 'Form validation failed',
        errors
      });
    }

    console.log('✅ Consultation form validation passed');
    next();

  } catch (error) {
    console.error('❌ Consultation validation middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation error occurred',
      error: error.message
    });
  }
};

module.exports = { 
  validateInput, 
  validationRules,
  validateConsultationForm // ✅ NEW export
};
