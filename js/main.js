// ===== MAIN JAVASCRIPT FILE =====
// This file contains shared functionality across all pages

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
let loadingOverlay = null;
let alertContainer = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadingOverlay = document.getElementById('loading');
    alertContainer = document.getElementById('alertContainer');
    
    // Hide loading if it exists
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }, 500);
    }
});

// ===== LOADING FUNCTIONS =====
function showLoading() {
    if (!loadingOverlay) {
        loadingOverlay = document.getElementById('loading');
        if (!loadingOverlay) return;
    }
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.opacity = '1';
}

function hideLoading() {
    if (!loadingOverlay) return;
    loadingOverlay.style.opacity = '0';
    setTimeout(() => {
        loadingOverlay.style.display = 'none';
    }, 300);
}

// ===== ALERT FUNCTIONS =====
function showAlert(message, type = 'info') {
    if (!alertContainer) {
        alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            // Create alert container if it doesn't exist
            alertContainer = document.createElement('div');
            alertContainer.id = 'alertContainer';
            alertContainer.style.position = 'fixed';
            alertContainer.style.top = '20px';
            alertContainer.style.right = '20px';
            alertContainer.style.zIndex = '1000';
            alertContainer.style.maxWidth = '400px';
            document.body.appendChild(alertContainer);
        }
    }
    
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.innerHTML = `
        <i class="fas ${getAlertIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }, 5000);
    
    // Click to dismiss
    alert.addEventListener('click', function() {
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    });
}

function getAlertIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// ===== AUTHENTICATION FUNCTIONS =====
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

function getCurrentUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showAlert('Logged out successfully', 'success');
    window.location.href = 'index.html';
}

// ===== CART FUNCTIONS =====
function addToCart(productId, quantity = 1) {
    // Check if product already in cart
    const cart = getCart();
    const existingItemIndex = cart.findIndex(item => item.id === productId);
    
    if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Get product details (in real app, fetch from API)
        const product = {
            id: productId,
            name: `Product ${productId}`,
            price: 99.99,
            quantity: quantity,
            image: 'images/placeholder.jpg'
        };
        cart.push(product);
    }
    
    saveCart(cart);
    updateCartCount();
    showAlert('Product added to cart', 'success');
    
    return cart;
}

function getCart() {
    const cartData = localStorage.getItem('cart');
    return cartData ? JSON.parse(cartData) : [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const cart = getCart();
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update all cart count elements
    document.querySelectorAll('.cart-count').forEach(element => {
        element.textContent = cartCount;
    });
    
    return cartCount;
}

// ===== WISHLIST FUNCTIONS =====
function toggleWishlist(productId) {
    if (!isLoggedIn()) {
        showAlert('Please login to use wishlist', 'warning');
        window.location.href = 'login.html';
        return;
    }
    
    let wishlist = getWishlist();
    const index = wishlist.findIndex(item => item.id === productId);
    
    if (index !== -1) {
        wishlist.splice(index, 1);
        saveWishlist(wishlist);
        showAlert('Removed from wishlist', 'info');
    } else {
        wishlist.push({
            id: productId,
            addedAt: new Date().toISOString()
        });
        saveWishlist(wishlist);
        showAlert('Added to wishlist', 'success');
    }
}

function getWishlist() {
    const wishlistData = localStorage.getItem('wishlist');
    return wishlistData ? JSON.parse(wishlistData) : [];
}

function saveWishlist(wishlist) {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// ===== USER MENU =====
function updateUserMenu() {
    const userMenuContainer = document.getElementById('userMenu');
    if (!userMenuContainer) return;
    
    const user = getCurrentUser();
    
    if (user) {
        userMenuContainer.innerHTML = `
            <div class="dropdown">
                <a href="dashboard.html">
                    <i class="fas fa-user-circle"></i> ${user.firstName}
                </a>
                <div class="dropdown-content">
                    <a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    <a href="orders.html"><i class="fas fa-shopping-bag"></i> Orders</a>
                    <a href="wishlist.html"><i class="fas fa-heart"></i> Wishlist</a>
                    <a href="profile.html"><i class="fas fa-user"></i> Profile</a>
                    <hr>
                    <a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            </div>
        `;
    } else {
        userMenuContainer.innerHTML = `
            <a href="login.html">
                <i class="fas fa-sign-in-alt"></i> Login
            </a>
            <a href="register.html" class="btn btn-outline">
                <i class="fas fa-user-plus"></i> Register
            </a>
        `;
    }
}

// ===== MOBILE MENU =====
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('show');
    }
}

// ===== FORM VALIDATION =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// ===== API HELPERS =====
async function apiRequest(endpoint, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        headers: { ...defaultHeaders, ...options.headers },
        ...options
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// ===== PRODUCT UTILITIES =====
function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ===== LOCAL STORAGE UTILITIES =====
function addToRecentlyViewed(product) {
    let recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    
    // Remove if already exists
    recent = recent.filter(item => item.id !== product.id);
    
    // Add to beginning
    recent.unshift({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url
    });
    
    // Keep only last 10 items
    if (recent.length > 10) {
        recent = recent.slice(0, 10);
    }
    
    localStorage.setItem('recentlyViewed', JSON.stringify(recent));
}

// ===== INITIALIZATION =====
// Initialize common functionality on all pages
function initPage() {
    updateUserMenu();
    updateCartCount();
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                dropdown.style.opacity = '0';
                dropdown.style.visibility = 'hidden';
                dropdown.style.transform = 'translateY(10px)';
            });
        }
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

// ===== ERROR HANDLING =====
window.addEventListener('error', function(event) {
    console.error('JavaScript error:', event.error);
    showAlert('An error occurred. Please try again.', 'error');
});

// ===== PERFORMANCE MONITORING =====
window.addEventListener('load', function() {
    // Log page load performance
    if (window.performance) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`Page loaded in ${pageLoadTime}ms`);
    }
});