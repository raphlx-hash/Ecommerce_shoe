const API_BASE_URL = (window.API_BASE_URL) || 'http://localhost:4000/api';

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    // no credentials to avoid CORS preflight/blocked cookies in static setup
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

const AuthAPI = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  emailExists: (email) => apiRequest(`/auth/exists?email=${encodeURIComponent(email)}`),
};

// Admin routes
const AdminAPI = {
  stats: () => apiRequest('/admin/stats'),
  listOrders: () => apiRequest('/admin/orders'),
  listUsers: () => apiRequest('/admin/users'),
};

// Products with multipart support
const ProductsAPI = {
  list: (query = '') => apiRequest(`/products${query ? `?${query}` : ''}`),
  get: (id) => apiRequest(`/products/${id}`),
  create: async (payload) => {
    // payload can be plain object with file under imageFile or image URL under image
    const form = new FormData();
    Object.keys(payload).forEach((k) => {
      const v = payload[k];
      if (v === undefined || v === null) return;
      if (k === 'sizes' || k === 'colors') {
        if (Array.isArray(v)) form.append(k, v.join(',')); else form.append(k, String(v));
      } else if (k === 'imageFile' && v instanceof File) {
        form.append('image', v);
      } else {
        form.append(k, v);
      }
    });
    const res = await fetch(`${API_BASE_URL}/products`, { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
    return data;
  },
  update: async (id, payload) => {
    const form = new FormData();
    Object.keys(payload).forEach((k) => {
      const v = payload[k];
      if (v === undefined || v === null) return;
      if (k === 'sizes' || k === 'colors') {
        if (Array.isArray(v)) form.append(k, v.join(',')); else form.append(k, String(v));
      } else if (k === 'imageFile' && v instanceof File) {
        form.append('image', v);
      } else {
        form.append(k, v);
      }
    });
    const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'PUT', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
    return data;
  },
  remove: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
};

// User data endpoints (stubs to backend)
const OrdersAPI = {
  list: (username) => apiRequest(username ? `/orders?username=${encodeURIComponent(username)}` : '/orders'),
  create: (payload) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(payload) }),
};

const WishlistAPI = {
  list: (username) => apiRequest(username ? `/wishlist?username=${encodeURIComponent(username)}` : '/wishlist'),
  add: (payload) => apiRequest('/wishlist', { method: 'POST', body: JSON.stringify(payload) }),
};

const BuyAgainAPI = {
  list: (username) => apiRequest(`/orders${username ? `?username=${encodeURIComponent(username)}` : ''}`),
};

window.AuthAPI = AuthAPI;
window.AdminAPI = AdminAPI;
window.ProductsAPI = ProductsAPI;
window.OrdersAPI = OrdersAPI;
window.WishlistAPI = WishlistAPI;
window.BuyAgainAPI = BuyAgainAPI;

// Cart API
const CartAPI = {
  list: (userName) => apiRequest(`/cart?userName=${encodeURIComponent(userName)}`),
  add: (payload) => apiRequest('/cart', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, quantity) => apiRequest(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  remove: (id) => apiRequest(`/cart/${id}`, { method: 'DELETE' }),
};

window.CartAPI = CartAPI;


