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
  : "https://price-pulse-backend-ttv4.onrender.com";

const SIGNUP_ENDPOINT = `${API_BASE_URL}/users/signup`;

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
   HELPERS
========================= */
function clearAuthStorage() {
  localStorage.removeItem("user");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("token");
  localStorage.removeItem("token_expires_at");
}

/* =========================
   MAIN SIGNUP HANDLER
========================= */
class SignupHandler {
  constructor() {
    this.form = document.getElementById("signupForm");
    this.signupBtn = document.getElementById("signupBtn");
    this.googleBtn = document.getElementById("googleSignupBtn");
    this.terms = document.getElementById("terms");

    this.fullName = document.getElementById("fullName");
    this.username = document.getElementById("username");
    this.email = document.getElementById("email");
    this.password = document.getElementById("password");
    this.confirmPassword = document.getElementById("confirmPassword");

    this.togglePasswordBtn = document.getElementById("togglePassword");
    this.toggleConfirmPasswordBtn = document.getElementById("toggleConfirmPassword");

    this.fullNameError = document.getElementById("fullNameError");
    this.usernameError = document.getElementById("usernameError");
    this.emailError = document.getElementById("emailError");
    this.passwordError = document.getElementById("passwordError");
    this.confirmPasswordError = document.getElementById("confirmPasswordError");

    this.initialize();
  }

  initialize() {
    // Submit
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));

    // Toggles
    this.togglePasswordBtn?.addEventListener("click", () => this.toggleVisibility(this.password, this.togglePasswordBtn));
    this.toggleConfirmPasswordBtn?.addEventListener("click", () =>
      this.toggleVisibility(this.confirmPassword, this.toggleConfirmPasswordBtn)
    );

    // Google (placeholder)
    this.googleBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      toast.info("Google sign-up will be available soon!", "Coming Soon");
    });

    // Re-validate on input
    [this.fullName, this.username, this.email, this.password, this.confirmPassword].forEach((el) => {
      el?.addEventListener("input", () => this.updateButtonState());
      el?.addEventListener("blur", () => this.updateButtonState());
    });

    this.terms?.addEventListener("change", () => this.updateButtonState());

    this.updateButtonState();
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

  validate() {
    let ok = true;

    const fullName = this.fullName.value.trim();
    const username = this.username.value.trim();
    const email = this.email.value.trim();
    const password = this.password.value;
    const confirmPassword = this.confirmPassword.value;
    const termsChecked = this.terms.checked;

    // clear old
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

  updateButtonState() {
    const valid = this.validate();

    if (!this.signupBtn) return;
    this.signupBtn.disabled = !valid;
    this.signupBtn.style.opacity = valid ? "1" : "0.7";
    this.signupBtn.style.cursor = valid ? "pointer" : "not-allowed";
  }

  setLoading(isLoading) {
    if (!this.signupBtn) return;

    if (isLoading) {
      this.signupBtn.disabled = true;
      this.signupBtn.innerHTML = '<span>Creating Account...</span>';
      this.signupBtn.style.opacity = "0.7";
      if (this.googleBtn) this.googleBtn.disabled = true;
    } else {
      this.signupBtn.disabled = false;
      this.signupBtn.innerHTML = '<span>Create Account</span><i class="fas fa-arrow-right"></i>';
      this.signupBtn.style.opacity = "1";
      if (this.googleBtn) this.googleBtn.disabled = false;
      this.updateButtonState();
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validate()) {
      this.form.classList.add("shake");
      setTimeout(() => this.form.classList.remove("shake"), 500);
      return;
    }

    this.setLoading(true);

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
        const msg = data?.detail || data?.message || data?.error || `Signup failed (Status: ${response.status})`;
        throw new Error(msg);
      }

      // ✅ Signup success — DO NOT log in here
      clearAuthStorage();

      toast.success("Account created successfully! Please sign in.", "Success");

      this.form.reset();

      setTimeout(() => {
        window.location.href = "signin.html";
      }, 900);
    } catch (err) {
      toast.error(err.message || "Network error. Please try again.", "Signup Failed");

      this.form.classList.add("shake");
      setTimeout(() => this.form.classList.remove("shake"), 500);
    } finally {
      this.setLoading(false);
    }
  }
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
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

@keyframes shake {
  0%,100% { transform: translateX(0); }
  10%,30%,50%,70%,90% { transform: translateX(-5px); }
  20%,40%,60%,80% { transform: translateX(5px); }
}
.shake { animation: shake 0.5s ease-in-out; }

@media (max-width: 768px) {
  .toast-container { top: 80px; right: 10px; left: 10px; max-width: none; }
  .toast { padding: 14px 16px; }
}
`;
document.head.appendChild(style);