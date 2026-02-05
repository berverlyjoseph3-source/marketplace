// ===== AUTHENTICATION SYSTEM =====
class AuthSystem {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.tokenKey = 'token';
        this.userKey = 'user';
        this.init();
    }

    init() {
        // Check for redirect parameters
        this.checkRedirect();
        
        // Setup form validation
        this.setupFormValidation();
        
        // Check login status
        this.checkAuthStatus();
    }

    // ===== API COMMUNICATION =====
    async apiRequest(endpoint, method = 'GET', data = null) {
        try {
            const headers = {
                'Content-Type': 'application/json',
            };

            // Add token if available
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const options = {
                method,
                headers,
                credentials: 'include'
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, options);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // ===== USER REGISTRATION =====
    async register(userData) {
        try {
            showLoading();
            
            const response = await this.apiRequest('/auth/register', 'POST', {
                email: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone
            });

            if (response.success) {
                // Save token and user data
                this.setToken(response.data.token);
                this.setUser(response.data.user);
                
                showAlert('Registration successful! Welcome to ElectroShop!', 'success');
                
                // Redirect to dashboard or previous page
                setTimeout(() => {
                    const redirectUrl = this.getRedirectUrl() || 'dashboard.html';
                    window.location.href = redirectUrl;
                }, 1500);
                
                return response.data.user;
            } else {
                throw new Error(response.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAlert(error.message || 'Registration failed. Please try again.', 'error');
            return null;
        } finally {
            hideLoading();
        }
    }

    // ===== USER LOGIN =====
    async login(credentials) {
        try {
            showLoading();
            
            const response = await this.apiRequest('/auth/login', 'POST', {
                email: credentials.email,
                password: credentials.password
            });

            if (response.success) {
                // Save token and user data
                this.setToken(response.data.token);
                this.setUser(response.data.user);
                
                showAlert('Login successful! Welcome back!', 'success');
                
                // Check if user is admin
                if (response.data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                    return response.data.user;
                }
                
                // Redirect to dashboard or previous page
                setTimeout(() => {
                    const redirectUrl = this.getRedirectUrl() || 'dashboard.html';
                    window.location.href = redirectUrl;
                }, 1500);
                
                return response.data.user;
            } else {
                throw new Error(response.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert(error.message || 'Invalid email or password', 'error');
            return null;
        } finally {
            hideLoading();
        }
    }

    // ===== USER LOGOUT =====
    logout() {
        try {
            // Clear local storage
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.userKey);
            localStorage.removeItem('redirect_url');
            
            // Clear session storage
            sessionStorage.clear();
            
            showAlert('Logged out successfully', 'success');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            showAlert('Logout failed', 'error');
            return false;
        }
    }

    // ===== GET CURRENT USER =====
    async getCurrentUser() {
        try {
            const token = this.getToken();
            if (!token) return null;

            const response = await this.apiRequest('/auth/me', 'GET');
            
            if (response.success) {
                this.setUser(response.data);
                return response.data;
            } else {
                // Token expired or invalid
                this.clearAuth();
                return null;
            }
        } catch (error) {
            console.error('Get current user error:', error);
            this.clearAuth();
            return null;
        }
    }

    // ===== UPDATE USER PROFILE =====
    async updateProfile(profileData) {
        try {
            showLoading();
            
            const response = await this.apiRequest('/auth/profile', 'PUT', profileData);
            
            if (response.success) {
                // Update local user data
                this.setUser(response.data);
                
                showAlert('Profile updated successfully', 'success');
                return response.data;
            } else {
                throw new Error(response.error || 'Profile update failed');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            showAlert(error.message || 'Failed to update profile', 'error');
            return null;
        } finally {
            hideLoading();
        }
    }

    // ===== CHANGE PASSWORD =====
    async changePassword(passwordData) {
        try {
            showLoading();
            
            const response = await this.apiRequest('/auth/change-password', 'PUT', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            if (response.success) {
                showAlert('Password changed successfully', 'success');
                return true;
            } else {
                throw new Error(response.error || 'Password change failed');
            }
        } catch (error) {
            console.error('Change password error:', error);
            showAlert(error.message || 'Failed to change password', 'error');
            return false;
        } finally {
            hideLoading();
        }
    }

    // ===== TOKEN MANAGEMENT =====
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    getUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    // ===== AUTH STATUS =====
    isLoggedIn() {
        return !!this.getToken();
    }

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    }

    checkAuthStatus() {
        if (this.isLoggedIn()) {
            // Update user menu
            this.updateUserMenu();
            
            // Check token expiration
            this.checkTokenExpiration();
        }
    }

    // ===== TOKEN EXPIRATION =====
    async checkTokenExpiration() {
        const token = this.getToken();
        if (!token) return;

        try {
            // Decode JWT to check expiration
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            
            // If token expires in less than 5 minutes, refresh it
            if (expirationTime - currentTime < 5 * 60 * 1000) {
                await this.refreshToken();
            }
        } catch (error) {
            console.error('Token check error:', error);
        }
    }

    async refreshToken() {
        try {
            const response = await this.apiRequest('/auth/refresh', 'POST');
            if (response.success && response.data.token) {
                this.setToken(response.data.token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
        }
        return false;
    }

    // ===== UI UPDATES =====
    updateUserMenu() {
        const userMenuContainer = document.getElementById('userMenu');
        if (!userMenuContainer) return;

        const user = this.getUser();
        
        if (user) {
            userMenuContainer.innerHTML = `
                <div class="dropdown">
                    <a href="dashboard.html" class="user-avatar">
                        <i class="fas fa-user-circle"></i>
                        <span>${user.firstName}</span>
                        ${user.role === 'admin' ? '<span class="admin-badge">ADMIN</span>' : ''}
                    </a>
                    <div class="dropdown-content">
                        <a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                        <a href="orders.html"><i class="fas fa-shopping-bag"></i> Orders</a>
                        <a href="wishlist.html"><i class="fas fa-heart"></i> Wishlist</a>
                        <a href="profile.html"><i class="fas fa-user"></i> Profile</a>
                        ${user.role === 'admin' ? '<a href="admin.html"><i class="fas fa-cog"></i> Admin Panel</a>' : ''}
                        <hr>
                        <a href="#" onclick="auth.logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
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

    // ===== FORM VALIDATION =====
    setupFormValidation() {
        // Login form validation
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Register form validation
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister();
            });
        }

        // Profile form validation
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleProfileUpdate();
            });
        }

        // Password change form validation
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handlePasswordChange();
            });
        }
    }

    // ===== FORM HANDLERS =====
    async handleLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe')?.checked;

        // Validate inputs
        if (!email || !password) {
            showAlert('Please fill in all fields', 'warning');
            return;
        }

        if (!this.validateEmail(email)) {
            showAlert('Please enter a valid email address', 'warning');
            return;
        }

        const credentials = { email, password };
        await this.login(credentials);
    }

    async handleRegister() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validate inputs
        const errors = [];

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            errors.push('Please fill in all required fields');
        }

        if (!this.validateEmail(email)) {
            errors.push('Please enter a valid email address');
        }

        if (password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        if (password !== confirmPassword) {
            errors.push('Passwords do not match');
        }

        if (!agreeTerms) {
            errors.push('You must agree to the terms and conditions');
        }

        if (errors.length > 0) {
            showAlert(errors.join('<br>'), 'error');
            return;
        }

        const userData = {
            firstName,
            lastName,
            email,
            phone: phone || undefined,
            password
        };

        await this.register(userData);
    }

    async handleProfileUpdate() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const addressStreet = document.getElementById('addressStreet').value.trim();
        const addressCity = document.getElementById('addressCity').value.trim();
        const addressState = document.getElementById('addressState').value.trim();
        const addressZip = document.getElementById('addressZip').value.trim();

        if (!firstName || !lastName) {
            showAlert('First name and last name are required', 'warning');
            return;
        }

        const profileData = {
            firstName,
            lastName,
            phone: phone || undefined,
            address: {
                street: addressStreet || undefined,
                city: addressCity || undefined,
                state: addressState || undefined,
                zipCode: addressZip || undefined
            }
        };

        await this.updateProfile(profileData);
    }

    async handlePasswordChange() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert('Please fill in all fields', 'warning');
            return;
        }

        if (newPassword.length < 6) {
            showAlert('New password must be at least 6 characters long', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('New passwords do not match', 'warning');
            return;
        }

        await this.changePassword({
            currentPassword,
            newPassword
        });
    }

    // ===== REDIRECT HANDLING =====
    checkRedirect() {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        
        if (redirect) {
            localStorage.setItem('redirect_url', redirect);
        }
    }

    getRedirectUrl() {
        return localStorage.getItem('redirect_url');
    }

    // ===== VALIDATION HELPERS =====
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhone(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone);
    }

    // ===== PASSWORD STRENGTH =====
    checkPasswordStrength(password) {
        let strength = 0;
        const checks = [
            password.length >= 8,
            /[a-z]/.test(password),
            /[A-Z]/.test(password),
            /[0-9]/.test(password),
            /[^A-Za-z0-9]/.test(password)
        ];

        checks.forEach(check => {
            if (check) strength++;
        });

        return {
            strength: strength,
            level: strength >= 4 ? 'strong' : strength >= 3 ? 'good' : strength >= 2 ? 'fair' : 'weak'
        };
    }

    // ===== FORGOT PASSWORD =====
    async forgotPassword(email) {
        try {
            showLoading();
            
            // This would call your backend API
            // For demo purposes, we'll simulate an API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            showAlert(`Password reset instructions sent to ${email}`, 'success');
            return true;
        } catch (error) {
            console.error('Forgot password error:', error);
            showAlert('Failed to send reset instructions', 'error');
            return false;
        } finally {
            hideLoading();
        }
    }

    // ===== SOCIAL LOGIN =====
    async socialLogin(provider) {
        try {
            // This would integrate with social login providers
            // For demo purposes, we'll simulate a social login
            showAlert(`${provider} login coming soon`, 'info');
            return null;
        } catch (error) {
            console.error('Social login error:', error);
            showAlert('Social login failed', 'error');
            return null;
        }
    }
}

// Initialize auth system
const auth = new AuthSystem();

// Global functions for HTML onclick handlers
function handleLogout() {
    auth.logout();
}

function checkAuth() {
    if (!auth.isLoggedIn()) {
        showAlert('Please login to continue', 'warning');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Update user menu on all pages
    auth.updateUserMenu();
    
    // Check protected pages
    const protectedPages = ['dashboard.html', 'orders.html', 'wishlist.html', 'profile.html', 'checkout.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !auth.isLoggedIn()) {
        showAlert('Please login to access this page', 'warning');
        window.location.href = 'login.html?redirect=' + currentPage;
    }
    
    // Check admin pages
    if (currentPage === 'admin.html' && (!auth.isLoggedIn() || !auth.isAdmin())) {
        showAlert('Admin access required', 'error');
        window.location.href = 'index.html';
    }
});