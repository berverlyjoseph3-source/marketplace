// API Service Module
const API_BASE = 'electohub-backend-production.up.railway.app/api';

const API = {
  // Auth endpoints
  auth: {
    login: async (email, password) => {
      return fetchData(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },
    
    register: async (userData) => {
      return fetchData(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },
    
    getProfile: async () => {
      return fetchData(`${API_BASE}/auth/me`);
    },
    
    updateProfile: async (data) => {
      return fetchData(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    
    changePassword: async (currentPassword, newPassword) => {
      return fetchData(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
    }
  },
  
  // Product endpoints
  products: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchData(`${API_BASE}/products${query ? `?${query}` : ''}`);
    },
    
    getById: async (id) => {
      return fetchData(`${API_BASE}/products/${id}`);
    },
    
    getByCategory: async (category, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchData(`${API_BASE}/products/category/${category}${query ? `?${query}` : ''}`);
    },
    
    getFeatured: async (limit = 8) => {
      return fetchData(`${API_BASE}/products/featured/random?limit=${limit}`);
    },
    
    search: async (query, params = {}) => {
      const searchParams = new URLSearchParams({ search: query, ...params }).toString();
      return fetchData(`${API_BASE}/products?${searchParams}`);
    }
  },
  
  // Cart endpoints (simulated)
  cart: {
    get: async () => {
      // For demo, return cart from localStorage
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            success: true,
            data: storage.get('cart') || []
          });
        }, 100);
      });
    },
    
    add: async (productId, quantity = 1, variantId = null) => {
      // Simulate API call
      return new Promise(resolve => {
        setTimeout(() => {
          const product = appState.products.find(p => p.id === productId);
          if (product) {
            addToCart(product, quantity);
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'Product not found' });
          }
        }, 200);
      });
    },
    
    remove: async (productId) => {
      return new Promise(resolve => {
        setTimeout(() => {
          removeFromCart(productId);
          resolve({ success: true });
        }, 200);
      });
    },
    
    update: async (productId, quantity) => {
      return new Promise(resolve => {
        setTimeout(() => {
          updateCartQuantity(productId, quantity);
          resolve({ success: true });
        }, 200);
      });
    },
    
    clear: async () => {
      return new Promise(resolve => {
        setTimeout(() => {
          clearCart();
          resolve({ success: true });
        }, 200);
      });
    }
  },
  
  // Order endpoints
  orders: {
    create: async (orderData) => {
      return fetchData(`${API_BASE}/orders`, {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    },
    
    getAll: async () => {
      return fetchData(`${API_BASE}/orders`);
    },
    
    getById: async (id) => {
      return fetchData(`${API_BASE}/orders/${id}`);
    },
    
    cancel: async (id) => {
      return fetchData(`${API_BASE}/orders/${id}/cancel`, {
        method: 'POST'
      });
    }
  },
  
  // Admin endpoints
  admin: {
    getStats: async () => {
      return fetchData(`${API_BASE}/admin/dashboard/stats`);
    },
    
    getUsers: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchData(`${API_BASE}/admin/users${query ? `?${query}` : ''}`);
    },
    
    updateUser: async (id, data) => {
      return fetchData(`${API_BASE}/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    
    getOrders: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchData(`${API_BASE}/admin/orders${query ? `?${query}` : ''}`);
    },
    
    updateOrderStatus: async (id, status) => {
      return fetchData(`${API_BASE}/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    }
  }
};

// Helper function for fetch
async function fetchData(url, options = {}) {
  try {
    const token = storage.get('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (response.status === 401) {
      // Token expired, logout user
      storage.remove('token');
      storage.remove('user');
      appState.user = null;
      showAlert('Session expired. Please login again.', 'error');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
