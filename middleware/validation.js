// middleware/validation.js - Input Validation Middleware
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
  
  date: (value) => {
    if (!value || typeof value !== 'string') return { valid: false, message: 'Date is required' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { valid: false, message: 'Date must be in YYYY-MM-DD format' };
    
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates
    
    if (date < today) return { valid: false, message: 'Please select a future date' };
    
    // Check if date is too far in future (e.g., 6 months)
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

module.exports = { validateInput, validationRules };
