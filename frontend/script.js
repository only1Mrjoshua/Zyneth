// script.js - PricePulse Landing Page
(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    const CONFIG = {
        reveal: {
            // Class name for elements that should reveal on scroll
            className: 'reveal',
            // Class name to add when element becomes visible
            visibleClass: 'reveal--visible',
            // Default translate distance in pixels
            translateDistance: 24,
            // Animation duration in milliseconds
            duration: 600,
            // Animation easing function
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            // Stagger delay between sibling elements in milliseconds
            staggerDelay: 80,
            // IntersectionObserver threshold (0 = any visible, 1 = fully visible)
            threshold: 0.1,
            // Root margin for IntersectionObserver
            rootMargin: '0px 0px -20px 0px'
        },
        navigation: {
            // Hamburger menu selector
            hamburgerSelector: '.hamburger, [data-hamburger]',
            // Mobile menu selector
            mobileMenuSelector: '.mobile-menu, [data-mobile-menu]',
            // Active class for mobile menu
            activeClass: 'active'
        },
        scroll: {
            // Smooth scroll duration in milliseconds
            duration: 800,
            // Smooth scroll easing function
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
    };

    // ========== UTILITY FUNCTIONS ==========
    /**
     * Debounce function to limit how often a function can be called
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    /**
     * Throttle function to limit function execution rate
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    const throttle = (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    /**
     * Smooth scroll to target element
     * @param {HTMLElement} targetElement - Element to scroll to
     * @param {Object} options - Scroll options
     */
    const smoothScrollTo = (targetElement, options = {}) => {
        const start = window.pageYOffset;
        const target = targetElement.getBoundingClientRect().top + start;
        const duration = options.duration || CONFIG.scroll.duration;
        const easing = options.easing || CONFIG.scroll.easing;
        
        let startTime = null;
        
        const animateScroll = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Apply easing
            const easeProgress = easing === 'linear' ? progress :
                progress < 0.5 ? 2 * progress * progress :
                1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            window.scrollTo(0, start + (target - start) * easeProgress);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animateScroll);
            } else {
                // Update URL hash without scrolling
                const id = targetElement.getAttribute('id');
                if (id) {
                    history.pushState(null, null, `#${id}`);
                }
            }
        };
        
        requestAnimationFrame(animateScroll);
    };

    // ========== REVEAL ON SCROLL ==========
    /**
     * Initialize scroll reveal animation
     */
    const initRevealOnScroll = () => {
        const revealElements = document.querySelectorAll(`.${CONFIG.reveal.className}`);
        
        if (revealElements.length === 0) return;
        
        // Set initial styles for reveal elements
        revealElements.forEach(element => {
            // Ensure element is hidden initially
            element.style.opacity = '0';
            element.style.transform = `translateY(${CONFIG.reveal.translateDistance}px)`;
            element.style.transition = `opacity ${CONFIG.reveal.duration}ms ${CONFIG.reveal.easing}, 
                                       transform ${CONFIG.reveal.duration}ms ${CONFIG.reveal.easing}`;
        });
        
        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) {
            // Fallback: reveal all elements immediately
            revealElements.forEach(element => {
                element.classList.add(CONFIG.reveal.visibleClass);
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            });
            return;
        }
        
        // Track which elements have been revealed
        const revealedElements = new Set();
        
        // Create IntersectionObserver callback
        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !revealedElements.has(entry.target)) {
                    const element = entry.target;
                    revealedElements.add(element);
                    
                    // Find parent container to check for siblings
                    const parent = element.parentElement;
                    const siblingReveals = parent ? 
                        Array.from(parent.querySelectorAll(`.${CONFIG.reveal.className}`)) : 
                        [];
                    
                    // Find index of current element among siblings
                    const elementIndex = siblingReveals.indexOf(element);
                    
                    // Calculate delay for stagger effect
                    const delay = elementIndex >= 0 ? 
                        elementIndex * CONFIG.reveal.staggerDelay : 0;
                    
                    // Apply reveal with delay
                    setTimeout(() => {
                        element.classList.add(CONFIG.reveal.visibleClass);
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                        
                        // Clean up inline styles after animation completes
                        setTimeout(() => {
                            element.style.transition = '';
                            element.style.opacity = '';
                            element.style.transform = '';
                        }, CONFIG.reveal.duration);
                    }, delay);
                    
                    // Don't unobserve - keep elements visible once revealed
                }
            });
        };
        
        // Create IntersectionObserver
        const observer = new IntersectionObserver(observerCallback, {
            threshold: CONFIG.reveal.threshold,
            rootMargin: CONFIG.reveal.rootMargin
        });
        
        // Observe all reveal elements
        revealElements.forEach(element => {
            observer.observe(element);
        });
        
        // Reveal elements that are already in view on page load
        const checkInitialVisibility = () => {
            revealElements.forEach(element => {
                const rect = element.getBoundingClientRect();
                const isVisible = (
                    rect.top <= window.innerHeight * 0.9 &&
                    rect.bottom >= 0
                );
                
                if (isVisible && !revealedElements.has(element)) {
                    revealedElements.add(element);
                    const delay = 100; // Small delay for initial load
                    
                    setTimeout(() => {
                        element.classList.add(CONFIG.reveal.visibleClass);
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                        
                        setTimeout(() => {
                            element.style.transition = '';
                            element.style.opacity = '';
                            element.style.transform = '';
                        }, CONFIG.reveal.duration);
                    }, delay);
                }
            });
        };
        
        // Check initial visibility after a short delay
        setTimeout(checkInitialVisibility, 100);
    };

    // ========== RESPONSIVE NAVIGATION ==========
    /**
     * Initialize responsive navigation
     */
    const initResponsiveNavigation = () => {
        const hamburger = document.querySelector(CONFIG.navigation.hamburgerSelector);
        const mobileMenu = document.querySelector(CONFIG.navigation.mobileMenuSelector);
        
        if (!hamburger || !mobileMenu) return;
        
        // Toggle mobile menu
        const toggleMobileMenu = () => {
            hamburger.classList.toggle(CONFIG.navigation.activeClass);
            mobileMenu.classList.toggle(CONFIG.navigation.activeClass);
            
            // Toggle aria-expanded for accessibility
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
            
            // Toggle body scroll lock
            document.body.style.overflow = mobileMenu.classList.contains(CONFIG.navigation.activeClass) ? 
                'hidden' : '';
        };
        
        // Set initial aria attributes
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-controls', mobileMenu.id || 'mobile-menu');
        hamburger.setAttribute('aria-label', 'Toggle navigation menu');
        
        // Add click event to hamburger
        hamburger.addEventListener('click', toggleMobileMenu);
        
        // Close mobile menu when clicking on a link
        const mobileMenuLinks = mobileMenu.querySelectorAll('a[href^="#"]');
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mobileMenu.classList.contains(CONFIG.navigation.activeClass)) {
                    toggleMobileMenu();
                }
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (event) => {
            if (mobileMenu.classList.contains(CONFIG.navigation.activeClass) &&
                !hamburger.contains(event.target) &&
                !mobileMenu.contains(event.target)) {
                toggleMobileMenu();
            }
        });
        
        // Close mobile menu on escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && mobileMenu.classList.contains(CONFIG.navigation.activeClass)) {
                toggleMobileMenu();
            }
        });
        
        // Handle window resize - close menu on large screens
        const handleResize = debounce(() => {
            if (window.innerWidth > 768 && mobileMenu.classList.contains(CONFIG.navigation.activeClass)) {
                toggleMobileMenu();
            }
        }, 250);
        
        window.addEventListener('resize', handleResize);
    };

    // ========== SMOOTH SCROLL ==========
    /**
     * Initialize smooth scroll for anchor links
     */
    const initSmoothScroll = () => {
        // Select all anchor links that point to IDs on the same page
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                const href = link.getAttribute('href');
                
                // Skip empty or "#" only links
                if (href === '#' || href === '#!') {
                    return;
                }
                
                try {
                    const targetElement = document.querySelector(href);
                    
                    if (targetElement) {
                        event.preventDefault();
                        
                        // Close mobile menu if open
                        const mobileMenu = document.querySelector(CONFIG.navigation.mobileMenuSelector);
                        const hamburger = document.querySelector(CONFIG.navigation.hamburgerSelector);
                        
                        if (mobileMenu && mobileMenu.classList.contains(CONFIG.navigation.activeClass)) {
                            mobileMenu.classList.remove(CONFIG.navigation.activeClass);
                            hamburger.classList.remove(CONFIG.navigation.activeClass);
                            hamburger.setAttribute('aria-expanded', 'false');
                            document.body.style.overflow = '';
                        }
                        
                        // Smooth scroll to target
                        smoothScrollTo(targetElement);
                    }
                } catch (error) {
                    console.warn('Smooth scroll failed:', error);
                }
            });
        });
    };

    // ========== CTA BUTTONS ==========
    /**
     * Initialize CTA button behaviors
     */
    const initCTAButtons = () => {
        // Map button data attributes or classes to target sections
        const ctaConfig = {
            'get-started': '#features', // Scroll to features section
            'learn-more': '#how-it-works', // Scroll to how it works section
            'start-tracking': '#features' // Another CTA that goes to features
        };
        
        // Find CTA buttons
        const ctaButtons = document.querySelectorAll('[data-cta], .btn-cta, .btn-primary, .btn-secondary');
        
        ctaButtons.forEach(button => {
            // Determine target based on data attribute, class, or text content
            let targetSelector = null;
            
            // Check data attribute first
            if (button.hasAttribute('data-cta-target')) {
                targetSelector = button.getAttribute('data-cta-target');
            } else if (button.hasAttribute('data-cta')) {
                const ctaType = button.getAttribute('data-cta');
                targetSelector = ctaConfig[ctaType];
            } else {
                // Fallback: check button text
                const buttonText = button.textContent.toLowerCase();
                if (buttonText.includes('get started') || buttonText.includes('start tracking')) {
                    targetSelector = '#features';
                } else if (buttonText.includes('learn more')) {
                    targetSelector = '#how-it-works';
                }
            }
            
            if (targetSelector) {
                button.addEventListener('click', (event) => {
                    // Only handle if it's not a link with href
                    if (button.tagName !== 'A' || !button.getAttribute('href')) {
                        event.preventDefault();
                        const targetElement = document.querySelector(targetSelector);
                        
                        if (targetElement) {
                            smoothScrollTo(targetElement);
                        }
                    }
                });
            }
            
            // Add hover effect for all CTA buttons
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.transition = 'transform 0.2s ease';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });
        });
    };

    // ========== ADDITIONAL PAGE BEHAVIORS ==========
    /**
     * Initialize navbar scroll effect
     */
    const initNavbarScroll = () => {
        const navbar = document.querySelector('.navbar, header');
        
        if (!navbar) return;
        
        const handleScroll = throttle(() => {
            if (window.scrollY > 100) {
                navbar.classList.add('navbar--scrolled');
            } else {
                navbar.classList.remove('navbar--scrolled');
            }
        }, 100);
        
        window.addEventListener('scroll', handleScroll);
        // Trigger once on load
        handleScroll();
    };

    /**
     * Initialize current year in footer
     */
    const initCurrentYear = () => {
        const yearElements = document.querySelectorAll('[data-current-year]');
        const currentYear = new Date().getFullYear();
        
        yearElements.forEach(element => {
            element.textContent = currentYear;
        });
    };

    /**
     * Initialize lazy loading for images
     */
    const initLazyLoading = () => {
        if ('loading' in HTMLImageElement.prototype) {
            // Browser supports native lazy loading
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        } else {
            // Fallback for browsers without native support
            const lazyImages = document.querySelectorAll('img[data-src]');
            
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    });
                });
                
                lazyImages.forEach(img => imageObserver.observe(img));
            } else {
                // Fallback for very old browsers
                lazyImages.forEach(img => {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                });
            }
        }
    };

    // ========== INITIALIZATION ==========
    /**
     * Initialize all components when DOM is ready
     */
    const init = () => {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initComponents);
        } else {
            initComponents();
        }
    };
    
    const initComponents = () => {
        // Initialize all features in order
        initResponsiveNavigation();
        initRevealOnScroll();
        initSmoothScroll();
        initCTAButtons();
        initNavbarScroll();
        initCurrentYear();
        initLazyLoading();
        
        // Add a class to body when JS is loaded (for CSS enhancements)
        document.body.classList.add('js-loaded');
        
        // Log initialization for debugging
        console.log('PricePulse landing page initialized successfully');
    };

    // ========== ERROR HANDLING ==========
    /**
     * Global error handler for uncaught errors
     */
    const initErrorHandling = () => {
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            
            // Try to recover gracefully by revealing all elements
            const revealElements = document.querySelectorAll(`.${CONFIG.reveal.className}`);
            revealElements.forEach(element => {
                element.classList.add(CONFIG.reveal.visibleClass);
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            });
        });
    };

    // ========== EXPORT FOR TESTING (optional) ==========
    // Expose some functions for testing if needed (in non-minified version)
    if (typeof window !== 'undefined') {
        window.PricePulse = window.PricePulse || {};
        window.PricePulse.utils = {
            debounce,
            throttle,
            smoothScrollTo
        };
    }

    // Initialize error handling first
    initErrorHandling();
    
    // Start the application
    init();

})();