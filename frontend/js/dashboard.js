// ========== CONFIGURATION ==========
const CONFIG = {
    API_BASE_URL: window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
        ? 'http://localhost:8000'
        : 'https://zyneth-backend.onrender.com',
    FRONTEND_BASE: window.location.origin,
    TOKEN_KEYS: ['authToken', 'token', 'access_token'],
    USER_KEY: 'user',
    SESSION_EXPIRY_KEY: 'sessionExpiry'
};

// ========== AUTH UTILITIES ==========
function getAuthToken() {
    for (const key of CONFIG.TOKEN_KEYS) {
        const token = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (token && isValidToken(token)) return token;
    }
    return null;
}

function isValidToken(token) {
    if (!token || token.length < 10) return false;
    
    try {
        // JWT validation
        if (token.split('.').length === 3) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && payload.exp < Date.now() / 1000) {
                return false;
            }
        }
        return true;
    } catch {
        return false;
    }
}

function getStoredUser() {
    try {
        const userStr = localStorage.getItem(CONFIG.USER_KEY) || sessionStorage.getItem(CONFIG.USER_KEY);
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

function storeUser(user) {
    if (!user) return;
    const userStr = JSON.stringify(user);
    localStorage.setItem(CONFIG.USER_KEY, userStr);
    sessionStorage.setItem(CONFIG.USER_KEY, userStr);
}

function clearAuthData() {
    CONFIG.TOKEN_KEYS.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    localStorage.removeItem(CONFIG.USER_KEY);
    localStorage.removeItem(CONFIG.SESSION_EXPIRY_KEY);
    sessionStorage.clear();
    document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
}

// ========== USERNAME DISPLAY ==========
async function loadAndDisplayUsername() {
    const dashboardEl = document.getElementById('dashboardUsername');
    const navEl = document.getElementById('navUsername');
    
    // Default fallback
    const setFallback = () => {
        if (dashboardEl) dashboardEl.textContent = 'User';
        if (navEl) navEl.textContent = 'User';
    };
    
    // Try stored user first
    let user = getStoredUser();
    
    // If no stored user or missing username, fetch from API
    if (!user?.username) {
        const token = getAuthToken();
        if (!token) {
            setFallback();
            return;
        }
        
        try {
            user = await fetchCurrentUser(token);
            if (user?.username) {
                storeUser(user);
            } else {
                setFallback();
                return;
            }
        } catch {
            setFallback();
            return;
        }
    }
    
    // Display username
    if (dashboardEl) dashboardEl.textContent = user.username;
    if (navEl) navEl.textContent = user.username;
}

async function fetchCurrentUser(token) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw error;
    }
}

// ========== TOAST SYSTEM ==========
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        'success': 'check-circle',
        'info': 'info-circle',
        'warning': 'exclamation-triangle',
        'error': 'exclamation-circle'
    };
    
    const toastId = 'toast-' + Date.now();
    toast.id = toastId;
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        </div>
        <div class="toast-content">
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
        <div class="toast-progress">
            <div class="toast-progress-bar"></div>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toastId));
    
    const progressBar = toast.querySelector('.toast-progress-bar');
    if (progressBar) {
        progressBar.style.transition = 'transform 5s linear';
        progressBar.style.transform = 'scaleX(0)';
    }
    
    const autoRemove = setTimeout(() => removeToast(toastId), 5000);
    
    toast.addEventListener('mouseenter', () => clearTimeout(autoRemove));
    toast.addEventListener('mouseleave', () => {
        setTimeout(() => removeToast(toastId), 3000);
    });
}

function removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (!toast) return;
    
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
}

// ========== DASHBOARD CORE ==========
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

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (!searchInput || !searchBtn) return;
    
    const performSearch = () => {
        const searchTerm = searchInput.value.trim();
        if (!searchTerm) {
            showToast('Please enter a search term', 'warning');
            return;
        }
        
        showToast(`Searching for "${searchTerm}"...`, 'info');
        setTimeout(() => {
            showToast(`Found results for "${searchTerm}"`, 'success');
            searchInput.value = '';
            searchInput.blur();
        }, 1500);
    };
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}

function initFilters() {
    const platformCheckboxes = document.querySelectorAll('input[name="platform"]');
    const categorySelect = document.querySelector('.category-select');
    
    const updateFilters = () => {
        const selectedPlatforms = Array.from(
            document.querySelectorAll('input[name="platform"]:checked')
        ).map(cb => cb.value);
        
        const selectedCategory = categorySelect?.value || '';
        filterProducts(selectedPlatforms, selectedCategory);
    };
    
    platformCheckboxes.forEach(cb => cb.addEventListener('change', updateFilters));
    if (categorySelect) categorySelect.addEventListener('change', updateFilters);
}

function filterProducts(platforms, category) {
    const productCards = document.querySelectorAll('.product-card');
    let visibleCount = 0;
    
    productCards.forEach(card => {
        const cardPlatform = card.dataset.platform;
        const cardCategory = card.dataset.category;
        
        const platformMatch = platforms.length === 0 || platforms.includes(cardPlatform);
        const categoryMatch = !category || category === cardCategory;
        
        card.style.display = platformMatch && categoryMatch ? 'block' : 'none';
        if (platformMatch && categoryMatch) visibleCount++;
    });
    
    const emptyState = document.getElementById('emptyState');
    if (emptyState && productCards.length > 0) {
        if (visibleCount === 0) {
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
            
            document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
                document.querySelectorAll('input[name="platform"]').forEach(cb => cb.checked = true);
                if (categorySelect) categorySelect.value = '';
                filterProducts([], '');
                emptyState.style.display = 'none';
            });
        } else {
            emptyState.style.display = 'none';
        }
    }
}

// ========== PRODUCTS ==========
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!productsGrid) return;
    
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
    
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    const template = document.getElementById('productCardTemplate');
    if (!template) return;
    
    products.forEach(product => {
        const clone = template.content.cloneNode(true);
        const productCard = clone.querySelector('.product-card');
        
        productCard.dataset.id = product.id;
        productCard.dataset.platform = product.platform;
        productCard.dataset.category = product.category;
        
        const img = productCard.querySelector('.product-image img');
        img.src = product.image;
        img.alt = product.name;
        
        const platformBadge = productCard.querySelector('.platform-badge i');
        const platformClasses = {
            'amazon': 'fab fa-amazon',
            'jumia': 'fas fa-shopping-cart',
            'konga': 'fas fa-store',
            'ebay': 'fab fa-ebay'
        };
        platformBadge.className = platformClasses[product.platform] || 'fas fa-shopping-cart';
        
        productCard.querySelector('.product-title').textContent = product.name;
        productCard.querySelector('.product-category').textContent = 
            product.category.charAt(0).toUpperCase() + product.category.slice(1);
        productCard.querySelector('.tracking-since').textContent = 
            `Tracking since ${product.trackingSince}`;
        
        productCard.querySelector('.price-amount').textContent = 
            `₦${product.currentPrice.toLocaleString()}`;
        
        const priceChange = productCard.querySelector('.price-change');
        priceChange.classList.add(product.priceChange);
        priceChange.textContent = product.priceChange === 'up' ? 'Price Increased' : 'Price Dropped';
        
        productCard.querySelector('.target-amount').textContent = 
            `₦${product.targetPrice.toLocaleString()}`;
        productCard.querySelector('.savings-amount').textContent = 
            `₦${product.savings.toLocaleString()}`;
        
        const progressFill = productCard.querySelector('.progress-fill');
        const progressPercentage = productCard.querySelector('.progress-percentage');
        const progress = Math.min(100, Math.max(0, product.progress));
        
        progressFill.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;
        
        productCard.querySelector('.view-details').addEventListener('click', () => 
            showToast(`Loading product ${product.id} details...`, 'info'));
        productCard.querySelector('.edit-alert').addEventListener('click', () => 
            showToast(`Editing alert for product ${product.id}...`, 'info'));
        productCard.querySelector('.stop-tracking').addEventListener('click', () => {
            if (confirm('Stop tracking this product?')) {
                productCard.style.opacity = '0';
                productCard.style.transform = 'translateY(20px)';
                setTimeout(() => productCard.remove(), 300);
                updateStatsAfterRemoval();
                showToast('Product tracking stopped', 'success');
            }
        });
        
        productsGrid.appendChild(clone);
    });
}

function updateStatsAfterRemoval() {
    const totalProductsEl = document.getElementById('totalProducts');
    if (totalProductsEl) {
        let currentCount = parseInt(totalProductsEl.textContent);
        if (currentCount > 0) totalProductsEl.textContent = currentCount - 1;
    }
}

// ========== NOTIFICATIONS ==========
function initNotifications() {
    document.getElementById('markAllReadBtn')?.addEventListener('click', markAllNotificationsAsRead);
}

function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    const emptyNotifications = document.getElementById('emptyNotifications');
    
    if (!notificationsList) return;
    
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
        }
    ];
    
    notificationsList.innerHTML = '';
    
    if (notifications.length === 0) {
        if (emptyNotifications) emptyNotifications.style.display = 'block';
        return;
    }
    
    if (emptyNotifications) emptyNotifications.style.display = 'none';
    
    const template = document.getElementById('notificationTemplate');
    if (!template) return;
    
    notifications.forEach(notification => {
        const clone = template.content.cloneNode(true);
        const notificationItem = clone.querySelector('.notification-item');
        
        notificationItem.dataset.id = notification.id; // FIX: Add data-id attribute
        if (!notification.read) notificationItem.classList.add('unread');
        
        const icon = notificationItem.querySelector('.notification-icon i');
        const iconClasses = {
            'price_drop': 'fas fa-arrow-down',
            'target_reached': 'fas fa-bullseye',
            'product_added': 'fas fa-plus',
            'summary': 'fas fa-chart-line',
            'price_increase': 'fas fa-arrow-up'
        };
        icon.className = iconClasses[notification.type] || 'fas fa-bell';
        
        notificationItem.querySelector('.notification-title').textContent = notification.title;
        notificationItem.querySelector('.notification-text').textContent = notification.text;
        notificationItem.querySelector('.notification-time').textContent = notification.time;
        
        notificationItem.querySelector('.mark-read').addEventListener('click', (e) => {
            e.stopPropagation();
            markNotificationAsRead(notification.id);
        });
        
        notificationItem.querySelector('.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNotification(notification.id);
        });
        
        notificationItem.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-actions')) {
                showToast(`Notification ${notification.id} clicked`, 'info');
            }
        });
        
        notificationsList.appendChild(clone);
    });
}

function markNotificationAsRead(notificationId) {
    const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
    if (notificationItem) notificationItem.classList.remove('unread');
    showToast('Notification marked as read', 'success');
}

function markAllNotificationsAsRead() {
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread');
    });
    showToast('All notifications marked as read', 'success');
}

function deleteNotification(notificationId) {
    const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
    if (notificationItem) {
        notificationItem.style.opacity = '0';
        notificationItem.style.transform = 'translateX(-20px)';
        setTimeout(() => notificationItem.remove(), 300);
        showToast('Notification deleted', 'success');
        
        const notificationsList = document.getElementById('notificationsList');
        if (notificationsList?.children.length === 0) {
            const emptyNotifications = document.getElementById('emptyNotifications');
            if (emptyNotifications) emptyNotifications.style.display = 'block';
        }
    }
}

// ========== BUTTONS ==========
function initButtons() {
    document.getElementById('addProductBtn')?.addEventListener('click', () => {
        showToast('Opening product search...', 'info');
        setTimeout(() => {
            const totalProductsEl = document.getElementById('totalProducts');
            if (totalProductsEl) {
                let currentCount = parseInt(totalProductsEl.textContent);
                totalProductsEl.textContent = currentCount + 1;
            }
            showToast('Product added to tracking list!', 'success');
        }, 2000);
    });
    
    document.getElementById('refreshProductsBtn')?.addEventListener('click', function() {
        showToast('Refreshing product data...', 'info');
        const originalHTML = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        this.disabled = true;
        
        setTimeout(() => {
            this.innerHTML = originalHTML;
            this.disabled = false;
            showToast('Product data refreshed!', 'success');
            loadProducts();
        }, 2000);
    });
    
    document.getElementById('startTrackingBtn')?.addEventListener('click', () => {
        showToast('Opening product search...', 'info');
    });
}

// ========== STATS ==========
function updateStats() {
    const stats = {
        totalProducts: 12,
        activeAlerts: 8,
        totalSavings: 45200,
        lastDrops: 3
    };
    
    const totalProductsEl = document.getElementById('totalProducts');
    const activeAlertsEl = document.getElementById('activeAlerts');
    const totalSavingsEl = document.getElementById('totalSavings');
    const lastDropEl = document.getElementById('lastDrop');
    
    if (totalProductsEl) totalProductsEl.textContent = stats.totalProducts;
    if (activeAlertsEl) activeAlertsEl.textContent = stats.activeAlerts;
    if (totalSavingsEl) totalSavingsEl.textContent = `₦${stats.totalSavings.toLocaleString()}`;
    if (lastDropEl) lastDropEl.textContent = stats.lastDrops;
}

// ========== LOGOUT ==========
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLogoutModal();
    });
}

function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (!modal) return;
    
    modal.classList.add('active');
    
    const hideModal = () => modal.classList.remove('active');
    
    document.getElementById('confirmLogout')?.addEventListener('click', handleLogout);
    document.getElementById('cancelLogout')?.addEventListener('click', hideModal);
    document.getElementById('closeLogoutModal')?.addEventListener('click', hideModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });
    
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('click', (e) => e.stopPropagation());
    }
}

function handleLogout() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.classList.remove('active');
    
    showToast('Logging out...', 'info');
    
    clearAuthData();
    
    setTimeout(() => {
        showToast('Successfully logged out', 'success');
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 1500);
    }, 1000);
}

// ========== SESSION CHECK ==========
function checkSessionExpiry() {
    const expiryTime = localStorage.getItem(CONFIG.SESSION_EXPIRY_KEY);
    if (expiryTime && Date.now() > parseInt(expiryTime)) {
        clearAuthData();
        showToast('Session expired. Please login again.', 'error');
        setTimeout(() => window.location.href = 'signin.html', 2000);
        return false;
    }
    return true;
}

// ========== INITIALIZATION ==========
async function initDashboard() {
    // 1. Check authentication
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'signin.html';
        return;
    }
    
    // 2. Check session expiry
    if (!checkSessionExpiry()) return;
    
    // 3. Load and display username
    await loadAndDisplayUsername();
    
    // 4. Initialize dashboard features
    setCurrentDate();
    initSearch();
    initFilters();
    updateStats();
    loadProducts();
    initButtons();
    initNotifications();
    loadNotifications();
    initLogout();
    
    // 5. Add window resize handler for mobile menu
    window.addEventListener('resize', () => {
        const navMenu = document.getElementById('navMenu');
        const hamburger = document.getElementById('hamburger');
        
        if (window.innerWidth > 768 && navMenu?.classList.contains('active')) {
            hamburger?.classList.remove('active');
            navMenu.classList.remove('active');
            const overlay = document.querySelector('.mobile-overlay');
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
            }
        }
    });
}

// ========== START DASHBOARD ==========
document.addEventListener('DOMContentLoaded', initDashboard);