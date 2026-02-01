// ========== CONFIGURATION ==========
const CONFIG = {
    API_BASE_URL: window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
        ? 'http://localhost:8000'
        : 'https://zyneth-backend.onrender.com',
    FRONTEND_BASE: window.location.origin,
    TOKEN_KEYS: ['authToken', 'token', 'access_token'],
    USER_KEY: 'user',
    SESSION_EXPIRY_KEY: 'sessionExpiry',
    STORAGE_KEYS: {
        TRACKED_PRODUCTS: 'zyneth_tracked_products',
        LAST_PRODUCT_ID: 'zyneth_last_product_id'
    }
};

// ========== PRODUCT TRACKING SYSTEM ==========
let currentProductId = null;
let isEditing = false;

// Generate mock current price (slightly above or below target for realism)
function generateMockCurrentPrice(targetPrice) {
    const variation = Math.random() * 0.3 - 0.15; // -15% to +15% variation
    return Math.round(targetPrice * (1 + variation));
}

// Calculate savings
function calculateSavings(currentPrice, targetPrice) {
    return Math.max(0, currentPrice - targetPrice);
}

// Calculate progress percentage
function calculateProgress(currentPrice, targetPrice) {
    if (currentPrice <= targetPrice) return 100;
    const maxPrice = targetPrice * 1.5; // Assume max price is 50% above target
    const progress = ((maxPrice - currentPrice) / (maxPrice - targetPrice)) * 100;
    return Math.max(0, Math.min(100, Math.round(progress)));
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

// ========== PRODUCT MODAL FUNCTIONS ==========
function openProductModal(mode = 'add', productId = null) {
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('productModalTitle');
    const submitButtonText = document.getElementById('submitButtonText');
    
    if (!modal || !modalTitle || !submitButtonText) return;
    
    if (mode === 'edit' && productId) {
        const products = loadProductsFromStorage();
        const product = products.find(p => p.id === productId);
        if (product) {
            fillProductForm(product);
            modalTitle.textContent = 'Edit Product';
            submitButtonText.textContent = 'Update Product';
            isEditing = true;
            currentProductId = productId;
        }
    } else {
        clearProductForm();
        modalTitle.textContent = 'Track a Product';
        submitButtonText.textContent = 'Add Product';
        isEditing = false;
        currentProductId = null;
    }
    
    modal.classList.add('active');
    document.getElementById('productTitle').focus();
    trapModalFocus(modal);
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('active');
        clearFormErrors();
    }
    isEditing = false;
    currentProductId = null;
}

function fillProductForm(product) {
    document.getElementById('productTitle').value = product.title || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productLocation').value = product.location || '';
    document.getElementById('productBrand').value = product.brand || '';
    document.getElementById('productModel').value = product.model || '';
    document.getElementById('productPrice').value = product.preferredPrice || '';
}

function clearProductForm() {
    document.getElementById('productForm').reset();
    clearFormErrors();
}

function clearFormErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(el => el.textContent = '');
}

function validateProductForm(formData) {
    let isValid = true;
    clearFormErrors();
    
    // Validate title
    if (!formData.title.trim()) {
        document.getElementById('titleError').textContent = 'Title is required';
        isValid = false;
    }
    
    // Validate category
    if (!formData.category) {
        document.getElementById('categoryError').textContent = 'Category is required';
        isValid = false;
    }
    
    // Validate location
    if (!formData.location.trim()) {
        document.getElementById('locationError').textContent = 'Location is required';
        isValid = false;
    }
    
    // Validate brand
    if (!formData.brand.trim()) {
        document.getElementById('brandError').textContent = 'Brand is required';
        isValid = false;
    }
    
    // Validate model
    if (!formData.model.trim()) {
        document.getElementById('modelError').textContent = 'Model is required';
        isValid = false;
    }
    
    // Validate price - handle commas in input
    const priceInput = document.getElementById('productPrice').value;
    const priceWithoutCommas = priceInput.replace(/,/g, '');
    const price = parseFloat(priceWithoutCommas);
    
    if (isNaN(price) || price <= 0) {
        document.getElementById('priceError').textContent = 'Price must be greater than 0';
        isValid = false;
    }
    
    return isValid;
}

function trapModalFocus(modal) {
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeProductModal();
            return;
        }
        
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
}

// ========== PRODUCT STORAGE FUNCTIONS ==========
function getNextProductId() {
    let lastId = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_PRODUCT_ID) || 0;
    lastId = parseInt(lastId) + 1;
    localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_PRODUCT_ID, lastId.toString());
    return lastId;
}

function saveProductsToStorage(products) {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.TRACKED_PRODUCTS, JSON.stringify(products));
        return true;
    } catch (error) {
        console.error('Error saving products to localStorage:', error);
        return false;
    }
}

function loadProductsFromStorage() {
    try {
        const productsJson = localStorage.getItem(CONFIG.STORAGE_KEYS.TRACKED_PRODUCTS);
        return productsJson ? JSON.parse(productsJson) : [];
    } catch (error) {
        console.error('Error loading products from localStorage:', error);
        return [];
    }
}

function saveProduct(productData) {
    const products = loadProductsFromStorage();
    const now = new Date().toISOString();
    
    if (isEditing && currentProductId) {
        // Update existing product
        const index = products.findIndex(p => p.id === currentProductId);
        if (index !== -1) {
            const currentPrice = generateMockCurrentPrice(productData.preferredPrice);
            products[index] = {
                ...products[index],
                ...productData,
                currentPrice: currentPrice,
                savings: calculateSavings(currentPrice, productData.preferredPrice),
                lastUpdated: now
            };
        }
    } else {
        // Add new product
        const currentPrice = generateMockCurrentPrice(productData.preferredPrice);
        const newProduct = {
            id: getNextProductId(),
            ...productData,
            currentPrice: currentPrice,
            savings: calculateSavings(currentPrice, productData.preferredPrice),
            platform: ['amazon', 'jumia', 'konga', 'ebay'][Math.floor(Math.random() * 4)],
            trackingSince: now,
            lastUpdated: now,
            image: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000000)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80`
        };
        products.push(newProduct);
    }
    
    return saveProductsToStorage(products);
}

function deleteProduct(productId) {
    const products = loadProductsFromStorage();
    const filteredProducts = products.filter(p => p.id !== productId);
    return saveProductsToStorage(filteredProducts);
}

// ========== PRODUCT RENDERING ==========
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!productsGrid) return;
    
    const products = loadProductsFromStorage();
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        updateStats();
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
        productCard.dataset.category = product.category.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
        
        const img = productCard.querySelector('.product-image img');
        img.src = product.image;
        img.alt = product.title;
        
        const platformBadge = productCard.querySelector('.platform-badge i');
        const platformClasses = {
            'amazon': 'fab fa-amazon',
            'jumia': 'fas fa-shopping-cart',
            'konga': 'fas fa-store',
            'ebay': 'fab fa-ebay'
        };
        platformBadge.className = platformClasses[product.platform] || 'fas fa-shopping-cart';
        
        productCard.querySelector('.product-title').textContent = product.title;
        productCard.querySelector('.product-category').textContent = product.category;
        productCard.querySelector('.tracking-since').textContent = 
            `Tracking since ${formatDate(product.trackingSince)}`;
        
        const currentPrice = product.currentPrice || generateMockCurrentPrice(product.preferredPrice);
        productCard.querySelector('.price-amount').textContent = 
            `₦${currentPrice.toLocaleString()}`;
        
        const priceChange = productCard.querySelector('.price-change');
        const isPriceDown = currentPrice <= product.preferredPrice;
        priceChange.classList.add(isPriceDown ? 'down' : 'up');
        priceChange.textContent = isPriceDown ? 'Price Dropped' : 'Price Increased';
        
        productCard.querySelector('.target-amount').textContent = 
            `₦${product.preferredPrice.toLocaleString()}`;
        
        const savings = product.savings || calculateSavings(currentPrice, product.preferredPrice);
        productCard.querySelector('.savings-amount').textContent = 
            `₦${savings.toLocaleString()}`;
        
        const progressFill = productCard.querySelector('.progress-fill');
        const progressPercentage = productCard.querySelector('.progress-percentage');
        const progress = calculateProgress(currentPrice, product.preferredPrice);
        
        progressFill.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;
        
        // Add event listeners for card actions
        productCard.querySelector('.view-details').addEventListener('click', () => {
            showToast(`Loading ${product.title} details...`, 'info');
        });
        
        productCard.querySelector('.edit-alert').addEventListener('click', () => {
            openProductModal('edit', product.id);
        });
        
        productCard.querySelector('.stop-tracking').addEventListener('click', () => {
            if (confirm(`Stop tracking ${product.title}?`)) {
                if (deleteProduct(product.id)) {
                    productCard.style.opacity = '0';
                    productCard.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        productCard.remove();
                        updateStats();
                        renderProducts(); // Re-render to update empty state if needed
                        showToast(`${product.title} tracking stopped`, 'success');
                    }, 300);
                } else {
                    showToast('Failed to stop tracking', 'error');
                }
            }
        });
        
        productsGrid.appendChild(clone);
    });
    
    updateStats();
}

function updateStats() {
    const products = loadProductsFromStorage();
    const totalProducts = products.length;
    
    // Calculate total savings
    const totalSavings = products.reduce((sum, product) => {
        return sum + (product.savings || 0);
    }, 0);
    
    // Update DOM elements
    const totalProductsEl = document.getElementById('totalProducts');
    const totalSavingsEl = document.getElementById('totalSavings');
    
    if (totalProductsEl) totalProductsEl.textContent = totalProducts;
    if (totalSavingsEl) totalSavingsEl.textContent = `₦${totalSavings.toLocaleString()}`;
}

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
    // Add Product button
    document.getElementById('addProductBtn')?.addEventListener('click', () => {
        openProductModal('add');
    });
    
    // Start Tracking button in empty state
    document.getElementById('startTrackingBtn')?.addEventListener('click', () => {
        openProductModal('add');
    });
    
    // Refresh Products button
    document.getElementById('refreshProductsBtn')?.addEventListener('click', function() {
        showToast('Refreshing product data...', 'info');
        const originalHTML = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        this.disabled = true;
        
        setTimeout(() => {
            this.innerHTML = originalHTML;
            this.disabled = false;
            renderProducts();
            showToast('Product data refreshed!', 'success');
        }, 2000);
    });
    
    // Initialize product form submission
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductFormSubmit);
    }
    
    // Initialize modal close buttons
    document.getElementById('closeProductModal')?.addEventListener('click', closeProductModal);
    document.getElementById('cancelProductForm')?.addEventListener('click', closeProductModal);
    
    // Close modal on overlay click
    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                closeProductModal();
            }
        });
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && productModal?.classList.contains('active')) {
            closeProductModal();
        }
    });
}

function handleProductFormSubmit(e) {
    e.preventDefault();
    
    // Get price value and remove commas for parsing
    const priceInput = document.getElementById('productPrice').value;
    const priceWithoutCommas = priceInput.replace(/,/g, '');
    
    const formData = {
        title: document.getElementById('productTitle').value.trim(),
        category: document.getElementById('productCategory').value,
        location: document.getElementById('productLocation').value.trim(),
        brand: document.getElementById('productBrand').value.trim(),
        model: document.getElementById('productModel').value.trim(),
        preferredPrice: parseFloat(priceWithoutCommas)
    };
    
    if (!validateProductForm(formData)) {
        showToast('Please fix the errors in the form', 'error');
        return;
    }
    
    if (saveProduct(formData)) {
        const successMessage = isEditing ? 
            `${formData.title} updated successfully!` : 
            `${formData.title} added to tracked products!`;
        
        showToast(successMessage, 'success');
        closeProductModal();
        renderProducts();
    } else {
        showToast('Failed to save product. Please try again.', 'error');
    }
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
    renderProducts(); // Load products from localStorage
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