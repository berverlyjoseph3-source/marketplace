// ===== CART FUNCTIONALITY =====
class ShoppingCart {
    constructor() {
        this.cartKey = 'shopping_cart';
        this.wishlistKey = 'wishlist';
        this.recentlyViewedKey = 'recently_viewed';
        this.couponKey = 'active_coupon';
        this.init();
    }

    init() {
        // Initialize cart on page load
        this.updateCartCount();
        this.setupEventListeners();
    }

    // ===== CART OPERATIONS =====
    addItem(product, quantity = 1) {
        try {
            const cart = this.getCart();
            const existingItemIndex = cart.findIndex(item => item.id === product.id);

            if (existingItemIndex > -1) {
                // Update existing item quantity
                cart[existingItemIndex].quantity += quantity;
                
                // Check stock limit
                if (cart[existingItemIndex].quantity > cart[existingItemIndex].stock) {
                    showAlert(`Maximum ${cart[existingItemIndex].stock} units available`, 'warning');
                    cart[existingItemIndex].quantity = cart[existingItemIndex].stock;
                }
            } else {
                // Add new item to cart
                const cartItem = {
                    id: product._id || product.id,
                    name: product.name,
                    price: product.discountPrice || product.price,
                    originalPrice: product.price,
                    quantity: Math.min(quantity, product.stock || 10),
                    image: product.images?.[0]?.url || 'images/placeholder.jpg',
                    brand: product.brand,
                    model: product.model,
                    category: product.category,
                    stock: product.stock || 10,
                    maxStock: product.stock || 10,
                    addedAt: new Date().toISOString()
                };
                cart.push(cartItem);
            }

            this.saveCart(cart);
            this.updateCartCount();
            
            // Update cart UI if on cart page
            if (window.location.pathname.includes('cart.html')) {
                this.renderCartItems();
                this.updateOrderSummary();
            }

            showAlert(`${product.name} added to cart`, 'success');
            return true;
        } catch (error) {
            console.error('Error adding item to cart:', error);
            showAlert('Failed to add item to cart', 'error');
            return false;
        }
    }

    removeItem(itemId) {
        try {
            const cart = this.getCart();
            const itemIndex = cart.findIndex(item => item.id === itemId);
            
            if (itemIndex > -1) {
                const removedItem = cart.splice(itemIndex, 1)[0];
                this.saveCart(cart);
                this.updateCartCount();
                
                if (window.location.pathname.includes('cart.html')) {
                    this.renderCartItems();
                    this.updateOrderSummary();
                }
                
                showAlert(`${removedItem.name} removed from cart`, 'info');
                return removedItem;
            }
            return null;
        } catch (error) {
            console.error('Error removing item from cart:', error);
            return null;
        }
    }

    updateQuantity(itemId, newQuantity) {
        try {
            const cart = this.getCart();
            const itemIndex = cart.findIndex(item => item.id === itemId);
            
            if (itemIndex > -1) {
                if (newQuantity < 1) {
                    this.removeItem(itemId);
                    return null;
                }
                
                if (newQuantity > cart[itemIndex].maxStock) {
                    showAlert(`Maximum ${cart[itemIndex].maxStock} units available`, 'warning');
                    newQuantity = cart[itemIndex].maxStock;
                }
                
                cart[itemIndex].quantity = newQuantity;
                cart[itemIndex].updatedAt = new Date().toISOString();
                this.saveCart(cart);
                
                if (window.location.pathname.includes('cart.html')) {
                    this.updateOrderSummary();
                }
                
                return cart[itemIndex];
            }
            return null;
        } catch (error) {
            console.error('Error updating quantity:', error);
            return null;
        }
    }

    clearCart() {
        try {
            localStorage.removeItem(this.cartKey);
            this.updateCartCount();
            
            if (window.location.pathname.includes('cart.html')) {
                this.renderCartItems();
                this.updateOrderSummary();
            }
            
            showAlert('Cart cleared successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error clearing cart:', error);
            return false;
        }
    }

    // ===== CART DATA =====
    getCart() {
        try {
            const cartData = localStorage.getItem(this.cartKey);
            return cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error('Error getting cart:', error);
            return [];
        }
    }

    saveCart(cart) {
        try {
            localStorage.setItem(this.cartKey, JSON.stringify(cart));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    getItemCount() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    getSubtotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // ===== CART UI =====
    updateCartCount() {
        const count = this.getItemCount();
        document.querySelectorAll('.cart-count').forEach(element => {
            element.textContent = count;
        });
        return count;
    }

    renderCartItems() {
        try {
            const cart = this.getCart();
            const container = document.getElementById('cartItemsList');
            const emptyCart = document.getElementById('emptyCart');
            const itemCount = document.getElementById('itemCount');

            if (!container || !emptyCart || !itemCount) return;

            if (cart.length === 0) {
                container.style.display = 'none';
                emptyCart.style.display = 'block';
                itemCount.textContent = '0';
                
                // Disable checkout button
                const checkoutBtn = document.querySelector('.btn-checkout');
                if (checkoutBtn) checkoutBtn.disabled = true;
                return;
            }

            emptyCart.style.display = 'none';
            container.style.display = 'block';
            itemCount.textContent = cart.length;

            // Render cart items
            container.innerHTML = cart.map((item, index) => `
                <div class="cart-item" id="cartItem-${index}" data-id="${item.id}">
                    <div class="cart-item-image" onclick="window.location.href='product-detail.html?id=${item.id}'">
                        <img src="${item.image}" 
                             alt="${item.name}"
                             onerror="this.src='images/placeholder.jpg'">
                    </div>
                    <div class="cart-item-details">
                        <h3 onclick="window.location.href='product-detail.html?id=${item.id}'">
                            ${item.name}
                        </h3>
                        <div class="cart-item-meta">
                            <span class="brand">${item.brand || 'ElectroShop'}</span>
                            <span class="model">${item.model || ''}</span>
                        </div>
                        <div class="cart-item-price">
                            <span class="current-price">$${(item.price * item.quantity).toFixed(2)}</span>
                            ${item.originalPrice && item.originalPrice > item.price ? 
                                `<span class="original-price">$${(item.originalPrice * item.quantity).toFixed(2)}</span>` : ''}
                        </div>
                        <div class="cart-item-actions">
                            <button class="btn-remove" onclick="cart.removeItem('${item.id}')">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                            <button class="btn-wishlist" onclick="cart.moveToWishlist('${item.id}')">
                                <i class="far fa-heart"></i> Save for Later
                            </button>
                        </div>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn" onclick="cart.decreaseQuantity('${item.id}')">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" 
                               value="${item.quantity}" 
                               min="1" 
                               max="${item.maxStock}"
                               onchange="cart.updateQuantityInput('${item.id}', this.value)">
                        <button class="qty-btn" onclick="cart.increaseQuantity('${item.id}')">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            // Enable checkout button
            const checkoutBtn = document.querySelector('.btn-checkout');
            if (checkoutBtn) checkoutBtn.disabled = false;
        } catch (error) {
            console.error('Error rendering cart items:', error);
        }
    }

    // ===== QUANTITY CONTROLS =====
    increaseQuantity(itemId) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === itemId);
        if (item) {
            this.updateQuantity(itemId, item.quantity + 1);
        }
    }

    decreaseQuantity(itemId) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === itemId);
        if (item) {
            this.updateQuantity(itemId, item.quantity - 1);
        }
    }

    updateQuantityInput(itemId, value) {
        const quantity = parseInt(value);
        if (!isNaN(quantity) && quantity >= 1) {
            this.updateQuantity(itemId, quantity);
        }
    }

    // ===== ORDER SUMMARY =====
    updateOrderSummary() {
        try {
            const subtotal = this.getSubtotal();
            const shipping = this.calculateShipping(subtotal);
            const tax = this.calculateTax(subtotal);
            const discount = this.getCouponDiscount(subtotal);
            const total = subtotal + shipping + tax - discount;

            // Update UI elements
            this.updateElement('subtotal', `$${subtotal.toFixed(2)}`);
            this.updateElement('shipping', shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`);
            this.updateElement('tax', `$${tax.toFixed(2)}`);
            this.updateElement('discount', `-$${discount.toFixed(2)}`);
            this.updateElement('total', `$${total.toFixed(2)}`);

            // Style shipping if free
            const shippingEl = document.getElementById('shipping');
            if (shippingEl) {
                shippingEl.className = shipping === 0 ? 'free-shipping' : '';
            }
        } catch (error) {
            console.error('Error updating order summary:', error);
        }
    }

    calculateShipping(subtotal) {
        // Free shipping on orders over $99
        return subtotal >= 99 ? 0 : 9.99;
    }

    calculateTax(subtotal) {
        // 10% tax rate
        return subtotal * 0.1;
    }

    // ===== COUPON SYSTEM =====
    applyCoupon(couponCode) {
        try {
            if (!couponCode) {
                showAlert('Please enter a coupon code', 'warning');
                return false;
            }

            // Valid coupons database
            const validCoupons = {
                'WELCOME10': { type: 'percentage', value: 10, minOrder: 0, expires: '2024-12-31' },
                'SAVE20': { type: 'fixed', value: 20, minOrder: 100, expires: '2024-12-31' },
                'FREESHIP': { type: 'shipping', value: 9.99, minOrder: 50, expires: '2024-12-31' },
                'ELECTRO25': { type: 'percentage', value: 25, minOrder: 200, expires: '2024-12-31' }
            };

            const coupon = validCoupons[couponCode.toUpperCase()];
            if (!coupon) {
                showAlert('Invalid coupon code', 'error');
                return false;
            }

            // Check expiration
            if (new Date() > new Date(coupon.expires)) {
                showAlert('This coupon has expired', 'warning');
                return false;
            }

            const subtotal = this.getSubtotal();
            if (subtotal < coupon.minOrder) {
                showAlert(`Minimum order of $${coupon.minOrder} required`, 'warning');
                return false;
            }

            // Save coupon
            localStorage.setItem(this.couponKey, JSON.stringify({
                code: couponCode.toUpperCase(),
                ...coupon,
                appliedAt: new Date().toISOString()
            }));

            // Update order summary
            this.updateOrderSummary();
            
            showAlert(`Coupon "${couponCode.toUpperCase()}" applied successfully!`, 'success');
            return true;
        } catch (error) {
            console.error('Error applying coupon:', error);
            showAlert('Failed to apply coupon', 'error');
            return false;
        }
    }

    getCouponDiscount(subtotal) {
        try {
            const couponData = localStorage.getItem(this.couponKey);
            if (!couponData) return 0;

            const coupon = JSON.parse(couponData);
            
            // Check expiration
            if (new Date() > new Date(coupon.expires)) {
                localStorage.removeItem(this.couponKey);
                return 0;
            }

            switch (coupon.type) {
                case 'percentage':
                    return subtotal * (coupon.value / 100);
                case 'fixed':
                    return Math.min(coupon.value, subtotal);
                case 'shipping':
                    return this.calculateShipping(subtotal);
                default:
                    return 0;
            }
        } catch (error) {
            console.error('Error getting coupon discount:', error);
            return 0;
        }
    }

    removeCoupon() {
        localStorage.removeItem(this.couponKey);
        this.updateOrderSummary();
        showAlert('Coupon removed', 'info');
    }

    // ===== WISHLIST =====
    moveToWishlist(itemId) {
        try {
            const cart = this.getCart();
            const itemIndex = cart.findIndex(item => item.id === itemId);
            
            if (itemIndex === -1) return false;

            const item = cart[itemIndex];
            
            // Add to wishlist
            let wishlist = this.getWishlist();
            const existsInWishlist = wishlist.some(w => w.id === item.id);
            
            if (!existsInWishlist) {
                wishlist.push({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    addedAt: new Date().toISOString()
                });
                this.saveWishlist(wishlist);
            }

            // Remove from cart
            cart.splice(itemIndex, 1);
            this.saveCart(cart);
            
            // Update UI
            this.updateCartCount();
            this.renderCartItems();
            this.updateOrderSummary();
            
            showAlert('Item moved to wishlist', 'success');
            return true;
        } catch (error) {
            console.error('Error moving to wishlist:', error);
            return false;
        }
    }

    getWishlist() {
        try {
            const wishlistData = localStorage.getItem(this.wishlistKey);
            return wishlistData ? JSON.parse(wishlistData) : [];
        } catch (error) {
            console.error('Error getting wishlist:', error);
            return [];
        }
    }

    saveWishlist(wishlist) {
        try {
            localStorage.setItem(this.wishlistKey, JSON.stringify(wishlist));
        } catch (error) {
            console.error('Error saving wishlist:', error);
        }
    }

    // ===== RECENTLY VIEWED =====
    addToRecentlyViewed(product) {
        try {
            let recent = this.getRecentlyViewed();
            
            // Remove if already exists
            recent = recent.filter(item => item.id !== product.id);
            
            // Add to beginning
            recent.unshift({
                id: product.id,
                name: product.name,
                price: product.discountPrice || product.price,
                image: product.images?.[0]?.url || 'images/placeholder.jpg',
                viewedAt: new Date().toISOString()
            });
            
            // Keep only last 10 items
            if (recent.length > 10) {
                recent = recent.slice(0, 10);
            }
            
            localStorage.setItem(this.recentlyViewedKey, JSON.stringify(recent));
        } catch (error) {
            console.error('Error adding to recently viewed:', error);
        }
    }

    getRecentlyViewed() {
        try {
            const recentData = localStorage.getItem(this.recentlyViewedKey);
            return recentData ? JSON.parse(recentData) : [];
        } catch (error) {
            console.error('Error getting recently viewed:', error);
            return [];
        }
    }

    renderRecentlyViewed() {
        try {
            const recent = this.getRecentlyViewed();
            const container = document.getElementById('recentProducts');
            const section = document.getElementById('recentlyViewed');
            
            if (!container || !section) return;

            if (recent.length === 0) {
                section.style.display = 'none';
                return;
            }

            section.style.display = 'block';
            container.innerHTML = recent.slice(0, 4).map(product => `
                <div class="product-card">
                    <div class="product-image" onclick="window.location.href='product-detail.html?id=${product.id}'">
                        <img src="${product.image}" 
                             alt="${product.name}"
                             onerror="this.src='images/placeholder.jpg'">
                    </div>
                    <div class="product-content">
                        <h3 onclick="window.location.href='product-detail.html?id=${product.id}'">
                            ${product.name}
                        </h3>
                        <div class="product-price">
                            <span class="current-price">$${product.price}</span>
                        </div>
                        <button class="btn-add-cart" onclick="cart.addItemById('${product.id}')">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering recently viewed:', error);
        }
    }

    // ===== CHECKOUT =====
    prepareCheckout() {
        try {
            const cart = this.getCart();
            if (cart.length === 0) {
                showAlert('Your cart is empty', 'warning');
                return false;
            }

            // Check user authentication
            const user = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');
            
            if (!user || !token) {
                showAlert('Please login to checkout', 'warning');
                window.location.href = 'login.html?redirect=checkout.html';
                return false;
            }

            // Prepare checkout data
            const checkoutData = {
                cart: cart,
                user: user,
                totals: {
                    subtotal: this.getSubtotal(),
                    shipping: this.calculateShipping(this.getSubtotal()),
                    tax: this.calculateTax(this.getSubtotal()),
                    discount: this.getCouponDiscount(this.getSubtotal()),
                    total: this.calculateTotal()
                },
                coupon: localStorage.getItem(this.couponKey) ? 
                    JSON.parse(localStorage.getItem(this.couponKey)) : null,
                createdAt: new Date().toISOString()
            };

            // Save checkout data for the checkout page
            localStorage.setItem('checkout_data', JSON.stringify(checkoutData));
            return true;
        } catch (error) {
            console.error('Error preparing checkout:', error);
            showAlert('Failed to prepare checkout', 'error');
            return false;
        }
    }

    calculateTotal() {
        const subtotal = this.getSubtotal();
        const shipping = this.calculateShipping(subtotal);
        const tax = this.calculateTax(subtotal);
        const discount = this.getCouponDiscount(subtotal);
        return subtotal + shipping + tax - discount;
    }

    // ===== HELPER METHODS =====
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    setupEventListeners() {
        // Apply coupon button
        const applyCouponBtn = document.querySelector('.btn-apply-coupon');
        if (applyCouponBtn) {
            applyCouponBtn.addEventListener('click', () => {
                const couponInput = document.getElementById('couponCode');
                if (couponInput) {
                    this.applyCoupon(couponInput.value);
                }
            });
        }

        // Clear cart button
        const clearCartBtn = document.querySelector('.btn-clear');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear your cart?')) {
                    this.clearCart();
                }
            });
        }

        // Proceed to checkout button
        const checkoutBtn = document.querySelector('.btn-checkout');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (this.prepareCheckout()) {
                    window.location.href = 'checkout.html';
                }
            });
        }
    }

    // ===== PUBLIC API =====
    addItemById(productId) {
        // This would fetch product from API and add to cart
        // For now, create a mock product
        const mockProduct = {
            id: productId,
            name: `Product ${productId}`,
            price: 99.99,
            discountPrice: 89.99,
            stock: 10,
            images: [{ url: 'images/placeholder.jpg' }],
            brand: 'ElectroShop',
            model: 'PROD001'
        };
        return this.addItem(mockProduct, 1);
    }
}

// Initialize cart instance
const cart = new ShoppingCart();

// Global functions for HTML onclick handlers
function addToCart(productId, quantity = 1) {
    // This would normally fetch product details from API
    const mockProduct = {
        id: productId,
        name: `Product ${productId}`,
        price: 99.99,
        discountPrice: 89.99,
        stock: 10,
        images: [{ url: 'images/placeholder.jpg' }],
        brand: 'ElectroShop',
        model: 'PROD001'
    };
    return cart.addItem(mockProduct, quantity);
}

function toggleWishlist(productId) {
    // Wishlist functionality
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        showAlert('Please login to use wishlist', 'warning');
        window.location.href = 'login.html';
        return;
    }
    
    // Implementation would go here
    showAlert('Wishlist functionality coming soon', 'info');
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    // If on cart page, render cart items
    if (window.location.pathname.includes('cart.html')) {
        cart.renderCartItems();
        cart.updateOrderSummary();
        cart.renderRecentlyViewed();
    }
    
    // Update cart count on all pages
    cart.updateCartCount();
});