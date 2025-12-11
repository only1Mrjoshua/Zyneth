// Navigation Menu Toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle mobile menu
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    
    // Create or remove overlay
    let overlay = document.querySelector('.mobile-overlay');
    if (!overlay && navMenu.classList.contains('active')) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            overlay.classList.remove('active');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        });
        
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
    } else if (overlay && !navMenu.classList.contains('active')) {
        overlay.classList.remove('active');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
});

// Close mobile menu when clicking on links
navLinks.forEach(link => {
    link.addEventListener('click', () => {
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
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Reveal animations for feature cards
const revealElements = () => {
    const reveals = document.querySelectorAll('.reveal');
    
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('reveal--visible');
        }
    });
};

// Initialize reveal animations
window.addEventListener('scroll', revealElements);
window.addEventListener('load', revealElements);

// Feature card hover effects
const featureCards = document.querySelectorAll('.feature-card');

featureCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
        card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
    });
    
    card.addEventListener('mouseleave', () => {
        if (!card.classList.contains('hover-active')) {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        }
    });
});

// History graph animation
const historyBars = document.querySelectorAll('.graph-bar');
let isAnimated = false;

const animateHistoryBars = () => {
    if (isAnimated) return;
    
    const historyDemo = document.querySelector('.history-demo');
    const rect = historyDemo.getBoundingClientRect();
    
    if (rect.top < window.innerHeight - 100) {
        isAnimated = true;
        historyBars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.transition = 'height 0.5s ease';
                bar.style.height = bar.style.height;
            }, index * 100);
        });
    }
};

window.addEventListener('scroll', animateHistoryBars);
window.addEventListener('load', animateHistoryBars);

// Platform tags hover effect
const platformTags = document.querySelectorAll('.platform-tag');

platformTags.forEach(tag => {
    tag.addEventListener('mouseenter', () => {
        tag.style.transform = 'translateY(-2px)';
        tag.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
    });
    
    tag.addEventListener('mouseleave', () => {
        tag.style.transform = 'translateY(0)';
        tag.style.boxShadow = 'none';
    });
});

// Alert types animation
const alertTypes = document.querySelectorAll('.alert-type');

alertTypes.forEach(type => {
    type.addEventListener('mouseenter', () => {
        const icon = type.querySelector('i');
        icon.style.transform = 'scale(1.2)';
        icon.style.transition = 'transform 0.3s ease';
    });
    
    type.addEventListener('mouseleave', () => {
        const icon = type.querySelector('i');
        icon.style.transform = 'scale(1)';
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer if needed
    const yearSpan = document.querySelector('.current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    // Trigger initial animations
    revealElements();
    animateHistoryBars();
});