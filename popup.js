// Encryption key (in production, this should be securely stored)
const ENCRYPTION_KEY = 'your-secure-encryption-key';

document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const authModal = document.getElementById('authModal');
  const biometricAuthBtn = document.getElementById('biometricAuthBtn');
  const closeModal = document.querySelector('.close');
  
  // Form elements
  const siteInput = document.getElementById('site');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const saveBtn = document.getElementById('saveBtn');
  const generateBtn = document.getElementById('generateBtn');
  const passwordList = document.getElementById('passwordList');
  const strengthIndicator = document.getElementById('strengthIndicator');
  
  // OTP elements
  const otpService = document.getElementById('otpService');
  const otpSecret = document.getElementById('otpSecret');
  const addOtpBtn = document.getElementById('addOtpBtn');
  const otpList = document.getElementById('otpList');

  // Tab Navigation
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + 'Tab').classList.add('active');
    });
  });

  // Encryption functions
  function encrypt(text) {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  }

  function decrypt(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Password strength checker
  function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9]+/)) strength += 25;
    
    strengthIndicator.style.width = strength + '%';
    strengthIndicator.style.backgroundColor = 
      strength < 50 ? '#ff4444' :
      strength < 75 ? '#ffbb33' :
      '#00C851';
  }

  // Generate secure password
  function generatePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]|:;<>,.?/~';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // TOTP Generator
  function generateTOTP(secret) {
    const time = Math.floor(Date.now() / 30000);
    // Note: In production, implement actual TOTP algorithm
    return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  }

  // Save password
  saveBtn.onclick = async function() {
    const site = siteInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!site || !username || !password) return;

    const encryptedData = encrypt(JSON.stringify({
      username,
      password,
      timestamp: Date.now()
    }));

    try {
      const response = await fetch('https://your-api-endpoint/passwords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site,
          data: encryptedData
        })
      });

      if (response.ok) {
        loadPasswords();
        siteInput.value = '';
        usernameInput.value = '';
        passwordInput.value = '';
      }
    } catch (error) {
      console.error('Failed to save password:', error);
    }
  };

  // Generate password
  generateBtn.onclick = function() {
    const password = generatePassword();
    passwordInput.value = password;
    checkPasswordStrength(password);
  };

  // Password input listener
  passwordInput.addEventListener('input', function() {
    checkPasswordStrength(this.value);
  });

  // Add OTP
  addOtpBtn.onclick = async function() {
    const service = otpService.value.trim();
    const secret = otpSecret.value.trim();
    
    if (!service || !secret) return;

    const encryptedSecret = encrypt(secret);

    try {
      const response = await fetch('https://your-api-endpoint/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service,
          secret: encryptedSecret
        })
      });

      if (response.ok) {
        loadOTPTokens();
        otpService.value = '';
        otpSecret.value = '';
      }
    } catch (error) {
      console.error('Failed to save OTP:', error);
    }
  };

  // Biometric authentication
  async function authenticateWithBiometric() {
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          userVerification: "required",
        }
      });

      if (credential) {
        authModal.style.display = 'none';
        loadPasswords();
        loadOTPTokens();
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
    }
  }

  // Event listeners for authentication
  biometricAuthBtn.onclick = authenticateWithBiometric;
  closeModal.onclick = () => authModal.style.display = 'none';

  // Initial setup
  authModal.style.display = 'block';
  
  // Auto-refresh OTP tokens
  setInterval(() => {
    const otpElements = document.querySelectorAll('.otp-token');
    otpElements.forEach(element => {
      const secret = decrypt(element.dataset.secret);
      element.textContent = generateTOTP(secret);
    });
  }, 1000);
});
