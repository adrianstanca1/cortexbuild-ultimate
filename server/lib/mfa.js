const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * Generate a new TOTP secret (base32 encoded per RFC 6238).
 * @returns {string} Base32-encoded secret
 */
function generateSecret() {
  return authenticator.generateSecret();
}

/**
 * Generate QR code data URL for TOTP enrollment.
 * @param {string} secret - Base32-encoded TOTP secret
 * @param {string} email - User email (displayed in authenticator apps)
 * @param {string} issuer - Issuer name (default: 'CortexBuild')
 * @returns {Promise<string>} Data URL of QR code
 */
async function generateQRDataUrl(secret, email, issuer = 'CortexBuild') {
  const otpauthUrl = authenticator.keyuri(email, issuer, secret);
  return QRCode.toDataURL(otpauthUrl);
}

/**
 * Verify a TOTP token against a secret.
 * Allows ±1 step drift (30-second windows) per RFC 6238.
 * @param {string} secret - Base32-encoded TOTP secret
 * @param {string} token - 6-digit TOTP code to verify
 * @returns {boolean} True if token is valid
 */
function verifyToken(secret, token) {
  if (!secret || !token) return false;
  return authenticator.verify({
    secret,
    token,
    window: 1, // Allow ±1 step drift
  });
}

/**
 * Generate recovery codes (10 codes, 8 characters each, alphanumeric).
 * These are returned in plaintext to the user during enrollment.
 * @returns {string[]} Array of 10 recovery codes
 */
function generateRecoveryCodes() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    // 8 alphanumeric characters per code
    const code = crypto.randomBytes(6).toString('hex').toUpperCase().substring(0, 8);
    codes.push(code);
  }
  return codes;
}

/**
 * Hash an array of recovery codes using bcrypt.
 * @param {string[]} codes - Plaintext recovery codes
 * @returns {Promise<string[]>} Array of bcrypt-hashed codes
 */
async function hashRecoveryCodes(codes) {
  const hashed = [];
  for (const code of codes) {
    const hash = await bcrypt.hash(code, 12);
    hashed.push(hash);
  }
  return hashed;
}

/**
 * Verify and consume a recovery code.
 * @param {string} code - Plaintext recovery code entered by user
 * @param {string[]} hashedCodes - Bcrypt-hashed recovery codes from DB
 * @returns {Promise<{valid: boolean, remainingCodes: string[]}>}
 *  valid: true if code matches one of the hashed codes
 *  remainingCodes: updated array without the matched code
 */
async function consumeRecoveryCode(code, hashedCodes) {
  if (!hashedCodes || !Array.isArray(hashedCodes) || hashedCodes.length === 0) {
    return { valid: false, remainingCodes: hashedCodes };
  }

  for (let i = 0; i < hashedCodes.length; i++) {
    const matches = await bcrypt.compare(code, hashedCodes[i]);
    if (matches) {
      // Remove the used code from the array
      const remaining = hashedCodes.slice(0, i).concat(hashedCodes.slice(i + 1));
      return { valid: true, remainingCodes: remaining };
    }
  }

  return { valid: false, remainingCodes: hashedCodes };
}

module.exports = {
  generateSecret,
  generateQRDataUrl,
  verifyToken,
  generateRecoveryCodes,
  hashRecoveryCodes,
  consumeRecoveryCode,
};
