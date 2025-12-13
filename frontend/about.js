// ========== ABOUT PAGE FUNCTIONALITY ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize about page functionality
    initAbout();
});

function initAbout() {
    // Initialize buttons
    initButtons();
    
    // Load about page data
    loadAboutData();
}

// ========== BUTTON FUNCTIONALITY ==========
function initButtons() {
    // Contact support button
    const contactSupportBtn = document.getElementById('contactSupportBtn');
    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', contactSupport);
    }
    
    // View changelog button
    const viewChangelogBtn = document.getElementById('viewChangelogBtn');
    if (viewChangelogBtn) {
        viewChangelogBtn.addEventListener('click', viewChangelog);
    }
}

function contactSupport() {
    showToast('Opening support contact form...', 'info');
    
    // In a real app, this would open a contact form or redirect
    setTimeout(() => {
        // Simulate opening support
        const supportEmail = 'support@pricepulse.africa';
        const subject = 'Support Request - PricePulse';
        const body = 'Hello PricePulse Support,\n\nI need help with:\n\n';
        
        // Create mailto link
        const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Open email client
        window.location.href = mailtoLink;
    }, 1000);
}

function viewChangelog() {
    showToast('Loading changelog...', 'info');
    
    // In a real app, this would show a modal with changelog
    setTimeout(() => {
        const changelog = [
            {
                version: '2.1.0',
                date: 'December 5, 2023',
                features: [
                    'Added real-time price tracking for Konga',
                    'Enhanced notification system with push alerts',
                    'Improved mobile responsiveness',
                    'Bug fixes and performance improvements'
                ]
            },
            {
                version: '2.0.0',
                date: 'November 15, 2023',
                features: [
                    'Complete dashboard redesign',
                    'Added Amazon and eBay tracking',
                    'New savings analytics',
                    'Multi-platform price comparison'
                ]
            },
            {
                version: '1.5.0',
                date: 'October 1, 2023',
                features: [
                    'Jumia integration',
                    'Price drop alerts',
                    'Basic dashboard',
                    'Mobile app release'
                ]
            }
        ];
        
        // Create changelog modal
        showChangelogModal(changelog);
    }, 1500);
}

function showChangelogModal(changelog) {
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'changelog-modal';
    
    // Create modal content
    let changelogHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-history"></i> Version History</h2>
                <button class="modal-close" id="modalClose">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
    `;
    
    // Add each version
    changelog.forEach(version => {
        changelogHTML += `
            <div class="version-item">
                <div class="version-header">
                    <h3>v${version.version}</h3>
                    <span class="version-date">${version.date}</span>
                </div>
                <ul class="version-features">
        `;
        
        version.features.forEach(feature => {
            changelogHTML += `<li><i class="fas fa-check-circle"></i> ${feature}</li>`;
        });
        
        changelogHTML += `
                </ul>
            </div>
        `;
    });
    
    changelogHTML += `
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="closeModalBtn">
                    Close
                </button>
            </div>
        </div>
    `;
    
    modal.innerHTML = changelogHTML;
    
    // Add styles
    if (!document.getElementById('modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .changelog-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .changelog-modal.show {
                opacity: 1;
            }
            
            .modal-content {
                background-color: var(--dark);
                border-radius: 20px;
                border: 1px solid rgba(255, 215, 0, 0.2);
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                transform: translateY(-50px);
                transition: transform 0.3s ease;
            }
            
            .changelog-modal.show .modal-content {
                transform: translateY(0);
            }
            
            .modal-header {
                padding: 25px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background-color: rgba(255, 255, 255, 0.02);
                border-radius: 20px 20px 0 0;
            }
            
            .modal-header h2 {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 1.5rem;
                margin: 0;
                color: var(--light);
            }
            
            .modal-header h2 i {
                color: var(--primary);
            }
            
            .modal-close {
                background: none;
                border: none;
                color: var(--gray);
                font-size: 1.2rem;
                cursor: pointer;
                padding: 5px;
                transition: var(--transition);
            }
            
            .modal-close:hover {
                color: var(--primary);
            }
            
            .modal-body {
                padding: 25px;
                max-height: 60vh;
                overflow-y: auto;
            }
            
            .version-item {
                margin-bottom: 30px;
                padding-bottom: 30px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .version-item:last-child {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }
            
            .version-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .version-header h3 {
                font-size: 1.3rem;
                color: var(--primary);
                margin: 0;
            }
            
            .version-date {
                color: var(--light-gray);
                font-size: 0.9rem;
                background-color: rgba(255, 215, 0, 0.1);
                padding: 5px 15px;
                border-radius: 20px;
            }
            
            .version-features {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .version-features li {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                margin-bottom: 10px;
                color: var(--light-gray);
            }
            
            .version-features li:last-child {
                margin-bottom: 0;
            }
            
            .version-features li i {
                color: var(--success);
                margin-top: 3px;
                flex-shrink: 0;
            }
            
            .modal-footer {
                padding: 20px 25px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                display: flex;
                justify-content: flex-end;
            }
            
            .modal-footer .btn-secondary {
                padding: 10px 30px;
            }
            
            @media (max-width: 768px) {
                .modal-content {
                    width: 95%;
                }
                
                .modal-body {
                    max-height: 70vh;
                }
                
                .version-header {
                    flex-direction: column;
                    align-items: flex-start;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to DOM
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Close button functionality
    const closeBtn = modal.querySelector('#modalClose');
    const closeModalBtn = modal.querySelector('#closeModalBtn');
    
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    };
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.parentNode) {
            closeModal();
        }
    });
}

// ========== ABOUT DATA ==========
function loadAboutData() {
    // This function can load any dynamic about page data
    // Currently, all data is static in the HTML
    console.log('About page loaded');
}

// ========== TOAST FUNCTIONALITY (from dashboard.js) ==========
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