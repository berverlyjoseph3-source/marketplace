// ===== CHECKOUT SYSTEM =====
class CheckoutSystem {
    constructor() {
        this.checkoutDataKey = 'checkout_data';
        this.orderKey = 'user_orders';
        this.init();
    }

    init() {
        // Initialize checkout on page load
        this.loadCheckoutData();
        this.setupEventListeners();
        this.validateCheckout();
    }

    // ===== CHECKOUT DATA =====
    loadCheckoutData() {
        try {
            const checkoutData = localStorage.getItem(this.checkoutDataKey);
            if (!checkoutData) {
                showAlert('No checkout data found. Please add items to cart first.', 'warning');
                setTimeout(() => window.location.href = 'cart.html', 2000);
                return null;
            }

            const data = JSON.parse(checkoutData);
            this.renderCheckoutSummary(data);
            this.preFillUserInfo(data.user);
            return data;
        } catch (error) {
            console.error('Error loading checkout data:', error);
            showAlert('Failed to load checkout data', 'error');
            return null;
        }
    }

    // ===== CHECKOUT SUMMARY =====
    renderCheckoutSummary(checkoutData) {
        try {
            const { cart, totals } = checkoutData;
            
            // Render cart items
            this.renderCartItems(cart);
            
            // Render order summary
            this.renderOrderSummary(totals);
            
            // Render shipping options
            this.renderShippingOptions();
            
            // Render payment methods
            this.renderPaymentMethods();
        } catch (error) {
            console.error('Error rendering checkout summary:', error);
        }
    }

    renderCartItems(cart) {
        const container = document.getElementById('checkoutItems');
        if (!container) return;

        container.innerHTML = cart.map(item => `
            <div class="checkout-item">
                <div class="item-image">
                    <img src="${item.image}" 
                         alt="${item.name}"
                         onerror="this.src='images/placeholder.jpg'">
                    <span class="item-quantity">${item.quantity}</span>
                </div>
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <div class="item-meta">
                        <span>${item.brand}</span>
                        ${item.model ? `<span>• ${item.model}</span>` : ''}
                    </div>
                </div>
                <div class="item-price">
                    $${(item.price * item.quantity).toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    renderOrderSummary(totals) {
        const container = document.getElementById('orderSummary');
        if (!container) return;

        container.innerHTML = `
            <div class="summary-row">
                <span>Subtotal</span>
                <span>$${totals.subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`}</span>
            </div>
            <div class="summary-row">
                <span>Tax</span>
                <span>$${totals.tax.toFixed(2)}</span>
            </div>
            ${totals.discount > 0 ? `
                <div class="summary-row discount">
                    <span>Discount</span>
                    <span>-$${totals.discount.toFixed(2)}</span>
                </div>
            ` : ''}
            <div class="summary-row total">
                <span>Total</span>
                <span>$${totals.total.toFixed(2)}</span>
            </div>
        `;
    }

    renderShippingOptions() {
        const container = document.getElementById('shippingOptions');
        if (!container) return;

        const options = [
            { id: 'standard', name: 'Standard Shipping', price: 9.99, time: '3-5 business days' },
            { id: 'express', name: 'Express Shipping', price: 19.99, time: '1-2 business days' },
            { id: 'overnight', name: 'Overnight Delivery', price: 29.99, time: 'Next business day' }
        ];

        container.innerHTML = options.map(option => `
            <label class="shipping-option">
                <input type="radio" 
                       name="shipping" 
                       value="${option.id}" 
                       ${option.id === 'standard' ? 'checked' : ''}
                       onchange="checkout.updateShipping('${option.id}', ${option.price})">
                <div class="option-content">
                    <div class="option-header">
                        <h4>${option.name}</h4>
                        <span class="price">$${option.price.toFixed(2)}</span>
                    </div>
                    <p>${option.time}</p>
                </div>
            </label>
        `).join('');
    }

    renderPaymentMethods() {
        const container = document.getElementById('paymentMethods');
        if (!container) return;

        const methods = [
            { id: 'credit_card', name: 'Credit Card', icon: 'fa-credit-card', popular: true },
            { id: 'paypal', name: 'PayPal', icon: 'fa-paypal' },
            { id: 'apple_pay', name: 'Apple Pay', icon: 'fa-apple' },
            { id: 'google_pay', name: 'Google Pay', icon: 'fa-google' }
        ];

        container.innerHTML = methods.map(method => `
            <label class="payment-method">
                <input type="radio" 
                       name="payment" 
                       value="${method.id}"
                       ${method.popular ? 'checked' : ''}
                       onchange="checkout.updatePaymentMethod('${method.id}')">
                <div class="method-content">
                    <i class="fab ${method.icon}"></i>
                    <span>${method.name}</span>
                    ${method.popular ? '<span class="popular-badge">Most Popular</span>' : ''}
                </div>
            </label>
        `).join('');

        // Show credit card form by default
        this.togglePaymentForm('credit_card');
    }

    // ===== USER INFORMATION =====
    preFillUserInfo(user) {
        if (!user) return;

        // Pre-fill contact information
        this.setValue('checkoutEmail', user.email || '');
        this.setValue('checkoutPhone', user.phone || '');
        
        // Pre-fill shipping address if available
        if (user.address) {
            this.setValue('shippingFirstName', user.firstName || '');
            this.setValue('shippingLastName', user.lastName || '');
            this.setValue('shippingStreet', user.address.street || '');
            this.setValue('shippingCity', user.address.city || '');
            this.setValue('shippingState', user.address.state || '');
            this.setValue('shippingZip', user.address.zipCode || '');
        }
    }

    // ===== FORM VALIDATION =====
    validateCheckout() {
        // Validate all required fields
        const requiredFields = [
            'checkoutEmail', 'checkoutPhone',
            'shippingFirstName', 'shippingLastName',
            'shippingStreet', 'shippingCity',
            'shippingState', 'shippingZip'
        ];

        let isValid = true;
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                this.markInvalid(field);
                isValid = false;
            } else {
                this.markValid(field);
            }
        });

        return isValid;
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhone(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone);
    }

    // ===== SHIPPING & PAYMENT =====
    updateShipping(methodId, price) {
        const checkoutData = this.getCheckoutData();
        if (!checkoutData) return;

        checkoutData.shippingMethod = methodId;
        checkoutData.totals.shipping = price;
        checkoutData.totals.total = this.calculateTotal(checkoutData.totals);
        
        this.saveCheckoutData(checkoutData);
        this.renderOrderSummary(checkoutData.totals);
    }

    updatePaymentMethod(methodId) {
        this.togglePaymentForm(methodId);
        
        const checkoutData = this.getCheckoutData();
        if (checkoutData) {
            checkoutData.paymentMethod = methodId;
            this.saveCheckoutData(checkoutData);
        }
    }

    togglePaymentForm(methodId) {
        // Hide all payment forms
        document.querySelectorAll('.payment-form').forEach(form => {
            form.style.display = 'none';
        });

        // Show selected payment form
        const formId = `${methodId}_form`;
        const form = document.getElementById(formId);
        if (form) {
            form.style.display = 'block';
        }

        // If credit card, setup card validation
        if (methodId === 'credit_card') {
            this.setupCardValidation();
        }
    }

    // ===== CREDIT CARD VALIDATION =====
    setupCardValidation() {
        const cardNumber = document.getElementById('cardNumber');
        const expiryDate = document.getElementById('expiryDate');
        const cvv = document.getElementById('cvv');

        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = value;
            });
        }

        if (expiryDate) {
            expiryDate.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
                e.target.value = value;
            });
        }

        if (cvv) {
            cvv.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
            });
        }
    }

    validateCreditCard() {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        const cardName = document.getElementById('cardName').value;

        const errors = [];

        // Validate card number (Luhn algorithm)
        if (!this.validateCardNumber(cardNumber)) {
            errors.push('Invalid card number');
            this.markInvalid(document.getElementById('cardNumber'));
        } else {
            this.markValid(document.getElementById('cardNumber'));
        }

        // Validate expiry date
        if (!this.validateExpiryDate(expiryDate)) {
            errors.push('Invalid expiry date');
            this.markInvalid(document.getElementById('expiryDate'));
        } else {
            this.markValid(document.getElementById('expiryDate'));
        }

        // Validate CVV
        if (!cvv || cvv.length < 3 || cvv.length > 4) {
            errors.push('Invalid CVV');
            this.markInvalid(document.getElementById('cvv'));
        } else {
            this.markValid(document.getElementById('cvv'));
        }

        // Validate card holder name
        if (!cardName.trim()) {
            errors.push('Card holder name is required');
            this.markInvalid(document.getElementById('cardName'));
        } else {
            this.markValid(document.getElementById('cardName'));
        }

        return errors;
    }

    validateCardNumber(number) {
        // Luhn algorithm
        let sum = 0;
        let isEven = false;
        
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number.charAt(i), 10);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }

    validateExpiryDate(date) {
        if (!date || !date.includes('/')) return false;
        
        const [month, year] = date.split('/').map(num => parseInt(num, 10));
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        if (month < 1 || month > 12) return false;
        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;
        
        return true;
    }

    // ===== ORDER PLACEMENT =====
    async placeOrder() {
        try {
            showLoading();

            // Validate all fields
            if (!this.validateCheckout()) {
                showAlert('Please fill in all required fields', 'warning');
                hideLoading();
                return;
            }

            // Validate payment method
            const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
            if (paymentMethod === 'credit_card') {
                const cardErrors = this.validateCreditCard();
                if (cardErrors.length > 0) {
                    showAlert(cardErrors.join('<br>'), 'error');
                    hideLoading();
                    return;
                }
            }

            // Get checkout data
            const checkoutData = this.getCheckoutData();
            if (!checkoutData) {
                showAlert('Checkout data not found', 'error');
                hideLoading();
                return;
            }

            // Collect shipping information
            const shippingInfo = {
                firstName: document.getElementById('shippingFirstName').value.trim(),
                lastName: document.getElementById('shippingLastName').value.trim(),
                street: document.getElementById('shippingStreet').value.trim(),
                city: document.getElementById('shippingCity').value.trim(),
                state: document.getElementById('shippingState').value.trim(),
                zipCode: document.getElementById('shippingZip').value.trim(),
                phone: document.getElementById('checkoutPhone').value.trim(),
                email: document.getElementById('checkoutEmail').value.trim()
            };

            // Check if billing is same as shipping
            const sameAsShipping = document.getElementById('sameAsBilling')?.checked || true;
            let billingInfo = null;
            
            if (!sameAsShipping) {
                billingInfo = {
                    firstName: document.getElementById('billingFirstName').value.trim(),
                    lastName: document.getElementById('billingLastName').value.trim(),
                    street: document.getElementById('billingStreet').value.trim(),
                    city: document.getElementById('billingCity').value.trim(),
                    state: document.getElementById('billingState').value.trim(),
                    zipCode: document.getElementById('billingZip').value.trim()
                };
            }

            // Prepare order data
            const orderData = {
                items: checkoutData.cart,
                shipping: shippingInfo,
                billing: sameAsShipping ? shippingInfo : billingInfo,
                shippingMethod: document.querySelector('input[name="shipping"]:checked').value,
                paymentMethod: paymentMethod,
                totals: checkoutData.totals,
                notes: document.getElementById('orderNotes')?.value.trim() || '',
                coupon: checkoutData.coupon
            };

            // In a real application, you would send this to your backend
            // For now, we'll simulate the order placement
            
            const orderResult = await this.simulateOrderPlacement(orderData);
            
            if (orderResult.success) {
                // Clear cart and checkout data
                localStorage.removeItem('shopping_cart');
                localStorage.removeItem('checkout_data');
                localStorage.removeItem('active_coupon');
                
                // Save order to user's orders
                this.saveUserOrder(orderResult.order);
                
                // Redirect to confirmation page
                window.location.href = `order-confirmation.html?order=${orderResult.order.id}`;
            } else {
                throw new Error(orderResult.error || 'Order placement failed');
            }
        } catch (error) {
            console.error('Order placement error:', error);
            showAlert(error.message || 'Failed to place order. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    }

    async simulateOrderPlacement(orderData) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate order ID
        const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        return {
            success: true,
            order: {
                id: orderId,
                number: orderId,
                date: new Date().toISOString(),
                status: 'processing',
                paymentStatus: 'pending',
                ...orderData,
                estimatedDelivery: this.calculateEstimatedDelivery(orderData.shippingMethod)
            }
        };
    }

    calculateEstimatedDelivery(shippingMethod) {
        const today = new Date();
        let daysToAdd = 3; // Default standard shipping
        
        switch(shippingMethod) {
            case 'express':
                daysToAdd = 2;
                break;
            case 'overnight':
                daysToAdd = 1;
                break;
            case 'standard':
            default:
                daysToAdd = 3;
        }
        
        // Skip weekends
        let count = 0;
        while (count < daysToAdd) {
            today.setDate(today.getDate() + 1);
            if (today.getDay() !== 0 && today.getDay() !== 6) {
                count++;
            }
        }
        
        return today.toISOString();
    }

    // ===== ORDER MANAGEMENT =====
    saveUserOrder(order) {
        try {
            const orders = this.getUserOrders();
            orders.unshift(order);
            
            // Keep only last 50 orders
            if (orders.length > 50) {
                orders.pop();
            }
            
            localStorage.setItem(this.orderKey, JSON.stringify(orders));
            return true;
        } catch (error) {
            console.error('Error saving order:', error);
            return false;
        }
    }

    getUserOrders() {
        try {
            const ordersData = localStorage.getItem(this.orderKey);
            return ordersData ? JSON.parse(ordersData) : [];
        } catch (error) {
            console.error('Error getting orders:', error);
            return [];
        }
    }

    // ===== DATA MANAGEMENT =====
    getCheckoutData() {
        try {
            const data = localStorage.getItem(this.checkoutDataKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting checkout data:', error);
            return null;
        }
    }

    saveCheckoutData(data) {
        try {
            localStorage.setItem(this.checkoutDataKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving checkout data:', error);
        }
    }

    calculateTotal(totals) {
        return totals.subtotal + totals.shipping + totals.tax - totals.discount;
    }

    // ===== UI HELPERS =====
    setValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    }

    markInvalid(element) {
        if (element) {
            element.classList.add('invalid');
            element.classList.remove('valid');
        }
    }

    markValid(element) {
        if (element) {
            element.classList.add('valid');
            element.classList.remove('invalid');
        }
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Same as billing checkbox
        const sameAsBilling = document.getElementById('sameAsBilling');
        if (sameAsBilling) {
            sameAsBilling.addEventListener('change', (e) => {
                this.toggleBillingForm(!e.target.checked);
            });
        }

        // Place order button
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => this.placeOrder());
        }

        // Edit cart button
        const editCartBtn = document.getElementById('editCartBtn');
        if (editCartBtn) {
            editCartBtn.addEventListener('click', () => {
                window.location.href = 'cart.html';
            });
        }

        // Apply coupon button
        const applyCouponBtn = document.getElementById('applyCouponBtn');
        if (applyCouponBtn) {
            applyCouponBtn.addEventListener('click', () => {
                const couponInput = document.getElementById('couponCode');
                if (couponInput && couponInput.value.trim()) {
                    this.applyCoupon(couponInput.value.trim());
                }
            });
        }
    }

    toggleBillingForm(show) {
        const billingForm = document.getElementById('billingForm');
        if (billingForm) {
            billingForm.style.display = show ? 'block' : 'none';
        }
    }

    // ===== COUPON SYSTEM =====
    applyCoupon(code) {
        // This would integrate with your backend coupon system
        showAlert('Coupon functionality coming soon', 'info');
    }
}

// Initialize checkout system
const checkout = new CheckoutSystem();

// Global functions for HTML onclick handlers
function updateShipping(methodId, price) {
    checkout.updateShipping(methodId, price);
}

function updatePaymentMethod(methodId) {
    checkout.updatePaymentMethod(methodId);
}

function placeOrder() {
    checkout.placeOrder();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // If on checkout page, load checkout data
    if (window.location.pathname.includes('checkout.html')) {
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (!user || !token) {
            showAlert('Please login to checkout', 'warning');
            window.location.href = 'login.html?redirect=checkout.html';
            return;
        }
        
        // Check if cart has items
        const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
        if (cart.length === 0) {
            showAlert('Your cart is empty', 'warning');
            window.location.href = 'cart.html';
            return;
        }
    }
});