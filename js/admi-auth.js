// ===== ADMIN AUTHENTICATION SYSTEM =====
class AdminAuth {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.tokenKey = 'token';
        this.userKey = 'user';
    }

    // Check if user is authenticated and is admin
    checkAuth() {
        try {
            const userData = localStorage.getItem(this.userKey);
            const token = localStorage.getItem(this.tokenKey);
            
            if (!userData || !token) {
                return { isAuthenticated: false, isAdmin: false, error: 'Not logged in' };
            }

            const user = JSON.parse(userData);
            const isAdmin = user.role === 'admin';
            
            return { 
                isAuthenticated: true, 
                isAdmin: isAdmin, 
                user: user,
                token: token 
            };
        } catch (error) {
            console.error('Auth check error:', error);
            return { isAuthenticated: false, isAdmin: false, error: error.message };
        }
    }

    // Verify token with server
    async verifyWithServer() {
        try {
            const token = localStorage.getItem(this.tokenKey);
            if (!token) {
                throw new Error('No token found');
            }

            const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    this.clearAuth();
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error('Server verification failed');
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Verification failed');
            }

            if (data.data.role !== 'admin') {
                throw new Error('User is not an admin');
            }

            // Update localStorage with verified user
            localStorage.setItem(this.userKey, JSON.stringify(data.data));
            
            return { 
                success: true, 
                user: data.data,
                token: token 
            };
        } catch (error) {
            console.error('Server verification error:', error);
            this.clearAuth();
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // Check and redirect if not admin
    redirectIfNotAdmin() {
        const auth = this.checkAuth();
        
        if (!auth.isAuthenticated) {
            showAlert('Please login as admin', 'warning');
            window.location.href = 'admin-login.html';
            return false;
        }

        if (!auth.isAdmin) {
            showAlert('Admin access required', 'error');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }

    // Admin login
    async adminLogin(email, password) {
        try {
            showLoading();
            
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Login failed');
            }

            // Check if user is admin
            if (data.data.user.role !== 'admin') {
                throw new Error('Admin privileges required');
            }

            // Save token and user data
            localStorage.setItem(this.tokenKey, data.data.token);
            localStorage.setItem(this.userKey, JSON.stringify(data.data.user));

            // Verify with server
            const verification = await this.verifyWithServer();
            
            if (!verification.success) {
                throw new Error(verification.error);
            }

            showAlert('Admin login successful!', 'success');
            
            // Redirect to admin dashboard
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
            
            return verification.user;
        } catch (error) {
            console.error('Admin login error:', error);
            
            // Clear invalid auth data
            this.clearAuth();
            
            showAlert(error.message || 'Login failed. Please try again.', 'error');
            return null;
        } finally {
            hideLoading();
        }
    }

    // Logout
    logout() {
        try {
            // Clear local storage
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.userKey);
            localStorage.removeItem('admin_remember_email');
            
            // Clear session storage
            sessionStorage.clear();
            
            showAlert('Logged out successfully', 'success');
            
            // Redirect to admin login
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 1000);
            
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            showAlert('Logout failed', 'error');
            return false;
        }
    }

    // Clear auth data
    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    // Check token expiration
    async checkTokenExpiration() {
        const auth = this.checkAuth();
        
        if (!auth.isAuthenticated) {
            return false;
        }

        try {
            const verification = await this.verifyWithServer();
            return verification.success;
        } catch (error) {
            return false;
        }
    }

    // Make authenticated API request
    async apiRequest(endpoint, method = 'GET', data = null) {
        try {
            const auth = this.checkAuth();
            
            if (!auth.isAuthenticated || !auth.isAdmin) {
                throw new Error('Authentication required');
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`
            };

            const options = {
                method,
                headers
            };

            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, options);
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                    throw new Error('Session expired. Please login again.');
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Admin API request failed:', error);
            throw error;
        }
    }
}

// Initialize admin auth system
const adminAuth = new AdminAuth();

// Global functions for HTML onclick handlers
function adminLogout() {
    adminAuth.logout();
}

function checkAdminAuth() {
    return adminAuth.redirectIfNotAdmin();
}

// Initialize on admin pages
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on an admin page
    const isAdminPage = window.location.pathname.includes('admin') || 
                       window.location.pathname.includes('admin.html') ||
                       window.location.pathname.includes('admin-login.html');

    if (isAdminPage) {
        // For admin pages (except login), verify authentication
        if (!window.location.pathname.includes('admin-login.html')) {
            const auth = adminAuth.checkAuth();
            
            if (!auth.isAuthenticated) {
                showAlert('Please login as admin', 'warning');
                setTimeout(() => {
                    window.location.href = 'admin-login.html';
                }, 1000);
                return;
            }

            if (!auth.isAdmin) {
                showAlert('Admin access required', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                return;
            }

            // Update admin name in navbar
            const adminNameEl = document.getElementById('adminName');
            if (adminNameEl && auth.user) {
                adminNameEl.textContent = auth.user.firstName || auth.user.email;
            }
        }
    }
});
