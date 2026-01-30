/**
 * Authentication guard for protected pages
 * Include this script in dashboard.html and admin-dashboard.html
 */

// Configuration
const API_BASE_URL = window.location.hostname.includes('localhost') || 
                    window.location.hostname.includes('127.0.0.1') ||
                    window.location.hostname.endsWith('.local')
  ? 'http://localhost:8000'
  : 'https://zyneth-backend.onrender.com';

const ME_ENDPOINT = `${API_BASE_URL}/users/me`;

// Auth helper functions
function clearAuthStorage() {
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('token');
  localStorage.removeItem('token_expires_at');
}

function redirectToSignIn() {
  // Clear any invalid auth data
  clearAuthStorage();
  
  // Redirect to signin page
  window.location.href = 'signin.html';
}

async function validateSession() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }
    
    // Check expiration
    const expiresAt = localStorage.getItem('token_expires_at');
    if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
      throw new Error('Token expired');
    }
    
    // Validate with backend
    const response = await fetch(ME_ENDPOINT, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Invalid token');
    }
    
    const userData = await response.json();
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(userData));
    
    return userData;
    
  } catch (error) {
    console.error('Session validation failed:', error);
    throw error;
  }
}

// Check if current page requires admin role
function requiresAdminRole() {
  return window.location.pathname.includes('admin-');
}

// Main auth guard function
async function protectPage() {
  try {
    const userData = await validateSession();
    
    // Check if admin access is required but user is not admin
    if (requiresAdminRole() && userData.role !== 'admin') {
      console.warn('Non-admin user trying to access admin page');
      window.location.href = 'dashboard.html';
      return false;
    }
    
    // Update UI with user data if needed
    updateUIWithUserData(userData);
    
    return true;
    
  } catch (error) {
    console.error('Authentication failed:', error);
    redirectToSignIn();
    return false;
  }
}

function updateUIWithUserData(userData) {
  // Update welcome message if element exists
  const welcomeElement = document.querySelector('.dashboard-title .highlight, .admin-title');
  if (welcomeElement && userData.full_name) {
    // Extract first name
    const firstName = userData.full_name.split(' ')[0];
    welcomeElement.textContent = firstName;
  }
  
  // Update profile link if exists
  const profileLink = document.querySelector('.btn-login, [href="profile.html"]');
  if (profileLink && userData.full_name) {
    const icon = profileLink.querySelector('i') ? profileLink.querySelector('i').outerHTML : '<i class="fas fa-user"></i>';
    profileLink.innerHTML = `${icon} ${userData.full_name.split(' ')[0]}`;
  }
}

// Initialize auth guard when page loads
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Auth guard initialized');
  
  // Protect the page
  const isAuthenticated = await protectPage();
  
  if (isAuthenticated) {
    console.log('User authenticated, page access granted');
    
    // Setup logout button if exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
          // Call logout endpoint
          await fetch(`${API_BASE_URL}/auth/google/logout`, {
            method: 'POST',
            credentials: 'include'  // Important for cookie clearing
          });
        } catch (error) {
          console.error('Logout API error:', error);
        } finally {
          // Clear local storage and redirect
          clearAuthStorage();
          window.location.href = 'signin.html';
        }
      });
    }
    
    // Setup logout modal if exists
    const confirmLogoutBtn = document.getElementById('confirmLogout');
    if (confirmLogoutBtn) {
      confirmLogoutBtn.addEventListener('click', async () => {
        try {
          await fetch(`${API_BASE_URL}/auth/google/logout`, {
            method: 'POST',
            credentials: 'include'
          });
        } finally {
          clearAuthStorage();
          window.location.href = 'signin.html';
        }
      });
    }
  }
});

// Export for use in other scripts if needed
window.authGuard = {
  protectPage,
  validateSession,
  clearAuthStorage,
  redirectToSignIn
};