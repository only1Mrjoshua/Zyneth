// ========== PROFILE PAGE FUNCTIONALITY ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize profile functionality
    initProfile();
});

function initProfile() {
    // Initialize form handling
    initProfileForm();
    
    // Initialize buttons
    initButtons();
    
    // Load profile data
    loadProfileData();
}

// ========== FORM HANDLING ==========
function initProfileForm() {
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    
    if (!profileForm || !passwordForm) return;
    
    // Profile form submission handler
    profileForm.addEventListener('submit', handleProfileUpdate);
    
    // Password form submission handler
    passwordForm.addEventListener('submit', handlePasswordChange);
    
    // Cancel button handlers
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeEditProfile);
    }
    
    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', closePasswordForm);
    }
}

function handleProfileUpdate(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Show loading state
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset button
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        
        // Show success message
        showToast('Profile updated successfully!', 'success');
        
        // Update displayed information
        updateDisplayedInfo(data);
        
        // Close edit form
        closeEditProfile();
    }, 1500);
}

function handlePasswordChange(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validate passwords if provided
    if (data.newPassword || data.confirmPassword) {
        if (!data.currentPassword) {
            showToast('Please enter your current password', 'error');
            return;
        }
        
        if (data.newPassword !== data.confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }
        
        if (data.newPassword.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }
    } else {
        // Both password fields empty
        closePasswordForm();
        showToast('Password form closed', 'info');
        return;
    }
    
    // Show loading state
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const originalText = savePasswordBtn.innerHTML;
    savePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    savePasswordBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset button
        savePasswordBtn.innerHTML = originalText;
        savePasswordBtn.disabled = false;
        
        // Show success message
        showToast('Password updated successfully!', 'success');
        
        // Reset form
        form.reset();
        
        // Close password form
        closePasswordForm();
    }, 1500);
}

function closeEditProfile() {
    const editForm = document.getElementById('editProfileForm');
    const editBtn = document.getElementById('editProfileBtn');
    
    if (editForm) {
        editForm.style.display = 'none';
    }
    
    if (editBtn) {
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
        editBtn.onclick = openEditProfile;
    }
    
    showToast('Edit cancelled', 'info');
}

function closePasswordForm() {
    const passwordForm = document.getElementById('passwordForm');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    
    if (passwordForm) {
        passwordForm.style.display = 'none';
    }
    
    if (changePasswordBtn) {
        changePasswordBtn.innerHTML = '<i class="fas fa-key"></i> Change Password';
        changePasswordBtn.onclick = openPasswordForm;
    }
    
    showToast('Password change cancelled', 'info');
}

function updateDisplayedInfo(data) {
    // Update name in avatar section
    const nameElement = document.querySelector('.avatar-info h2');
    if (nameElement && data.fullName) {
        nameElement.textContent = data.fullName;
    }
    
    // Update name in navbar
    const navName = document.querySelector('.btn-login');
    if (navName) {
        navName.innerHTML = `<i class="fas fa-user"></i> ${data.fullName}`;
    }
    
    // Update email in info card
    const emailValue = document.querySelector('.info-item:nth-child(1) .info-value span:first-child');
    if (emailValue && data.email) {
        emailValue.textContent = data.email;
    }
    
    // Update phone in info card
    const phoneValue = document.querySelector('.info-item:nth-child(2) .info-value span:first-child');
    if (phoneValue && data.phone) {
        phoneValue.textContent = formatPhoneNumber(data.phone);
    }
    
    // Update location in info card
    const locationValue = document.querySelector('.info-item:nth-child(3) .info-value span:first-child');
    if (locationValue && data.location) {
        const locationText = getLocationText(data.location);
        locationValue.textContent = locationText;
    }
}

function formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if number starts with 234 (Nigeria country code)
    if (cleaned.startsWith('234')) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    
    // Format as Nigerian number if 11 digits
    if (cleaned.length === 11) {
        return `+234 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    
    return phone;
}

function getLocationText(locationCode) {
    const locations = {
        'lagos': 'Lagos, Nigeria',
        'abuja': 'Abuja, Nigeria',
        'ibadan': 'Ibadan, Nigeria',
        'port-harcourt': 'Port Harcourt, Nigeria',
        'other': 'Other Location'
    };
    return locations[locationCode] || locationCode;
}

// ========== BUTTON FUNCTIONALITY ==========
function initButtons() {
    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openEditProfile);
    }
    
    // Change password button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', openPasswordForm);
    }
    
    // Edit avatar button
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', editAvatar);
    }
}

function openEditProfile() {
    const editForm = document.getElementById('editProfileForm');
    const editBtn = document.getElementById('editProfileBtn');
    
    if (editForm) {
        editForm.style.display = 'block';
        editForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    if (editBtn) {
        editBtn.innerHTML = '<i class="fas fa-times"></i> Close Edit';
        editBtn.onclick = closeEditProfile;
    }
}

function openPasswordForm() {
    const passwordForm = document.getElementById('passwordForm');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    
    if (passwordForm) {
        passwordForm.style.display = 'block';
        passwordForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    if (changePasswordBtn) {
        changePasswordBtn.innerHTML = '<i class="fas fa-times"></i> Close';
        changePasswordBtn.onclick = closePasswordForm;
    }
}

function editAvatar() {
    showToast('Avatar upload feature coming soon!', 'info');
    
    // In a real app, this would open a file picker
    setTimeout(() => {
        // Simulate avatar change
        const avatarIcon = document.querySelector('.avatar i');
        if (avatarIcon) {
            const icons = ['fas fa-user', 'fas fa-user-tie', 'fas fa-user-ninja', 'fas fa-user-astronaut'];
            const randomIcon = icons[Math.floor(Math.random() * icons.length)];
            avatarIcon.className = randomIcon;
            showToast('Avatar updated!', 'success');
        }
    }, 1500);
}

// ========== PROFILE DATA ==========
function loadProfileData() {
    // This would typically load from an API
    const profileData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+2348123456789',
        location: 'lagos',
        memberSince: 'January 2023'
    };
    
    // Update form with current data
    document.getElementById('fullName').value = profileData.name;
    document.getElementById('email').value = profileData.email;
    document.getElementById('phone').value = profileData.phone;
    document.getElementById('location').value = profileData.location;
    
    // Update member since
    const memberSinceElement = document.querySelector('.member-since span');
    if (memberSinceElement) {
        memberSinceElement.textContent = `Member since ${profileData.memberSince}`;
    }
}

// ========== TOAST FUNCTIONALITY ==========
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: var(--dark);
                border: 1px solid rgba(255, 215, 0, 0.2);
                border-radius: 10px;
                padding: 15px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                z-index: 9999;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                transform: translateY(100px);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
                max-width: 350px;
            }
            
            .toast.show {
                transform: translateY(0);
                opacity: 1;
            }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }
            
            .toast.success {
                border-left: 4px solid var(--success);
            }
            
            .toast.warning {
                border-left: 4px solid #FFD700;
            }
            
            .toast.info {
                border-left: 4px solid #3B82F6;
            }
            
            .toast.error {
                border-left: 4px solid #EF4444;
            }
            
            .toast-content i {
                font-size: 1.2rem;
            }
            
            .toast.success .toast-content i {
                color: var(--success);
            }
            
            .toast.warning .toast-content i {
                color: #FFD700;
            }
            
            .toast.info .toast-content i {
                color: #3B82F6;
            }
            
            .toast.error .toast-content i {
                color: #EF4444;
            }
            
            .toast-close {
                background: none;
                border: none;
                color: var(--gray);
                cursor: pointer;
                padding: 5px;
                transition: var(--transition);
            }
            
            .toast-close:hover {
                color: var(--primary);
            }
            
            @media (max-width: 768px) {
                .toast {
                    left: 20px;
                    right: 20px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        hideToast(toast);
    });
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto-hide after 5 seconds
    const autoHide = setTimeout(() => {
        hideToast(toast);
    }, 5000);
    
    // Keep toast on hover
    toast.addEventListener('mouseenter', () => {
        clearTimeout(autoHide);
    });
    
    toast.addEventListener('mouseleave', () => {
        setTimeout(() => {
            hideToast(toast);
        }, 3000);
    });
}

function hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

function getToastIcon(type) {
    const icons = {
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle',
        'error': 'exclamation-circle'
    };
    return icons[type] || 'info-circle';
}

// ========== WINDOW RESIZE HANDLER ==========
window.addEventListener('resize', () => {
    // Close mobile menu if resizing to larger screen
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    
    if (window.innerWidth > 768 && navMenu && navMenu.classList.contains('active')) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        
        const overlay = document.querySelector('.mobile-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }
});