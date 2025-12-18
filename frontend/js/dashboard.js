// ========== DASHBOARD FUNCTIONALITY ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all dashboard functionality
    initDashboard();
});

function initDashboard() {
    // Set current date
    setCurrentDate();
    
    // Initialize search functionality
    initSearch();
    
    // Initialize filters
    initFilters();
    
    // Load dashboard data
    loadDashboardData();
    
    // Initialize buttons and interactions
    initButtons();
    
    // Initialize notifications
    initNotifications();
}

// ========== DATE DISPLAY ==========
function setCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;
    
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

// ========== SEARCH FUNCTIONALITY ==========
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (!searchInput || !searchBtn) return;
    
    // Search on button click
    searchBtn.addEventListener('click', performSearch);
    
    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        showToast('Please enter a search term', 'warning');
        return;
    }
    
    showToast(`Searching for "${searchTerm}"...`, 'info');
    
    // Simulate API call
    setTimeout(() => {
        showToast(`Found results for "${searchTerm}"`, 'success');
        
        // Reset search input
        searchInput.value = '';
        searchInput.blur();
    }, 1500);
}

// ========== FILTERS FUNCTIONALITY ==========
function initFilters() {
    const platformCheckboxes = document.querySelectorAll('input[name="platform"]');
    const categorySelect = document.querySelector('.category-select');
    
    if (!platformCheckboxes.length || !categorySelect) return;
    
    // Platform filter change handler
    platformCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateFilters);
    });
    
    // Category filter change handler
    categorySelect.addEventListener('change', updateFilters);
}

function updateFilters() {
    const selectedPlatforms = Array.from(
        document.querySelectorAll('input[name="platform"]:checked')
    ).map(cb => cb.value);
    
    const selectedCategory = document.querySelector('.category-select').value;
    
    console.log('Filters updated:', {
        platforms: selectedPlatforms,
        category: selectedCategory
    });
    
    // In a real app, this would filter the products
    filterProducts(selectedPlatforms, selectedCategory);
}

function filterProducts(platforms, category) {
    const productCards = document.querySelectorAll('.product-card');
    let visibleCount = 0;
    
    productCards.forEach(card => {
        const cardPlatform = card.getAttribute('data-platform');
        const cardCategory = card.getAttribute('data-category');
        
        const platformMatch = platforms.length === 0 || platforms.includes(cardPlatform);
        const categoryMatch = !category || category === cardCategory;
        
        if (platformMatch && categoryMatch) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show empty state if no products match filters
    const emptyState = document.getElementById('emptyState');
    if (visibleCount === 0 && productCards.length > 0) {
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div class="empty-icon">
                    <i class="fas fa-filter"></i>
                </div>
                <h3>No products match your filters</h3>
                <p>Try adjusting your platform or category filters</p>
                <button class="btn-secondary" id="clearFiltersBtn">
                    <i class="fas fa-times"></i>
                    Clear Filters
                </button>
            `;
            
            // Add clear filters button functionality
            document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
                clearFilters();
                emptyState.style.display = 'none';
            });
        }
    } else if (emptyState) {
        emptyState.style.display = 'none';
    }
}

function clearFilters() {
    // Check all platform checkboxes
    document.querySelectorAll('input[name="platform"]').forEach(cb => {
        cb.checked = true;
    });
    
    // Reset category select
    document.querySelector('.category-select').value = '';
    
    // Update filters
    updateFilters();
}

// ========== DASHBOARD DATA ==========
function loadDashboardData() {
    // Load stats
    updateStats();
    
    // Load products
    loadProducts();
    
    // Load notifications
    loadNotifications();
}

function updateStats() {
    // These would come from an API in a real app
    const stats = {
        totalProducts: 12,
        activeAlerts: 8,
        totalSavings: 45200,
        lastDrops: 3
    };
    
    // Update DOM elements
    document.getElementById('totalProducts').textContent = stats.totalProducts;
    document.getElementById('activeAlerts').textContent = stats.activeAlerts;
    document.getElementById('totalSavings').textContent = `₦${stats.totalSavings.toLocaleString()}`;
    document.getElementById('lastDrop').textContent = stats.lastDrops;
}

function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!productsGrid) return;
    
    // Sample product data
    const products = [
        {
            id: 1,
            name: 'Samsung Galaxy S23 Ultra 512GB',
            category: 'electronics',
            platform: 'amazon',
            image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            currentPrice: 850000,
            originalPrice: 950000,
            targetPrice: 800000,
            savings: 100000,
            priceChange: 'up',
            progress: 30,
            trackingSince: '2 weeks ago'
        },
        {
            id: 2,
            name: 'Apple MacBook Pro 14" M2 Pro',
            category: 'electronics',
            platform: 'jumia',
            image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            currentPrice: 1200000,
            originalPrice: 1300000,
            targetPrice: 1150000,
            savings: 50000,
            priceChange: 'down',
            progress: 60,
            trackingSince: '1 month ago'
        },
        {
            id: 3,
            name: 'Nike Air Max 270 React',
            category: 'fashion',
            platform: 'konga',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            currentPrice: 45000,
            originalPrice: 55000,
            targetPrice: 40000,
            savings: 5000,
            priceChange: 'down',
            progress: 75,
            trackingSince: '5 days ago'
        },
        {
            id: 4,
            name: 'Sony WH-1000XM5 Wireless Headphones',
            category: 'electronics',
            platform: 'ebay',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            currentPrice: 85000,
            originalPrice: 95000,
            targetPrice: 80000,
            savings: 5000,
            priceChange: 'up',
            progress: 25,
            trackingSince: '3 weeks ago'
        }
    ];
    
    // Clear existing products
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Load product template
    const template = document.getElementById('productCardTemplate');
    if (!template) return;
    
    // Render each product
    products.forEach(product => {
        const clone = template.content.cloneNode(true);
        const productCard = clone.querySelector('.product-card');
        
        // Set product data attributes
        productCard.setAttribute('data-id', product.id);
        productCard.setAttribute('data-platform', product.platform);
        productCard.setAttribute('data-category', product.category);
        
        // Fill in product data
        const img = productCard.querySelector('.product-image img');
        img.src = product.image;
        img.alt = product.name;
        
        // Platform badge
        const platformBadge = productCard.querySelector('.platform-badge i');
        const platformClasses = {
            'amazon': 'fab fa-amazon',
            'jumia': 'fas fa-shopping-cart',
            'konga': 'fas fa-store',
            'ebay': 'fab fa-ebay'
        };
        platformBadge.className = platformClasses[product.platform] || 'fas fa-shopping-cart';
        
        // Product info
        productCard.querySelector('.product-title').textContent = product.name;
        productCard.querySelector('.product-category').textContent = 
            product.category.charAt(0).toUpperCase() + product.category.slice(1);
        productCard.querySelector('.tracking-since').textContent = 
            `Tracking since ${product.trackingSince}`;
        
        // Prices
        productCard.querySelector('.price-amount').textContent = 
            `₦${product.currentPrice.toLocaleString()}`;
        
        const priceChange = productCard.querySelector('.price-change');
        priceChange.classList.add(product.priceChange);
        priceChange.textContent = product.priceChange === 'up' ? 'Price Increased' : 'Price Dropped';
        
        productCard.querySelector('.target-amount').textContent = 
            `₦${product.targetPrice.toLocaleString()}`;
        productCard.querySelector('.savings-amount').textContent = 
            `₦${product.savings.toLocaleString()}`;
        
        // Progress
        const progressFill = productCard.querySelector('.progress-fill');
        const progressPercentage = productCard.querySelector('.progress-percentage');
        const progress = Math.min(100, Math.max(0, product.progress));
        
        progressFill.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;
        
        // Add event listeners to action buttons
        const viewBtn = productCard.querySelector('.view-details');
        const editBtn = productCard.querySelector('.edit-alert');
        const stopBtn = productCard.querySelector('.stop-tracking');
        
        viewBtn.addEventListener('click', () => viewProductDetails(product.id));
        editBtn.addEventListener('click', () => editProductAlert(product.id));
        stopBtn.addEventListener('click', () => stopTrackingProduct(product.id));
        
        // Add menu button functionality
        const menuBtn = productCard.querySelector('.product-menu-btn');
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showProductMenu(product.id, e.target);
        });
        
        // Add to grid
        productsGrid.appendChild(clone);
    });
}

// ========== NOTIFICATIONS ==========
function initNotifications() {
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
    }
}

function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    const emptyNotifications = document.getElementById('emptyNotifications');
    
    if (!notificationsList) return;
    
    // Sample notification data
    const notifications = [
        {
            id: 1,
            title: 'Price Drop Alert!',
            text: 'Samsung Galaxy S23 Ultra price dropped to ₦850,000 on Amazon',
            time: '2 hours ago',
            read: false,
            type: 'price_drop'
        },
        {
            id: 2,
            title: 'Target Price Reached',
            text: 'Your target price of ₦40,000 for Nike Air Max has been reached',
            time: '1 day ago',
            read: true,
            type: 'target_reached'
        },
        {
            id: 3,
            title: 'New Product Added',
            text: 'Successfully started tracking Sony WH-1000XM5 headphones',
            time: '2 days ago',
            read: true,
            type: 'product_added'
        },
        {
            id: 4,
            title: 'Weekly Summary',
            text: 'You saved ₦8,500 this week across 3 products',
            time: '3 days ago',
            read: true,
            type: 'summary'
        },
        {
            id: 5,
            title: 'Price Increase Alert',
            text: 'MacBook Pro price increased to ₦1,200,000 on Jumia',
            time: '5 days ago',
            read: true,
            type: 'price_increase'
        }
    ];
    
    // Clear existing notifications
    notificationsList.innerHTML = '';
    
    if (notifications.length === 0) {
        if (emptyNotifications) {
            emptyNotifications.style.display = 'block';
        }
        return;
    }
    
    if (emptyNotifications) {
        emptyNotifications.style.display = 'none';
    }
    
    // Load notification template
    const template = document.getElementById('notificationTemplate');
    if (!template) return;
    
    // Render each notification
    notifications.forEach(notification => {
        const clone = template.content.cloneNode(true);
        const notificationItem = clone.querySelector('.notification-item');
        
        if (!notification.read) {
            notificationItem.classList.add('unread');
        }
        
        // Notification icon based on type
        const icon = notificationItem.querySelector('.notification-icon i');
        const iconClasses = {
            'price_drop': 'fas fa-arrow-down',
            'target_reached': 'fas fa-bullseye',
            'product_added': 'fas fa-plus',
            'summary': 'fas fa-chart-line',
            'price_increase': 'fas fa-arrow-up'
        };
        icon.className = iconClasses[notification.type] || 'fas fa-bell';
        
        // Fill in notification data
        notificationItem.querySelector('.notification-title').textContent = notification.title;
        notificationItem.querySelector('.notification-text').textContent = notification.text;
        notificationItem.querySelector('.notification-time').textContent = notification.time;
        
        // Add event listeners to notification buttons
        const markReadBtn = notificationItem.querySelector('.mark-read');
        const deleteBtn = notificationItem.querySelector('.delete');
        
        markReadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            markNotificationAsRead(notification.id);
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNotification(notification.id);
        });
        
        // Add click event to view notification
        notificationItem.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-actions')) {
                viewNotification(notification.id);
            }
        });
        
        // Add to list
        notificationsList.appendChild(clone);
    });
}

function markNotificationAsRead(notificationId) {
    console.log(`Marking notification ${notificationId} as read`);
    showToast('Notification marked as read', 'success');
    
    // Update UI
    const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
    if (notificationItem) {
        notificationItem.classList.remove('unread');
    }
}

function markAllNotificationsAsRead() {
    console.log('Marking all notifications as read');
    showToast('All notifications marked as read', 'success');
    
    // Update UI
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread');
    });
}

function deleteNotification(notificationId) {
    console.log(`Deleting notification ${notificationId}`);
    showToast('Notification deleted', 'success');
    
    // Remove from UI
    const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
    if (notificationItem) {
        notificationItem.style.opacity = '0';
        notificationItem.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            if (notificationItem.parentNode) {
                notificationItem.parentNode.removeChild(notificationItem);
            }
            
            // Show empty state if no notifications left
            const notificationsList = document.getElementById('notificationsList');
            if (notificationsList && notificationsList.children.length === 0) {
                const emptyNotifications = document.getElementById('emptyNotifications');
                if (emptyNotifications) {
                    emptyNotifications.style.display = 'block';
                }
            }
        }, 300);
    }
}

function viewNotification(notificationId) {
    console.log(`Viewing notification ${notificationId}`);
    // In a real app, this would show a detailed view
    showToast('Opening notification details...', 'info');
}

// ========== PRODUCT ACTIONS ==========
function viewProductDetails(productId) {
    console.log(`Viewing details for product ${productId}`);
    showToast(`Loading product details...`, 'info');
    
    // Simulate loading
    setTimeout(() => {
        showToast(`Product details loaded`, 'success');
    }, 1000);
}

function editProductAlert(productId) {
    console.log(`Editing alert for product ${productId}`);
    showToast(`Opening alert settings...`, 'info');
    
    // In a real app, this would open a modal
    setTimeout(() => {
        showToast(`Alert settings updated`, 'success');
    }, 1500);
}

function stopTrackingProduct(productId) {
    console.log(`Stopping tracking for product ${productId}`);
    
    // Confirm before stopping
    if (!confirm('Are you sure you want to stop tracking this product?')) {
        return;
    }
    
    showToast(`Stopping tracking...`, 'info');
    
    // Simulate API call
    setTimeout(() => {
        // Remove from UI
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (productCard) {
            productCard.style.opacity = '0';
            productCard.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                if (productCard.parentNode) {
                    productCard.parentNode.removeChild(productCard);
                }
                
                // Update stats
                updateStatsAfterRemoval();
                
                // Check if products grid is empty
                const productsGrid = document.getElementById('productsGrid');
                if (productsGrid && productsGrid.children.length === 0) {
                    const emptyState = document.getElementById('emptyState');
                    if (emptyState) {
                        emptyState.style.display = 'block';
                    }
                }
            }, 300);
        }
        
        showToast(`Product tracking stopped`, 'success');
    }, 1000);
}

function updateStatsAfterRemoval() {
    // Update total products count
    const totalProductsEl = document.getElementById('totalProducts');
    if (totalProductsEl) {
        let currentCount = parseInt(totalProductsEl.textContent);
        if (currentCount > 0) {
            totalProductsEl.textContent = currentCount - 1;
        }
    }
}

function showProductMenu(productId, button) {
    console.log(`Showing menu for product ${productId}`);
    
    // In a real app, this would show a context menu
    showToast(`Product menu options`, 'info');
}

// ========== BUTTON FUNCTIONALITY ==========
function initButtons() {
    // Add product button
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', addNewProduct);
    }
    
    // Refresh products button
    const refreshBtn = document.getElementById('refreshProductsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshProducts);
    }
    
    // Start tracking button (empty state)
    const startTrackingBtn = document.getElementById('startTrackingBtn');
    if (startTrackingBtn) {
        startTrackingBtn.addEventListener('click', addNewProduct);
    }
}

function addNewProduct() {
    console.log('Adding new product');
    showToast('Opening product search...', 'info');
    
    // In a real app, this would open a search modal
    setTimeout(() => {
        // Simulate adding a new product
        showToast('Product added to tracking list!', 'success');
        
        // Update stats
        const totalProductsEl = document.getElementById('totalProducts');
        if (totalProductsEl) {
            let currentCount = parseInt(totalProductsEl.textContent);
            totalProductsEl.textContent = currentCount + 1;
        }
    }, 2000);
}

function refreshProducts() {
    console.log('Refreshing products');
    showToast('Refreshing product data...', 'info');
    
    // Add loading animation to button
    const refreshBtn = document.getElementById('refreshProductsBtn');
    if (refreshBtn) {
        const originalHTML = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            refreshBtn.innerHTML = originalHTML;
            refreshBtn.disabled = false;
            showToast('Product data refreshed!', 'success');
            
            // In a real app, this would reload products from API
            loadProducts();
        }, 2000);
    }
}

// ========== UTILITY FUNCTIONS ==========
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

// ========== LOGOUT FUNCTIONALITY ==========
function initLogoutFeature() {
    // Target your logout button by ID
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        // Add click event for logout confirmation
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLogoutModal();
        });
    }
}

// Show logout confirmation modal
function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (!modal) return;
    
    // Show modal
    modal.classList.add('active');
    
    // Add event listeners for modal buttons
    const confirmBtn = document.getElementById('confirmLogout');
    const cancelBtn = document.getElementById('cancelLogout');
    const closeBtn = document.getElementById('closeLogoutModal');
    
    if (confirmBtn) {
        confirmBtn.onclick = handleLogout;
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = hideLogoutModal;
    }
    
    if (closeBtn) {
        closeBtn.onclick = hideLogoutModal;
    }
    
    // Close modal on overlay click
    modal.onclick = (e) => {
        if (e.target === modal) {
            hideLogoutModal();
        }
    };
    
    // Prevent modal content clicks from closing modal
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.onclick = (e) => {
            e.stopPropagation();
        };
    }
}

// Hide logout confirmation modal
function hideLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    showToast('Logout cancelled', 'info');
}

// Clear all authentication tokens and session data
function clearAuthTokens() {
    // Clear localStorage tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('sessionExpiry');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    
    // Clear sessionStorage tokens
    sessionStorage.clear();
    
    // Clear cookies (if using cookies)
    document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Clear any application-specific state
    if (window.auth) {
        window.auth.token = null;
        window.auth.user = null;
        window.auth.isAuthenticated = false;
    }
    
    // Clear all cookies more aggressively
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
    }
}

// Handle actual logout
function handleLogout() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // Show logout in progress toast
    showToast('Logging out...', 'info');
    
    // Clear authentication tokens/session data FIRST
    clearAuthTokens();
    
    // Simulate logout process
    setTimeout(() => {
        // Show success toast
        showToast('Successfully logged out', 'success');
        
        // Redirect to signin page after a short delay
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 1500);
    }, 1000);
}

// ========== TOAST NOTIFICATION SYSTEM ==========
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set icon based on type
    const icons = {
        'success': 'check-circle',
        'info': 'info-circle',
        'error': 'exclamation-circle'
    };
    
    const toastId = 'toast-' + Date.now();
    toast.id = toastId;
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        </div>
        <div class="toast-content">
            <h4 class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close" onclick="removeToast('${toastId}')">
            <i class="fas fa-times"></i>
        </button>
        <div class="toast-progress">
            <div class="toast-progress-bar"></div>
        </div>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
        
        // Start progress bar animation
        const progressBar = toast.querySelector('.toast-progress-bar');
        if (progressBar) {
            progressBar.style.transition = 'transform 5s linear';
            progressBar.style.transform = 'scaleX(0)';
        }
    }, 10);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
        removeToast(toastId);
    }, 5000);
}

// Remove toast function (exposed globally for button click)
function removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (!toast) return;
    
    toast.classList.remove('show');
    
    // Remove from DOM after animation
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 500);
}

// ========== SESSION MANAGEMENT ==========
// Check if token exists and is valid (use this on protected pages)
function checkAuthStatus() {
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('authToken');
    
    if (!token) {
        // No token found, redirect to login
        window.location.href = 'signin.html';
        return false;
    }
    
    // Optional: Validate token expiration if JWT
    if (!isValidToken(token)) {
        clearAuthTokens();
        window.location.href = 'signin.html';
        return false;
    }
    
    return true;
}

// Simple token validation
function isValidToken(token) {
    if (!token || token.length < 10) return false;
    
    try {
        // If it's a JWT token (has 3 parts separated by dots)
        if (token.split('.').length === 3) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // Check if token is expired
            if (payload.exp && payload.exp < Date.now() / 1000) {
                return false;
            }
        }
        return true;
    } catch (e) {
        return false;
    }
}

// Check existing session (use this on signin page)
function checkExistingSession() {
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('authToken');
    
    // If valid token exists and user is on signin page, redirect to dashboard
    if (token && isValidToken(token) && window.location.pathname.includes('signin.html')) {
        window.location.href = 'dashboard.html';
    }
}

// Check session expiry on protected pages
function checkSessionExpiry() {
    const expiryTime = localStorage.getItem('sessionExpiry');
    const currentTime = Date.now();
    
    if (expiryTime && currentTime > parseInt(expiryTime)) {
        // Session expired
        clearAuthTokens();
        showToast('Session expired. Please login again.', 'error');
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 2000);
        return false;
    }
    return true;
}

// ========== INITIALIZE ALL FUNCTIONALITY ==========
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on signin page
    if (window.location.pathname.includes('signin.html')) {
        checkExistingSession();
    } else {
        // For protected pages, check authentication
        if (!checkAuthStatus()) {
            return; // Stop initialization if not authenticated
        }
        
        // Check session expiry
        if (!checkSessionExpiry()) {
            return;
        }
    }
    
    // Initialize logout feature
    initLogoutFeature();
    
    // Then initialize admin dashboard (your existing code)
    if (typeof initAdminDashboard === 'function') {
        initAdminDashboard();
    }
});