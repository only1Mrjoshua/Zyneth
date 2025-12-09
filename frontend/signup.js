document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const signupForm = document.getElementById('signupForm');
    const googleSignupBtn = document.getElementById('googleSignupBtn');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const signupBtn = document.getElementById('signupBtn');
    const termsCheckbox = document.getElementById('terms');
    
    // Form Fields
    const fullNameInput = document.getElementById('fullName');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    // Error Elements
    const fullNameError = document.getElementById('fullNameError');
    const usernameError = document.getElementById('usernameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    
    // Validation patterns
    const patterns = {
        username: /^[a-zA-Z0-9_]{3,20}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    };
    
    // Initialize
    initSignupPage();
    
    function initSignupPage() {
        // Navbar scroll effect
        window.addEventListener('scroll', function() {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
        
        // Toggle password visibility
        togglePasswordBtn.addEventListener('click', function() {
            togglePasswordVisibility(passwordInput, this);
        });
        
        toggleConfirmPasswordBtn.addEventListener('click', function() {
            togglePasswordVisibility(confirmPasswordInput, this);
        });
        
        // Real-time validation
        fullNameInput.addEventListener('input', validateFullName);
        usernameInput.addEventListener('input', validateUsername);
        emailInput.addEventListener('input', validateEmail);
        passwordInput.addEventListener('input', validatePassword);
        confirmPasswordInput.addEventListener('input', validateConfirmPassword);
        
        // Google Sign Up button
        googleSignupBtn.addEventListener('click', handleGoogleSignup);
        
        // Form submission
        signupForm.addEventListener('submit', handleSignup);
        
        // Terms checkbox validation
        termsCheckbox.addEventListener('change', function() {
            updateSignupButtonState();
        });
        
        // Initialize button state
        updateSignupButtonState();
    }
    
    function togglePasswordVisibility(passwordField, toggleButton) {
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);
        
        // Update icon
        const icon = toggleButton.querySelector('i');
        if (type === 'text') {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
    
    function validateFullName() {
        const value = fullNameInput.value.trim();
        const parent = fullNameInput.closest('.input-with-icon');
        
        if (!value) {
            showError(fullNameError, 'Full name is required');
            parent.classList.add('error');
            parent.classList.remove('success');
            return false;
        }
        
        if (value.length < 2) {
            showError(fullNameError, 'Name must be at least 2 characters');
            parent.classList.add('error');
            parent.classList.remove('success');
            return false;
        }
        
        clearError(fullNameError);
        parent.classList.remove('error');
        parent.classList.add('success');
        updateSignupButtonState();
        return true;
    }
    
    function validateUsername() {
        const value = usernameInput.value.trim();
        const parent = usernameInput.closest('.input-with-icon');
        
        if (!value) {
            showError(usernameError, 'Username is required');
            parent.classList.add('error');
            parent.classList.remove('success');
            return false;
        }
        
        if (!patterns.username.test(value)) {
            showError(usernameError, 'Username must be 3-20 characters (letters, numbers, underscores only)');
            parent.classList.add('error');
            parent.classList.remove('success');
            return false;
        }
        
        clearError(usernameError);
        parent.classList.remove('error');
        parent.classList.add('success');
        updateSignupButtonState();
        return true;
    }
    
    function validateEmail() {
        const value = emailInput.value.trim();
        const parent = emailInput.closest('.input-with-icon');
        
        if (!value) {
            showError(emailError, 'Email is required');
            parent.classList.add('error');
            parent.classList.remove('success');
            return false;
        }
        
        if (!patterns.email.test(value)) {
            showError(emailError, 'Please enter a valid email address');
            parent.classList.add('error');
            parent.classList.remove('success');
            return false;
        }
        
        clearError(emailError);
        parent.classList.remove('error');
        parent.classList.add('success');
        updateSignupButtonState();
        return true;
    }
    
    function validatePassword() {
        const value = passwordInput.value;
        const parent = passwordInput.closest('.input-with-icon');
        
        if (!value) {
            showError(passwordError, 'Password is required');
            parent.classList.add('error');
            parent.classList.remove('success');
            return false;
        }
        
        if (!patterns.password.test(value)) {
            showError(passwordError, 'Password must be at least 8 characters with uppercase, lowercase, number, and special character');
            parent.classList.add('error');
            parent.classList.remove('success');
            return false;
        }
        
        clearError(passwordError);
        parent.classList.remove('error');
        parent.classList.add('success');
        
        // Also validate confirm password if it has value
        if (confirmPasswordInput.value) {
            validateConfirmPassword();
        }
        
        updateSignupButtonState();
        return true;
    }
    
    function validateConfirmPassword() {
        const value = confirmPasswordInput.value;
        const parent = confirmPasswordInput.closest('.input-with-icon');
        
        if (!value) {
            showError(confirmPasswordError, 'Please confirm your password');
            parent.classList.add('error');
            parent.classList.remove('success');
            return false;
        }
        
        if (value !== passwordInput.value) {
            showError(confirmPasswordError, 'Passwords do not match');
            parent.classList.add('error');
            parent.classList.remove('success');
            return false;
        }
        
        clearError(confirmPasswordError);
        parent.classList.remove('error');
        parent.classList.add('success');
        updateSignupButtonState();
        return true;
    }
    
    function showError(errorElement, message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    function clearError(errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
    
    function updateSignupButtonState() {
        const isFormValid = 
            validateFullName() && 
            validateUsername() && 
            validateEmail() && 
            validatePassword() && 
            validateConfirmPassword() &&
            termsCheckbox.checked;
        
        signupBtn.disabled = !isFormValid;
        signupBtn.style.opacity = isFormValid ? '1' : '0.7';
        signupBtn.style.cursor = isFormValid ? 'pointer' : 'not-allowed';
    }
    
    function handleGoogleSignup(e) {
        e.preventDefault();
        
        // Add loading state
        googleSignupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Redirecting to Google...</span>';
        googleSignupBtn.disabled = true;
        
        // Simulate Google OAuth redirect (replace with actual OAuth implementation)
        setTimeout(() => {
            alert('Google Sign Up functionality would redirect to Google OAuth here.\n\nIn a real implementation, this would:\n1. Redirect to Google OAuth page\n2. Handle callback with user data\n3. Create/authenticate user account');
            
            // Reset button
            googleSignupBtn.innerHTML = '<i class="fab fa-google"></i><span>Sign up with Google</span>';
            googleSignupBtn.disabled = false;
        }, 1000);
    }
    
    function handleSignup(e) {
        e.preventDefault();
        
        // Validate all fields
        const isFullNameValid = validateFullName();
        const isUsernameValid = validateUsername();
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        const isTermsAccepted = termsCheckbox.checked;
        
        if (!isFullNameValid || !isUsernameValid || !isEmailValid || 
            !isPasswordValid || !isConfirmPasswordValid || !isTermsAccepted) {
            
            // Shake form for visual feedback
            signupForm.classList.add('shake');
            setTimeout(() => {
                signupForm.classList.remove('shake');
            }, 500);
            
            return;
        }
        
        // Show loading state
        signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Creating Account...</span>';
        signupBtn.classList.add('loading');
        signupBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            // Success simulation
            signupBtn.innerHTML = '<i class="fas fa-check"></i><span>Account Created!</span>';
            signupBtn.classList.remove('loading');
            signupBtn.style.backgroundColor = 'var(--success)';
            
            // Show success message and redirect
            setTimeout(() => {
                alert('Account created successfully! Redirecting to dashboard...');
                // In real implementation, redirect to dashboard or verification page
                // window.location.href = 'dashboard.html';
            }, 500);
        }, 2000);
    }
    
    // Additional validation on blur
    fullNameInput.addEventListener('blur', validateFullName);
    usernameInput.addEventListener('blur', validateUsername);
    emailInput.addEventListener('blur', validateEmail);
    passwordInput.addEventListener('blur', validatePassword);
    confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
});