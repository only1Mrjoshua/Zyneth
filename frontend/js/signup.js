/* =========================
   CONFIG
========================= */
const host = window.location.hostname;

const isLocal =
  host === "localhost" ||
  host === "127.0.0.1" ||
  host === "0.0.0.0" ||
  host === "::1" ||
  host.endsWith(".local");

const API_BASE_URL = isLocal
  ? "http://localhost:8000"
  : "https://zyneth-backend.onrender.com";

const SIGNUP_ENDPOINT = `${API_BASE_URL}/users/signup`;
const VERIFY_OTP_ENDPOINT = `${API_BASE_URL}/users/verify-otp`;
const RESEND_OTP_ENDPOINT = `${API_BASE_URL}/users/resend-otp`;
const GOOGLE_AUTH_URL_ENDPOINT = `${API_BASE_URL}/users/auth/google`;
const GOOGLE_AUTH_CALLBACK_ENDPOINT = `${API_BASE_URL}/users/auth/google/callback`;

/* =========================
   TOAST NOTIFICATIONS
========================= */
class ToastNotification {
  constructor() {
    this.container = document.createElement("div");
    this.container.className = "toast-container";
    document.body.appendChild(this.container);
  }

  show(message, type = "info", title = "", duration = 5000) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
      success: "fa-check-circle",
      error: "fa-times-circle",
      info: "fa-info-circle",
    };

    toast.innerHTML = `
      <i class="fas ${icons[type]} toast-icon"></i>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ""}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => this.hide(toast));
    this.container.appendChild(toast);

    if (duration > 0) setTimeout(() => this.hide(toast), duration);
    return toast;
  }

  hide(toast) {
    toast.classList.add("hide");
    setTimeout(() => {
      if (toast.parentNode === this.container) this.container.removeChild(toast);
    }, 300);
  }

  success(message, title = "Success!") {
    return this.show(message, "success", title);
  }
  error(message, title = "Error!") {
    return this.show(message, "error", title);
  }
  info(message, title = "Info") {
    return this.show(message, "info", title);
  }
}

const toast = new ToastNotification();

/* =========================
   LOADING OVERLAY
========================= */
class LoadingOverlay {
  constructor() {
    this.overlay = document.createElement("div");
    this.overlay.className = "loading-overlay";
    this.overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Processing...</div>
    `;
    document.body.appendChild(this.overlay);
  }

  show(text = "Processing...") {
    this.overlay.querySelector(".loading-text").textContent = text;
    this.overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  hide() {
    this.overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
}

const loadingOverlay = new LoadingOverlay();

/* =========================
   AUTH HELPERS
========================= */
function clearAuthStorage() {
  localStorage.removeItem("user");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("token");
  localStorage.removeItem("token_expires_at");
}

function getRedirectUrlByRole(role) {
  return role === "admin" ? "admin-dashboard.html" : "dashboard.html";
}

/* =========================
   GOOGLE SIGNUP HANDLER
========================= */
class GoogleSignupHandler {
  constructor() {
    this.popupWindow = null;
    this.authComplete = false;
    this.popupCheckInterval = null;
    this.popupClosedByUser = false;
    this.googleBtn = document.getElementById("googleSignupBtn");
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Setup Google button click handler
    this.setupGoogleButton();
    
    // Handle messages from popup
    window.addEventListener('message', this.handlePopupMessage.bind(this));
  }

  setupGoogleButton() {
    if (!this.googleBtn) {
      console.error("Google signup button not found!");
      return;
    }

    // Remove any existing event listeners
    const newButton = this.googleBtn.cloneNode(true);
    this.googleBtn.parentNode.replaceChild(newButton, this.googleBtn);
    this.googleBtn = newButton;
    
    // Add new event listener
    this.googleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleGoogleSignup();
    });
    
    console.log("Google signup button handler initialized");
  }

  handlePopupMessage(event) {
    // For security, in production you should check: 
    // if (event.origin !== window.location.origin) return;
    
    const data = event.data;
    
    if (data && data.type === 'GOOGLE_AUTH_SUCCESS') {
      console.log('Google auth success, code received');
      this.authComplete = true;
      this.handleGoogleAuthSuccess(data.code);
    } else if (data && data.type === 'GOOGLE_AUTH_ERROR') {
      console.error('Google auth error from popup:', data.message);
      toast.error(data.message || 'Google authentication failed', 'Error');
      this.resetGoogleButton();
      loadingOverlay.hide();
    }
  }

  async handleGoogleSignup() {
    console.log("Google Sign-up button clicked");
    
    // Show loading
    loadingOverlay.show("Connecting to Google...");
    
    // Store button state
    const originalHTML = this.googleBtn.innerHTML;
    this.googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Connecting...</span>';
    this.googleBtn.disabled = true;
    
    try {
      // Get Google OAuth URL from backend
      const response = await fetch(GOOGLE_AUTH_URL_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get Google auth URL (Status: ${response.status})`);
      }

      const data = await response.json();
      
      if (!data.auth_url) {
        throw new Error("No auth URL returned from server");
      }
      
      console.log("Google auth URL received");
      
      // Open Google OAuth in a popup
      this.openGooglePopup(data.auth_url);
      
    } catch (error) {
      console.error("Google auth error:", error);
      toast.error("Failed to start Google sign-up: " + error.message, "Error");
      this.resetGoogleButton(originalHTML);
      loadingOverlay.hide();
    }
  }

  openGooglePopup(authUrl) {
    // Close any existing popup
    if (this.popupWindow && !this.popupWindow.closed) {
      try {
        this.popupWindow.close();
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Reset state
    this.authComplete = false;
    this.popupClosedByUser = false;
    
    // Calculate centered position
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    console.log("Opening Google popup");
    
    // Open popup - don't set noopener/noreferrer to allow communication
    this.popupWindow = window.open(
      authUrl,
      "GoogleSignUp",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );
    
    if (!this.popupWindow) {
      toast.error("Popup blocked. Please allow popups for this site.", "Popup Blocked");
      this.resetGoogleButton();
      loadingOverlay.hide();
      return;
    }
    
    // Monitor popup with timeout (not using postMessage ping)
    this.startPopupMonitoring();
  }

  startPopupMonitoring() {
    // Clear any existing interval
    if (this.popupCheckInterval) {
      clearInterval(this.popupCheckInterval);
    }
    
    // Simple timeout approach
    const startTime = Date.now();
    const timeoutDuration = 120000; // 2 minutes
    
    this.popupCheckInterval = setInterval(() => {
      if (this.authComplete) {
        clearInterval(this.popupCheckInterval);
        return;
      }
      
      // Check if timeout exceeded
      if (Date.now() - startTime > timeoutDuration) {
        clearInterval(this.popupCheckInterval);
        this.handlePopupTimeout();
      }
    }, 1000);
  }

  handlePopupTimeout() {
    this.popupWindow = null;
    
    // Only show timeout if auth wasn't completed
    if (!this.authComplete) {
      toast.error('Sign-up timed out. Please try again.', 'Timeout');
      this.resetGoogleButton();
      loadingOverlay.hide();
    }
  }

  async handleGoogleAuthSuccess(code) {
    try {
      loadingOverlay.show("Completing Google sign-up...");
      
      console.log('Processing Google auth code');
      
      // Try with the correct endpoint
      const response = await fetch(GOOGLE_AUTH_CALLBACK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code
        })
      });
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid server response from Google auth');
      }
      
      if (!response.ok) {
        console.error('Google auth failed - Server response:', responseData);
        
        // Special handling for the "from_mongo" error
        if (responseData.detail && responseData.detail.includes('from_mongo')) {
          throw new Error('Backend configuration error. Please contact support.');
        }
        
        const errorMessage = responseData.detail || 
                            responseData.message || 
                            responseData.error || 
                            `Google authentication failed (Status: ${response.status})`;
        throw new Error(errorMessage);
      }
      
      console.log('Google auth successful:', responseData);
      
      // Validate response structure
      if (!responseData.access_token || !responseData.user) {
        console.error('Invalid response structure:', responseData);
        throw new Error('Invalid response from server - missing token or user data');
      }
      
      // Store auth data
      localStorage.setItem("token", responseData.access_token);
      localStorage.setItem("user", JSON.stringify(responseData.user));
      localStorage.setItem("isAuthenticated", "true");
      
      if (responseData.expires_in) {
        const expiresAt = Date.now() + responseData.expires_in * 1000;
        localStorage.setItem("token_expires_at", String(expiresAt));
      }
      
      // Show success message
      if (responseData.is_new_user) {
        toast.success("Account created successfully! Welcome to Zyneth!", "Welcome!");
      } else {
        toast.success("Welcome back!", "Signed In");
      }
      
      // Reset button
      this.resetGoogleButton();
      
      // Redirect based on role
      const redirectUrl = getRedirectUrlByRole(responseData.user.role);
      
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
      
    } catch (error) {
      console.error('Google auth processing error:', error);
      toast.error(error.message || 'Google authentication failed', 'Error');
      clearAuthStorage();
      this.resetGoogleButton();
    } finally {
      loadingOverlay.hide();
    }
  }

  resetGoogleButton() {
    if (this.googleBtn) {
      this.googleBtn.innerHTML = '<i class="fab fa-google"></i><span>Sign up with Google</span>';
      this.googleBtn.disabled = false;
    }
  }
}

/* =========================
   OTP TIMER
========================= */
class OTPTimer {
  constructor(onTimerEnd, onTimerUpdate) {
    this.timeLeft = 120; // 2 minutes in seconds
    this.timerInterval = null;
    this.onTimerEnd = onTimerEnd;
    this.onTimerUpdate = onTimerUpdate;
  }

  start() {
    this.stop(); // Clear any existing timer
    this.timeLeft = 120;
    this.updateDisplay();
    
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();
      
      if (this.timeLeft <= 0) {
        this.stop();
        if (this.onTimerEnd) this.onTimerEnd();
      }
    }, 1000);
  }

  stop() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
      countdownElement.textContent = display;
      
      // Change color when time is running low
      if (this.timeLeft < 30) {
        countdownElement.style.color = 'var(--error)';
      } else if (this.timeLeft < 60) {
        countdownElement.style.color = '#FFA500';
      } else {
        countdownElement.style.color = 'var(--light)';
      }
    }
    
    if (this.onTimerUpdate) {
      this.onTimerUpdate(this.timeLeft);
    }
  }

  reset() {
    this.stop();
    this.timeLeft = 120;
    this.updateDisplay();
  }
}

/* =========================
   OTP INPUT HANDLER
========================= */
class OTPInputHandler {
  constructor() {
    this.inputs = document.querySelectorAll('.otp-input');
    this.initialize();
  }

  initialize() {
    this.inputs.forEach((input, index) => {
      // Handle input
      input.addEventListener('input', (e) => this.handleInput(e, index));
      input.addEventListener('keydown', (e) => this.handleKeyDown(e, index));
      input.addEventListener('paste', (e) => this.handlePaste(e));
      input.addEventListener('focus', () => input.classList.add('filled'));
      input.addEventListener('blur', () => {
        if (!input.value) input.classList.remove('filled');
      });
    });
  }

  handleInput(e, index) {
    const input = e.target;
    const value = input.value;
    
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      input.value = '';
      return;
    }
    
    // Auto-focus next input
    if (value.length === 1 && index < this.inputs.length - 1) {
      this.inputs[index + 1].focus();
    }
    
    // Toggle filled class
    if (value) {
      input.classList.add('filled');
    } else {
      input.classList.remove('filled');
    }
  }

  handleKeyDown(e, index) {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!this.inputs[index].value && index > 0) {
        this.inputs[index - 1].focus();
        this.inputs[index - 1].value = '';
        this.inputs[index - 1].classList.remove('filled');
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      this.inputs[index - 1].focus();
      e.preventDefault();
    }
    
    if (e.key === 'ArrowRight' && index < this.inputs.length - 1) {
      this.inputs[index + 1].focus();
      e.preventDefault();
    }
  }

  handlePaste(e) {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    
    if (/^\d+$/.test(pasteData)) {
      const digits = pasteData.split('');
      this.inputs.forEach((input, index) => {
        if (index < digits.length) {
          input.value = digits[index];
          input.classList.add('filled');
        } else {
          input.value = '';
          input.classList.remove('filled');
        }
      });
      
      // Focus the last filled input
      const lastFilledIndex = Math.min(digits.length, this.inputs.length) - 1;
      this.inputs[lastFilledIndex].focus();
    }
  }

  getOTP() {
    return Array.from(this.inputs).map(input => input.value).join('');
  }

  clear() {
    this.inputs.forEach(input => {
      input.value = '';
      input.classList.remove('filled');
    });
    this.inputs[0].focus();
  }

  setLoading(isLoading) {
    this.inputs.forEach(input => {
      input.disabled = isLoading;
      input.style.opacity = isLoading ? '0.7' : '1';
      input.style.cursor = isLoading ? 'not-allowed' : 'text';
    });
  }
}

/* =========================
   MAIN SIGNUP HANDLER WITH OTP
========================= */
class SignupHandler {
  constructor() {
    this.form = document.getElementById("signupForm");
    this.otpForm = document.getElementById("otpForm");
    this.signupWrapper = document.getElementById("signupWrapper");
    this.otpWrapper = document.getElementById("otpWrapper");
    
    this.signupBtn = document.getElementById("signupBtn");
    this.verifyOtpBtn = document.getElementById("verifyOtpBtn");
    this.resendOtpBtn = document.getElementById("resendOtpBtn");
    this.backToSignupBtn = document.getElementById("backToSignup");
    this.terms = document.getElementById("terms");

    this.fullName = document.getElementById("fullName");
    this.username = document.getElementById("username");
    this.email = document.getElementById("email");
    this.password = document.getElementById("password");
    this.confirmPassword = document.getElementById("confirmPassword");
    this.userEmailElement = document.getElementById("userEmail");

    this.togglePasswordBtn = document.getElementById("togglePassword");
    this.toggleConfirmPasswordBtn = document.getElementById("toggleConfirmPassword");

    this.fullNameError = document.getElementById("fullNameError");
    this.usernameError = document.getElementById("usernameError");
    this.emailError = document.getElementById("emailError");
    this.passwordError = document.getElementById("passwordError");
    this.confirmPasswordError = document.getElementById("confirmPasswordError");
    this.otpError = document.getElementById("otpError");

    this.otpTimer = null;
    this.otpInputHandler = null;
    this.userEmail = null;

    this.initialize();
  }

  initialize() {
    // Signup form events
    if (this.form) {
      this.form.addEventListener("submit", (e) => this.handleSignupSubmit(e));
    }

    // OTP form events
    if (this.otpForm) {
      this.otpForm.addEventListener("submit", (e) => this.handleOTPSubmit(e));
    }

    // Button events
    this.resendOtpBtn?.addEventListener("click", () => this.handleResendOTP());
    this.backToSignupBtn?.addEventListener("click", () => this.showSignupForm());

    // Toggle password visibility
    this.togglePasswordBtn?.addEventListener("click", () => this.toggleVisibility(this.password, this.togglePasswordBtn));
    this.toggleConfirmPasswordBtn?.addEventListener("click", () =>
      this.toggleVisibility(this.confirmPassword, this.toggleConfirmPasswordBtn)
    );

    // Initialize Google signup handler
    new GoogleSignupHandler();

    // Re-validate on input
    [this.fullName, this.username, this.email, this.password, this.confirmPassword].forEach((el) => {
      el?.addEventListener("input", () => this.updateButtonState());
      el?.addEventListener("blur", () => this.updateButtonState());
    });

    this.terms?.addEventListener("change", () => this.updateButtonState());

    // Initialize OTP input handler
    if (this.otpForm) {
      this.otpInputHandler = new OTPInputHandler();
    }

    this.updateButtonState();
  }

  showSignupForm() {
    this.signupWrapper.classList.remove('slide-out');
    this.otpWrapper.classList.remove('slide-in');
    
    this.signupWrapper.style.display = 'block';
    this.otpWrapper.style.display = 'none';
    
    // Reset OTP form
    if (this.otpInputHandler) {
      this.otpInputHandler.clear();
    }
    this.clearFieldError(this.otpError);
    
    // Stop timer
    if (this.otpTimer) {
      this.otpTimer.stop();
    }
  }

  showOTPForm(email) {
    this.userEmail = email;
    
    // Update email in OTP subtitle
    if (this.userEmailElement) {
      this.userEmailElement.textContent = email;
    }
    
    // Animate transition
    this.signupWrapper.classList.add('slide-out');
    
    setTimeout(() => {
      this.signupWrapper.style.display = 'none';
      this.otpWrapper.style.display = 'block';
      this.otpWrapper.classList.add('slide-in');
      
      // Focus first OTP input
      const firstOtpInput = document.querySelector('.otp-input');
      if (firstOtpInput) {
        setTimeout(() => firstOtpInput.focus(), 300);
      }
      
      // Start OTP timer
      this.startOTPTimer();
    }, 300);
  }

  startOTPTimer() {
    if (this.otpTimer) {
      this.otpTimer.stop();
    }
    
    this.otpTimer = new OTPTimer(
      () => {
        // Timer ended
        this.resendOtpBtn.disabled = false;
        this.resendOtpBtn.textContent = "Resend Code";
      },
      (timeLeft) => {
        // Update timer
        this.resendOtpBtn.disabled = timeLeft > 0;
        if (timeLeft > 0) {
          this.resendOtpBtn.textContent = `Resend Code (${Math.ceil(timeLeft/60)} min)`;
        }
      }
    );
    
    this.otpTimer.start();
  }

  toggleVisibility(input, btn) {
    if (!input || !btn) return;
    const icon = btn.querySelector("i");
    input.type = input.type === "password" ? "text" : "password";

    if (!icon) return;
    if (input.type === "text") {
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  }

  showFieldError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
  }

  clearFieldError(el) {
    if (!el) return;
    el.textContent = "";
    el.style.display = "none";
  }

  validateSignup() {
    let ok = true;

    const fullName = this.fullName?.value.trim() || "";
    const username = this.username?.value.trim() || "";
    const email = this.email?.value.trim() || "";
    const password = this.password?.value || "";
    const confirmPassword = this.confirmPassword?.value || "";
    const termsChecked = this.terms?.checked || false;

    // clear old errors
    this.clearFieldError(this.fullNameError);
    this.clearFieldError(this.usernameError);
    this.clearFieldError(this.emailError);
    this.clearFieldError(this.passwordError);
    this.clearFieldError(this.confirmPasswordError);

    if (!fullName || fullName.length < 2) {
      this.showFieldError(this.fullNameError, "Full name is required");
      ok = false;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      this.showFieldError(this.usernameError, "Username must be 3-20 characters (letters, numbers, underscores)");
      ok = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showFieldError(this.emailError, "Please enter a valid email address");
      ok = false;
    }

    // match backend rule (min 6)
    if (!password || password.length < 6) {
      this.showFieldError(this.passwordError, "Password must be at least 6 characters");
      ok = false;
    }

    if (!confirmPassword) {
      this.showFieldError(this.confirmPasswordError, "Please confirm your password");
      ok = false;
    } else if (confirmPassword !== password) {
      this.showFieldError(this.confirmPasswordError, "Passwords do not match");
      ok = false;
    }

    if (!termsChecked) {
      ok = false;
    }

    return ok;
  }

  validateOTP() {
    const otp = this.otpInputHandler?.getOTP() || '';
    this.clearFieldError(this.otpError);
    
    if (!otp || otp.length !== 6) {
      this.showError("Please enter the 6-digit verification code");
      return false;
    }
    
    if (!/^\d{6}$/.test(otp)) {
      this.showError("Verification code must contain only numbers");
      return false;
    }
    
    return true;
  }

  showError(message) {
    this.otpError.textContent = message;
    this.otpError.style.display = 'block';
    this.otpForm.classList.add('shake');
    
    setTimeout(() => {
      this.otpForm.classList.remove('shake');
    }, 500);
  }

  updateButtonState() {
    const valid = this.validateSignup();

    if (!this.signupBtn) return;
    this.signupBtn.disabled = !valid;
    this.signupBtn.style.opacity = valid ? "1" : "0.7";
    this.signupBtn.style.cursor = valid ? "pointer" : "not-allowed";
  }

  setLoading(isLoading, isOTP = false) {
    if (isOTP) {
      if (!this.verifyOtpBtn) return;
      
      if (isLoading) {
        this.verifyOtpBtn.disabled = true;
        this.verifyOtpBtn.classList.add('loading');
        this.verifyOtpBtn.innerHTML = '<span>Verifying...</span>';
        this.verifyOtpBtn.style.opacity = "0.7";
        if (this.otpInputHandler) this.otpInputHandler.setLoading(true);
        if (this.resendOtpBtn) this.resendOtpBtn.disabled = true;
      } else {
        this.verifyOtpBtn.disabled = false;
        this.verifyOtpBtn.classList.remove('loading');
        this.verifyOtpBtn.innerHTML = '<span>Verify Email</span><i class="fas fa-check-circle"></i>';
        this.verifyOtpBtn.style.opacity = "1";
        if (this.otpInputHandler) this.otpInputHandler.setLoading(false);
        if (this.resendOtpBtn) this.resendOtpBtn.disabled = this.otpTimer?.timeLeft > 0;
      }
    } else {
      if (!this.signupBtn) return;

      if (isLoading) {
        this.signupBtn.disabled = true;
        this.signupBtn.innerHTML = '<span>Creating Account...</span>';
        this.signupBtn.style.opacity = "0.7";
      } else {
        this.signupBtn.disabled = false;
        this.signupBtn.innerHTML = '<span>Create Account</span><i class="fas fa-arrow-right"></i>';
        this.signupBtn.style.opacity = "1";
        this.updateButtonState();
      }
    }
  }

  async handleSignupSubmit(e) {
    e.preventDefault();

    if (!this.validateSignup()) {
      this.form.classList.add("shake");
      setTimeout(() => this.form.classList.remove("shake"), 500);
      return;
    }

    this.setLoading(true, false);

    try {
      const formData = new FormData();
      formData.append("full_name", this.fullName.value.trim());
      formData.append("username", this.username.value.trim());
      formData.append("email", this.email.value.trim());
      formData.append("password", this.password.value);
      formData.append("confirm_password", this.confirmPassword.value);

      const response = await fetch(SIGNUP_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        const msg = data?.detail || data?.message || data?.error || `Signup failed`;
        throw new Error(msg);
      }

      // ✅ Signup successful - Show OTP form
      clearAuthStorage();
      
      const userEmail = this.email.value.trim();
      this.showOTPForm(userEmail);
      
      toast.success("Verification code sent to your email!", "Check Your Email");
      
    } catch (err) {
      toast.error(err.message || "Network error. Please try again.", "Signup Failed");

      this.form.classList.add("shake");
      setTimeout(() => this.form.classList.remove("shake"), 500);
    } finally {
      this.setLoading(false, false);
    }
  }

  async handleOTPSubmit(e) {
    e.preventDefault();

    if (!this.validateOTP()) {
      return;
    }

    this.setLoading(true, true);

    try {
      const otp = this.otpInputHandler.getOTP();
      
      const formData = new FormData();
      formData.append("email", this.userEmail);
      formData.append("otp_code", otp);

      const response = await fetch(VERIFY_OTP_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        const msg = data?.detail || data?.message || data?.error || `Verification failed (Status: ${response.status})`;
        throw new Error(msg);
      }

      // ✅ OTP verification successful
      this.verifyOtpBtn.classList.add('otp-success');
      this.verifyOtpBtn.innerHTML = '<span>Verified! ✓</span>';
      
      toast.success("Email verified successfully! You can now login.", "Verified!");
      
      // Clear form
      this.form.reset();
      
      // Redirect to signin after success
      setTimeout(() => {
        window.location.href = "signin.html";
      }, 2000);
      
    } catch (err) {
      toast.error(err.message || "Invalid verification code. Please try again.", "Verification Failed");

      // Clear OTP inputs on error
      this.otpInputHandler.clear();
    } finally {
      this.setLoading(false, true);
    }
  }

  async handleResendOTP() {
    if (!this.userEmail) return;
    
    this.setLoading(true, true);
    this.resendOtpBtn.disabled = true;
    this.resendOtpBtn.textContent = "Sending...";

    try {
      const formData = new FormData();
      formData.append("email", this.userEmail);

      const response = await fetch(RESEND_OTP_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        const msg = data?.detail || data?.message || data?.error || `Failed to resend code`;
        throw new Error(msg);
      }

      // ✅ OTP resent successfully
      toast.success("New verification code sent to your email!", "Code Resent");
      
      // Reset timer and clear OTP inputs
      this.otpTimer.reset();
      this.startOTPTimer();
      this.otpInputHandler.clear();
      this.clearFieldError(this.otpError);
      
    } catch (err) {
      toast.error(err.message || "Failed to resend code. Please try again.", "Error");
    } finally {
      this.setLoading(false, true);
    }
  }
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("Sign-up page loaded");
  new SignupHandler();
});

/* =========================
   STYLES
========================= */
const style = document.createElement("style");
style.textContent = `
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 350px;
  width: 100%;
}

.toast {
  padding: 16px 20px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.95);
  border-left: 4px solid;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  transform: translateX(100%);
  opacity: 0;
  animation: slideIn 0.3s forwards;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
}

.toast.success { border-left-color: #10B981; }
.toast.error { border-left-color: #EF4444; }
.toast.info { border-left-color: #3B82F6; }

.toast-icon { font-size: 1.2rem; flex-shrink: 0; }
.toast.success .toast-icon { color: #10B981; }
.toast.error .toast-icon { color: #EF4444; }
.toast.info .toast-icon { color: #3B82F6; }

.toast-content { flex: 1; }
.toast-title { font-weight: 600; margin-bottom: 4px; color: var(--light); font-size: 1rem; }
.toast-message { font-size: 0.9rem; color: var(--light-gray); line-height: 1.4; }

.toast-close {
  background: none;
  border: none;
  color: var(--gray);
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}
.toast-close:hover { color: var(--light); }

@keyframes slideIn { to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { to { transform: translateX(100%); opacity: 0; } }
.toast.hide { animation: slideOut 0.3s forwards; }

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(10, 31, 68, 0.95);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 9998;
  flex-direction: column;
  gap: 20px;
  backdrop-filter: blur(5px);
}
.loading-overlay.active { display: flex; }

.loading-spinner {
  width: 60px; height: 60px;
  border: 4px solid rgba(255, 215, 0, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.loading-text { color: var(--light); font-size: 1.2rem; font-weight: 500; }

@keyframes shake {
  0%,100% { transform: translateX(0); }
  10%,30%,50%,70%,90% { transform: translateX(-5px); }
  20%,40%,60%,80% { transform: translateX(5px); }
}
.shake { animation: shake 0.5s ease-in-out; }

/* Google button loading state */
.btn-google.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

/* OTP Success Animation */
@keyframes otpSuccess {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.otp-success {
  animation: otpSuccess 0.5s ease;
}

/* Loading State for Verify Button */
#verifyOtpBtn.loading {
  position: relative;
  color: transparent;
}

#verifyOtpBtn.loading::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(10, 31, 68, 0.3);
  border-top-color: var(--secondary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .toast-container { top: 80px; right: 10px; left: 10px; max-width: none; }
  .toast { padding: 14px 16px; }
  .loading-spinner { width: 50px; height: 50px; }
  .loading-text { font-size: 1rem; }
}
`;
document.head.appendChild(style);