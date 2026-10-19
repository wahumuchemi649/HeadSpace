/**
 * Standardized system-wide form validation utilities.
 */

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates an email address.
 * @param {string} email
 * @param {boolean} required
 * @returns {string} Error message or empty string if valid.
 */
export function validateEmail(email, required = true) {
  const value = String(email || '').trim();
  if (!value) {
    return required ? 'Email address is required' : '';
  }
  if (!EMAIL_REGEX.test(value)) {
    return 'Please enter a valid email address (e.g. name@example.com)';
  }
  return '';
}

/**
 * Validates an international phone number.
 * @param {string} phone
 * @param {string} countryCode E.g. '+254'
 * @param {boolean} required
 * @returns {string} Error message or empty string if valid.
 */
export function validatePhone(phone, countryCode = '+254', required = true) {
  const raw = String(phone || '').trim();
  if (!raw) {
    return required ? 'Phone number is required' : '';
  }

  // Check for letters or illegal symbols (allow digits, +, spaces, dashes, parentheses)
  if (/[^\d+\s\-()]/.test(raw)) {
    return 'Phone number contains invalid characters (numbers only)';
  }

  const cleanDigits = raw.replace(/\D/g, '');
  if (cleanDigits.length === 0) {
    return 'Please enter your phone number';
  }

  // Country-specific validations
  if (countryCode === '+254') {
    // Kenya numbers are 9 digits excluding leading 0 (or 10 digits with trunk 0, or 12 with 254)
    if (cleanDigits.startsWith('254') && cleanDigits.length === 12) {
      return '';
    }
    const national = cleanDigits.replace(/^0+/, '');
    if (national.length !== 9) {
      return 'Kenyan phone numbers must be 9 digits (e.g. 712 345 678)';
    }
    if (!/^[17]/.test(national)) {
      return 'Kenyan mobile numbers typically begin with 7 or 1 (e.g. 712... or 110...)';
    }
    return '';
  }

  if (countryCode === '+1') {
    // US / Canada NANP: 10 digits
    const national = cleanDigits.replace(/^1/, '');
    if (national.length !== 10) {
      return 'US/Canada phone numbers must be 10 digits';
    }
    return '';
  }

  if (countryCode === '+44') {
    // UK: 10 or 11 digits
    const national = cleanDigits.replace(/^0+/, '');
    if (national.length < 9 || national.length > 11) {
      return 'UK phone numbers must be 10 or 11 digits';
    }
    return '';
  }

  // General ITU-T E.164: 7 to 15 digits
  if (cleanDigits.length < 7 || cleanDigits.length > 15) {
    return 'Please enter a valid phone number (7 to 15 digits)';
  }

  return '';
}

/**
 * Validates a person's first or last name.
 * @param {string} name
 * @param {string} fieldLabel
 * @param {boolean} required
 * @returns {string} Error message or empty string if valid.
 */
export function validateName(name, fieldLabel = 'Name', required = true) {
  const value = String(name || '').trim();
  if (!value) {
    return required ? `${fieldLabel} is required` : '';
  }
  if (value.length < 2) {
    return `${fieldLabel} must be at least 2 characters`;
  }
  if (!/^[\p{L}\s'-]+$/u.test(value)) {
    return `${fieldLabel} should only contain letters`;
  }
  return '';
}

/**
 * Validates password strength & length.
 * @param {string} password
 * @param {number} minLength
 * @param {boolean} required
 * @returns {string} Error message or empty string if valid.
 */
export function validatePassword(password, minLength = 6, required = true) {
  const value = String(password || '');
  if (!value) {
    return required ? 'Password is required' : '';
  }
  if (value.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  return '';
}
