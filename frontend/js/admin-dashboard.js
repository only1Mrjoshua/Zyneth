// ========== ADMIN DASHBOARD FUNCTIONALITY ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all admin functionality
    initAdminDashboard();
});

function initAdminDashboard() {
    // Set time displays
    updateTimeDisplays();
    
    // Load all dashboard data
    loadAdminData();
    
    // Initialize buttons and interactions
    initAdminButtons();
    
    // Start time updates
    startTimeUpdates();
}

// ========== TIME DISPLAYS ==========
function updateTimeDisplays() {
    const now = new Date();
    
    // Last updated time
    const lastUpdated = document.getElementById('lastUpdatedTime');
    if (lastUpdated) {
        lastUpdated.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    // Server time
    const serverTime = document.getElementById('serverTime');
    if (serverTime) {
        serverTime.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function startTimeUpdates() {
    // Update time every minute
    setInterval(updateTimeDisplays, 60000);
}

// ========== ADMIN DATA LOADING ==========
function loadAdminData() {
    // Load metrics
    loadMetrics();
    
    // Load users
    loadUsers();
    
    // Load products
    loadProducts();
    
    // Don't load alerts - use HTML demo alerts
    // loadAlerts(); // COMMENTED OUT TO USE HTML DEMO ALERTS
    
    // Don't load activity log - use HTML demo activity log
    // loadActivityLog(); // COMMENTED OUT TO USE HTML DEMO ACTIVITY LOG
    
    // Add event listeners to existing demo alerts and activity log
    addEventListenersToAlerts();
}

function loadMetrics() {
    const metricsGrid = document.querySelector('.metrics-grid');
    if (!metricsGrid) return;
    
    // Sample metrics data
    const metrics = [
        {
            icon: 'fa-users',
            value: '1,254',
            label: 'Total Users',
            trend: '+2.5%',
            trendUp: true
        },
        {
            icon: 'fa-boxes',
            value: '4,892',
            label: 'Tracked Products',
            trend: '+12%',
            trendUp: true
        },
        {
            icon: 'fa-bell',
            value: '3,145',
            label: 'Active Alerts',
            trend: '-5%',
            trendUp: false
        },
        {
            icon: 'fa-bell',
            value: '128',
            label: 'Alerts Today',
            trend: '+8%',
            trendUp: true
        },
        {
            icon: 'fa-layer-group',
            value: '4',
            label: 'Platforms',
            trend: '0%',
            trendUp: null
        },
        {
            icon: 'fa-chart-line',
            value: '98.7%',
            label: 'Success Rate',
            trend: '+0.3%',
            trendUp: true
        }
    ];
    
    // Clear existing metrics
    metricsGrid.innerHTML = '';
    
    // Load metric template
    const template = document.getElementById('metricCardTemplate');
    if (!template) return;
    
    // Render each metric
    metrics.forEach(metric => {
        const clone = template.content.cloneNode(true);
        const metricCard = clone.querySelector('.metric-card');
        
        // Fill in metric data
        const icon = metricCard.querySelector('.metric-icon i');
        icon.className = `fas ${metric.icon}`;
        
        const value = metricCard.querySelector('.metric-value');
        value.textContent = metric.value;
        
        const label = metricCard.querySelector('.metric-label');
        label.textContent = metric.label;
        
        const trend = metricCard.querySelector('.metric-trend');
        const trendValue = trend.querySelector('.trend-value');
        const trendIcon = trend.querySelector('i');
        
        trendValue.textContent = metric.trend;
        
        if (metric.trendUp === true) {
            trendIcon.className = 'fas fa-arrow-up';
            trend.classList.add('up');
        } else if (metric.trendUp === false) {
            trendIcon.className = 'fas fa-arrow-down';
            trend.classList.add('down');
        } else {
            trendIcon.style.display = 'none';
            trendValue.textContent = 'Stable';
        }
        
        // Add to grid
        metricsGrid.appendChild(clone);
    });
}

function loadUsers() {
    const usersTableBody = document.getElementById('usersTableBody');
    const usersCount = document.getElementById('usersCount');
    
    if (!usersTableBody) return;
    
    // Sample users data
    const users = [
        {
            id: 1,
            username: 'john_doe',
            email: 'john.doe@example.com',
            trackedProducts: 12,
            activeAlerts: 8,
            status: 'active',
            role: 'Standard User'
        },
        {
            id: 2,
            username: 'jane_smith',
            email: 'jane.smith@example.com',
            trackedProducts: 5,
            activeAlerts: 3,
            status: 'active',
            role: 'Premium User'
        },
        {
            id: 3,
            username: 'bob_wilson',
            email: 'bob.wilson@example.com',
            trackedProducts: 0,
            activeAlerts: 0,
            status: 'suspended',
            role: 'Standard User'
        },
        {
            id: 4,
            username: 'alice_johnson',
            email: 'alice.johnson@example.com',
            trackedProducts: 23,
            activeAlerts: 15,
            status: 'active',
            role: 'Admin'
        },
        {
            id: 5,
            username: 'charlie_brown',
            email: 'charlie.brown@example.com',
            trackedProducts: 7,
            activeAlerts: 4,
            status: 'pending',
            role: 'Standard User'
        }
    ];
    
    // Clear existing users
    usersTableBody.innerHTML = '';
    
    // Load user template
    const template = document.getElementById('userRowTemplate');
    if (!template) return;
    
    // Render each user
    users.forEach(user => {
        const clone = template.content.cloneNode(true);
        const row = clone.querySelector('tr');
        
        row.setAttribute('data-user-id', user.id);
        
        // Fill in user data
        const username = row.querySelector('.username');
        username.textContent = user.username;
        
        const userRole = row.querySelector('.user-role');
        userRole.textContent = user.role;
        
        const emailCell = row.querySelector('td:nth-child(2)');
        emailCell.textContent = user.email;
        
        const trackedCell = row.querySelector('td:nth-child(3)');
        trackedCell.textContent = user.trackedProducts;
        
        const alertsCell = row.querySelector('td:nth-child(4)');
        alertsCell.textContent = user.activeAlerts;
        
        const statusBadge = row.querySelector('.status-badge');
        statusBadge.textContent = user.status.charAt(0).toUpperCase() + user.status.slice(1);
        statusBadge.className = `status-badge ${user.status}`;
        
        // Add event listeners to action buttons
        const viewBtn = row.querySelector('.view-user');
        const suspendBtn = row.querySelector('.suspend-user');
        const deleteBtn = row.querySelector('.delete-user');
        
        viewBtn.addEventListener('click', () => viewUser(user.id));
        suspendBtn.addEventListener('click', () => toggleUserStatus(user.id, user.status));
        deleteBtn.addEventListener('click', () => deleteUser(user.id));
        
        // Update button icon based on status
        if (user.status === 'suspended') {
            suspendBtn.innerHTML = '<i class="fas fa-user-check"></i>';
            suspendBtn.title = 'Activate User';
        }
        
        // Add to table
        usersTableBody.appendChild(clone);
    });
    
    // Update user count
    if (usersCount) {
        usersCount.textContent = users.length;
    }
}

function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!productsGrid) return;
    
    // Sample products data
    const products = [
        {
            id: 1,
            name: 'Samsung Galaxy S23 Ultra 512GB',
            platform: 'amazon',
            currentPrice: '₦850,000',
            priceChange: '-5.2%',
            trend: 'down',
            updated: '2 min ago',
            priceChanges: 12,
            users: 25
        },
        {
            id: 2,
            name: 'Apple MacBook Pro 14" M2 Pro',
            platform: 'jumia',
            currentPrice: '₦1,200,000',
            priceChange: '+2.1%',
            trend: 'up',
            updated: '15 min ago',
            priceChanges: 8,
            users: 18
        },
        {
            id: 3,
            name: 'Nike Air Max 270 React',
            platform: 'konga',
            currentPrice: '₦45,000',
            priceChange: '-8.5%',
            trend: 'down',
            updated: '1 hour ago',
            priceChanges: 5,
            users: 32
        },
        {
            id: 4,
            name: 'Sony WH-1000XM5 Headphones',
            platform: 'ebay',
            currentPrice: '₦85,000',
            priceChange: '0%',
            trend: 'stable',
            updated: '30 min ago',
            priceChanges: 3,
            users: 12
        }
    ];
    
    // Clear existing products
    productsGrid.innerHTML = '';
    
    // Check if empty state should be shown
    if (products.length === 0) {
        const emptyState = document.getElementById('productsEmptyState');
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }
    
    const emptyState = document.getElementById('productsEmptyState');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Load product template
    const template = document.getElementById('productCardTemplate');
    if (!template) return;
    
    // Render each product
    products.forEach(product => {
        const clone = template.content.cloneNode(true);
        const productCard = clone.querySelector('.product-admin-card');
        
        productCard.setAttribute('data-product-id', product.id);
        
        // Platform icon and name
        const platformIcon = productCard.querySelector('.product-platform i');
        const platformName = productCard.querySelector('.product-platform span');
        
        const platformClasses = {
            'amazon': 'fab fa-amazon',
            'jumia': 'fas fa-shopping-cart',
            'konga': 'fas fa-store',
            'ebay': 'fab fa-ebay'
        };
        
        platformIcon.className = platformClasses[product.platform] || 'fas fa-shopping-cart';
        platformName.textContent = product.platform.charAt(0).toUpperCase() + product.platform.slice(1);
        
        // Users count
        const usersCount = productCard.querySelector('.product-users span');
        usersCount.textContent = `${product.users} users`;
        
        // Product name
        const productName = productCard.querySelector('.product-name');
        productName.textContent = product.name;
        
        // Price and change
        const currentPrice = productCard.querySelector('.current-price');
        const priceChange = productCard.querySelector('.price-change');
        
        currentPrice.textContent = product.currentPrice;
        priceChange.textContent = product.priceChange;
        priceChange.className = `price-change ${product.trend}`;
        
        // Meta information
        const updatedSpan = productCard.querySelector('.product-meta span:nth-child(1)');
        const changesSpan = productCard.querySelector('.product-meta span:nth-child(2)');
        
        updatedSpan.innerHTML = `<i class="fas fa-clock"></i> Updated: ${product.updated}`;
        changesSpan.innerHTML = `<i class="fas fa-history"></i> ${product.priceChanges} price changes`;
        
        // Add event listeners to action buttons
        const viewBtn = productCard.querySelector('.view-history');
        const refreshBtn = productCard.querySelector('.force-refresh');
        const disableBtn = productCard.querySelector('.disable-tracking');
        
        viewBtn.addEventListener('click', () => viewProductHistory(product.id));
        refreshBtn.addEventListener('click', () => forceProductRefresh(product.id));
        disableBtn.addEventListener('click', () => disableProductTracking(product.id));
        
        // Add to grid
        productsGrid.appendChild(clone);
    });
}

// ========== ADD EVENT LISTENERS TO EXISTING DEMO ALERTS ==========
function addEventListenersToAlerts() {
    const alerts = document.querySelectorAll('.alert-item');
    
    alerts.forEach((alertItem, index) => {
        const alertId = index + 1;
        
        // Add event listeners to action buttons
        const viewBtn = alertItem.querySelector('.view-details');
        const resolveBtn = alertItem.querySelector('.mark-resolved');
        
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                viewAlertDetails(alertId);
            });
        }
        
        if (resolveBtn) {
            resolveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                markAlertResolved(alertId);
            });
        }
        
        // Add click event to view alert
        alertItem.addEventListener('click', (e) => {
            if (!e.target.closest('.alert-actions')) {
                viewAlertDetails(alertId);
            }
        });
    });
}

// ========== ADMIN ACTIONS ==========
function initAdminButtons() {
    // Refresh system button
    const refreshBtn = document.getElementById('refreshSystemBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshSystemData);
    }
    
    // User management buttons
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', addNewUser);
    }
    
    const exportUsersBtn = document.getElementById('exportUsersBtn');
    if (exportUsersBtn) {
        exportUsersBtn.addEventListener('click', exportUsersCSV);
    }
    
    // Alerts management
    const clearAlertsBtn = document.getElementById('clearOldAlertsBtn');
    if (clearAlertsBtn) {
        clearAlertsBtn.addEventListener('click', clearOldAlerts);
    }
    
    // Activity log export
    const exportLogBtn = document.getElementById('exportLogBtn');
    if (exportLogBtn) {
        exportLogBtn.addEventListener('click', exportActivityLog);
    }
    
    // Product search and filter
    const productSearch = document.getElementById('productSearch');
    const platformFilter = document.getElementById('platformFilter');
    
    if (productSearch) {
        productSearch.addEventListener('input', filterProducts);
    }
    
    if (platformFilter) {
        platformFilter.addEventListener('change', filterProducts);
    }
}

function refreshSystemData() {
    const btn = document.getElementById('refreshSystemBtn');
    if (!btn) return;
    
    // Show loading state
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    btn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reload all data (except alerts and activity log)
        loadMetrics();
        loadUsers();
        loadProducts();
        
        // Update time
        updateTimeDisplays();
        
        // Restore button
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        
        // Show success message
        showAdminToast('System data refreshed successfully', 'success');
    }, 1500);
}

function viewUser(userId) {
    console.log(`Viewing user ${userId}`);
    showAdminToast(`Loading user details...`, 'info');
    
    // In a real app, this would open a modal or navigate to user details
    setTimeout(() => {
        showAdminToast(`User details loaded`, 'success');
    }, 1000);
}

function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'suspended' ? 'suspend' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    console.log(`Toggling user ${userId} status to ${newStatus}`);
    showAdminToast(`${action.charAt(0).toUpperCase() + action.slice(1)}ing user...`, 'info');
    
    // Simulate API call
    setTimeout(() => {
        // Update UI
        const row = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (row) {
            const statusBadge = row.querySelector('.status-badge');
            const suspendBtn = row.querySelector('.suspend-user');
            
            statusBadge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
            statusBadge.className = `status-badge ${newStatus}`;
            
            if (newStatus === 'suspended') {
                suspendBtn.innerHTML = '<i class="fas fa-user-check"></i>';
                suspendBtn.title = 'Activate User';
            } else {
                suspendBtn.innerHTML = '<i class="fas fa-user-slash"></i>';
                suspendBtn.title = 'Suspend User';
            }
        }
        
        showAdminToast(`User ${action}ed successfully`, 'success');
    }, 1000);
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    console.log(`Deleting user ${userId}`);
    showAdminToast('Deleting user...', 'info');
    
    // Simulate API call
    setTimeout(() => {
        // Remove from UI
        const row = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (row) {
            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                if (row.parentNode) {
                    row.parentNode.removeChild(row);
                }
                
                // Update user count
                const usersCount = document.getElementById('usersCount');
                if (usersCount) {
                    let currentCount = parseInt(usersCount.textContent);
                    usersCount.textContent = currentCount - 1;
                }
            }, 300);
        }
        
        showAdminToast('User deleted successfully', 'success');
    }, 1000);
}

function addNewUser() {
    console.log('Adding new user');
    showAdminToast('Opening user creation form...', 'info');
    
    // In a real app, this would open a modal
    setTimeout(() => {
        showAdminToast('User creation form opened', 'success');
    }, 500);
}

function exportUsersCSV() {
    console.log('Exporting users to CSV');
    showAdminToast('Preparing CSV export...', 'info');
    
    // Simulate export
    setTimeout(() => {
        showAdminToast('Users exported to CSV successfully', 'success');
    }, 2000);
}

function viewProductHistory(productId) {
    console.log(`Viewing price history for product ${productId}`);
    showAdminToast('Loading price history...', 'info');
    
    // In a real app, this would open a chart modal
    setTimeout(() => {
        showAdminToast('Price history loaded', 'success');
    }, 1000);
}

function forceProductRefresh(productId) {
    console.log(`Forcing refresh for product ${productId}`);
    showAdminToast('Refreshing product data...', 'info');
    
    // Simulate API call
    setTimeout(() => {
        showAdminToast('Product data refreshed successfully', 'success');
    }, 1500);
}

function disableProductTracking(productId) {
    if (!confirm('Are you sure you want to disable tracking for this product?')) {
        return;
    }
    
    console.log(`Disabling tracking for product ${productId}`);
    showAdminToast('Disabling product tracking...', 'info');
    
    // Simulate API call
    setTimeout(() => {
        // Remove from UI
        const productCard = document.querySelector(`.product-admin-card[data-product-id="${productId}"]`);
        if (productCard) {
            productCard.style.opacity = '0';
            productCard.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                if (productCard.parentNode) {
                    productCard.parentNode.removeChild(productCard);
                }
                
                // Check if products grid is empty
                const productsGrid = document.getElementById('productsGrid');
                if (productsGrid && productsGrid.children.length === 0) {
                    const emptyState = document.getElementById('productsEmptyState');
                    if (emptyState) {
                        emptyState.style.display = 'block';
                    }
                }
            }, 300);
        }
        
        showAdminToast('Product tracking disabled', 'success');
    }, 1000);
}

function viewAlertDetails(alertId) {
    console.log(`Viewing alert details ${alertId}`);
    showAdminToast('Loading alert details...', 'info');
    
    // In a real app, this would open a modal
    setTimeout(() => {
        // Mark as read
        const alertItem = document.querySelector(`.alert-item:nth-child(${alertId})`);
        if (alertItem) {
            alertItem.classList.remove('unread');
        }
        
        showAdminToast('Alert details loaded', 'success');
    }, 500);
}

function markAlertResolved(alertId) {
    console.log(`Marking alert ${alertId} as resolved`);
    
    // Remove from UI
    const alertItem = document.querySelector(`.alert-item:nth-child(${alertId})`);
    if (alertItem) {
        alertItem.style.opacity = '0';
        alertItem.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            if (alertItem.parentNode) {
                alertItem.parentNode.removeChild(alertItem);
            }
            
            // Check if alerts list is empty
            const alertsList = document.getElementById('alertsList');
            if (alertsList && alertsList.children.length === 0) {
                const emptyState = document.getElementById('alertsEmptyState');
                if (emptyState) {
                    emptyState.style.display = 'block';
                }
            }
        }, 300);
    }
    
    showAdminToast('Alert marked as resolved', 'success');
}

function clearOldAlerts() {
    if (!confirm('Are you sure you want to clear all alerts older than 7 days?')) {
        return;
    }
    
    console.log('Clearing old alerts');
    showAdminToast('Clearing old alerts...', 'info');
    
    // Simulate API call
    setTimeout(() => {
        // Remove all non-unread alerts from UI
        const alerts = document.querySelectorAll('.alert-item:not(.unread)');
        alerts.forEach(alert => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        });
        
        setTimeout(() => {
            // Check if alerts list is empty
            const alertsList = document.getElementById('alertsList');
            if (alertsList && alertsList.children.length === 0) {
                const emptyState = document.getElementById('alertsEmptyState');
                if (emptyState) {
                    emptyState.style.display = 'block';
                }
            }
        }, 500);
        
        showAdminToast('Old alerts cleared successfully', 'success');
    }, 1000);
}

function exportActivityLog() {
    console.log('Exporting activity log');
    showAdminToast('Preparing activity log export...', 'info');
    
    // Simulate export
    setTimeout(() => {
        showAdminToast('Activity log exported successfully', 'success');
    }, 2000);
}

function filterProducts() {
    const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const platformFilterValue = document.getElementById('platformFilter')?.value || '';
    
    console.log('Filtering products:', { searchTerm, platformFilterValue });
    
    const productCards = document.querySelectorAll('.product-admin-card');
    let visibleCount = 0;
    
    productCards.forEach(card => {
        const productName = card.querySelector('.product-name').textContent.toLowerCase();
        const productPlatform = card.querySelector('.product-platform span').textContent.toLowerCase();
        
        const nameMatch = !searchTerm || productName.includes(searchTerm);
        const platformMatch = !platformFilterValue || productPlatform.includes(platformFilterValue);
        
        if (nameMatch && platformMatch) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show/hide empty state
    const emptyState = document.getElementById('productsEmptyState');
    if (visibleCount === 0 && productCards.length > 0) {
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.querySelector('h3').textContent = 'No products match your filters';
            emptyState.querySelector('p').textContent = 'Try adjusting your search or filter criteria';
        }
    } else if (emptyState) {
        emptyState.style.display = 'none';
    }
}

// ========== ADMIN TOAST NOTIFICATIONS ==========
function showAdminToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `admin-toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getAdminToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('admin-toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'admin-toast-styles';
        styles.textContent = `
            .admin-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: var(--dark);
                border: 1px solid rgba(255, 215, 0, 0.2);
                border-left: 4px solid var(--primary);
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
                max-width: 400px;
                min-width: 300px;
            }
            
            .admin-toast.show {
                transform: translateY(0);
                opacity: 1;
            }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }
            
            .toast-content i {
                font-size: 1.2rem;
            }
            
            .toast-success {
                border-left-color: var(--success);
            }
            
            .toast-success .toast-content i {
                color: var(--success);
            }
            
            .toast-warning {
                border-left-color: #FFD700;
            }
            
            .toast-warning .toast-content i {
                color: #FFD700;
            }
            
            .toast-info {
                border-left-color: #3B82F6;
            }
            
            .toast-info .toast-content i {
                color: #3B82F6;
            }
            
            .toast-error {
                border-left-color: #EF4444;
            }
            
            .toast-error .toast-content i {
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
                .admin-toast {
                    left: 20px;
                    right: 20px;
                    max-width: none;
                    min-width: auto;
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

function getAdminToastIcon(type) {
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