// Authentication system
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
    }

    // Initialize authentication
    init() {
        this.checkExistingSession();
        this.setupEventListeners();
    }

    // Check if user is already logged in
    checkExistingSession() {
        const isLoggedIn = localStorage.getItem('userLoggedIn');
        const userData = localStorage.getItem('currentUser');
        
        if (isLoggedIn && userData) {
            this.currentUser = JSON.parse(userData);
            this.isLoggedIn = true;
            this.updateUI();
        }
    }

    // Register new user
    async register(userData) {
        try {
            // Backend register
            await AuthAPI.register({
                email: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName
            });
            return { success: true, message: 'Registration successful' };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: error.message };
        }
    }

    // Login user
    async login(email, password) {
        try {
            console.log('Attempting login with:', { email });
            const resp = await AuthAPI.login({ email, password });
            console.log('Login response:', resp);
            if (resp && resp.user) {
                this.currentUser = resp.user;
                this.isLoggedIn = true;
                
                // Save session
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify(resp.user));
                
                this.updateUI();
                return { success: true, message: 'Login successful', user: resp.user };
            } else {
                return { success: false, message: 'Invalid email or password' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'Login failed. Please try again.' };
        }
    }

    // Logout user
    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('currentUser');
        
        this.updateUI();
        this.clearCart();
        
        // Redirect to home page
        if (window.location.pathname.includes('profile') || window.location.pathname.includes('orders')) {
            window.location.href = 'index.html';
        }
    }

    // Update UI based on login status
    updateUI() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const profileBtn = document.getElementById('profile-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userGreeting = document.getElementById('user-greeting');

        if (this.isLoggedIn) {
            // Show logged in state
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (profileBtn) profileBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userGreeting) {
                userGreeting.textContent = `Hello, ${this.currentUser.firstName}!`;
                userGreeting.style.display = 'block';
            }
        } else {
            // Show logged out state
            if (loginBtn) loginBtn.style.display = 'block';
            if (registerBtn) registerBtn.style.display = 'block';
            if (profileBtn) profileBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userGreeting) userGreeting.style.display = 'none';
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e);
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister(e);
            });
        }

        // Email validation for registration
        const emailInput = document.getElementById('register-email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                this.validateEmail(emailInput.value);
            });
            emailInput.addEventListener('input', () => {
                // Clear validation message when user starts typing
                this.clearEmailValidation();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    // Handle login form submission
    async handleLogin(e) {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        const result = await this.login(email, password);
        
        if (result.success) {
            this.showNotification('Login successful!', 'success');
            // Redirect based on user role from database
            const userRole = result.user.role;
            setTimeout(() => { 
                window.location.href = userRole === 'admin' ? 'admin.html' : 'index.html'; 
            }, 800);
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    // Handle register form submission
    async handleRegister(e) {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        
        // Check if email already exists before proceeding
        try {
            const emailCheck = await AuthAPI.emailExists(email);
            if (emailCheck.exists) {
                this.showEmailValidation('Email address already exists');
                return;
            }
        } catch (error) {
            console.error('Email validation error:', error);
            // Continue with registration if validation fails
        }

        const userData = {
            email: email,
            password: formData.get('password'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName')
        };

        const result = await this.register(userData);
        
        if (result.success) {
            this.showNotification('Registration successful! Please login.', 'success');
            // Switch to login tab after successful signup
            if (typeof switchTab === 'function') { switchTab('login'); }
            // Optionally auto-redirect to login anchor on the same page
            // location.hash = '#login';
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    // Show authentication modal
    showAuthModal(type = 'login') {
        const modal = document.getElementById('auth-modal');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');

        if (modal) {
            modal.style.display = 'block';
            
            if (type === 'login') {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
                loginTab.classList.add('active');
                registerTab.classList.remove('active');
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
                registerTab.classList.add('active');
                loginTab.classList.remove('active');
            }
        }
    }

    // Close authentication modal
    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Clear user's cart when logging out
    async clearCart() {
        if (this.currentUser) {
            try {
                await db.clearCart(this.currentUser.id);
            } catch (error) {
                console.error('Error clearing cart:', error);
            }
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is logged in
    isUserLoggedIn() {
        return this.isLoggedIn;
    }

    // Check if user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    // Validate email address
    async validateEmail(email) {
        if (!email || !this.isValidEmailFormat(email)) {
            this.clearEmailValidation();
            return;
        }

        try {
            const response = await AuthAPI.emailExists(email);
            if (response.exists) {
                this.showEmailValidation('Email address already exists');
            } else {
                this.clearEmailValidation();
            }
        } catch (error) {
            console.error('Email validation error:', error);
            // Don't show error for validation failures, just clear the message
            this.clearEmailValidation();
        }
    }

    // Check if email format is valid
    isValidEmailFormat(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show email validation message
    showEmailValidation(message) {
        const validationMessage = document.getElementById('email-validation-message');
        const emailInput = document.getElementById('register-email');
        
        if (validationMessage) {
            validationMessage.textContent = message;
            validationMessage.style.display = 'block';
        }
        
        if (emailInput) {
            emailInput.style.borderColor = '#e74c3c';
        }
    }

    // Clear email validation message
    clearEmailValidation() {
        const validationMessage = document.getElementById('email-validation-message');
        const emailInput = document.getElementById('register-email');
        
        if (validationMessage) {
            validationMessage.style.display = 'none';
            validationMessage.textContent = '';
        }
        
        if (emailInput) {
            emailInput.style.borderColor = '';
        }
    }

    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Global auth manager instance
const auth = new AuthManager();

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    auth.init();
});

// Helper functions for cart with user authentication
async function addToCartWithAuth(productId, size, color) {
    if (auth.isUserLoggedIn()) {
        try {
            await db.addToCart(auth.getCurrentUser().id, productId, size, color);
            showNotification('Added to cart!', 'success');
            updateCartCounter();
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Error adding to cart', 'error');
        }
    } else {
        // Fallback to localStorage for guest users
        addToCart(productId, size, color);
    }
}

async function getCartWithAuth() {
    if (auth.isUserLoggedIn()) {
        try {
            return await db.getCartItems(auth.getCurrentUser().id);
        } catch (error) {
            console.error('Error getting cart:', error);
            return [];
        }
    } else {
        // Fallback to localStorage for guest users
        return JSON.parse(localStorage.getItem('cart')) || [];
    }
}

async function updateCartCounterWithAuth() {
    const cartItems = await getCartWithAuth();
    const counter = document.querySelector('.cart-counter');
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    if (counter) {
        counter.textContent = totalItems;
        counter.style.display = totalItems > 0 ? 'block' : 'none';
    }
}
