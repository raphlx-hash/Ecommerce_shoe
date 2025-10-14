// Admin panel functionality
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeAdmin();
});

// Authentication check
function checkAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
        showLoginForm();
    } else {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        initializeAdmin();
    }
}

function showLoginForm() {
    const loginForm = `
        <div class="login-modal" id="login-modal">
            <div class="login-content">
                <h2>Admin Login</h2>
                <form id="admin-login-form">
                    <div class="form-group">
                        <label for="admin-email">Email:</label>
                        <input type="email" id="admin-email" required>
                    </div>
                    <div class="form-group">
                        <label for="admin-password">Password:</label>
                        <input type="password" id="admin-password" required>
                    </div>
                    <button type="submit" class="button">Login</button>
                </form>
                <p>Demo credentials: admin@ropy.com / admin123</p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loginForm);
    
    document.getElementById('admin-login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        
        try {
            const user = await db.authenticateUser(email, password);
            if (user && user.role === 'admin') {
                currentUser = user;
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify(user));
                document.getElementById('login-modal').remove();
                initializeAdmin();
            } else {
                alert('Invalid credentials or insufficient permissions');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    });
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('currentUser');
    currentUser = null;
    location.reload();
}

// Initialize admin panel
async function initializeAdmin() {
    await loadDashboardStats();
    await loadRecentOrders();
    setupNavigation();
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const products = await db.getAllProducts();
        const orders = await db.getAllOrders();
        const users = await db.getAllUsers();
        
        document.getElementById('total-products').textContent = products.length;
        document.getElementById('total-orders').textContent = orders.length;
        document.getElementById('total-users').textContent = users.length;
        
        // Calculate total revenue
        const totalRevenue = orders.reduce((sum, order) => sum + order.totals.total, 0);
        document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load recent orders
async function loadRecentOrders() {
    try {
        const orders = await db.getAllOrders();
        const recentOrders = orders.slice(-5).reverse();
        
        const ordersList = document.getElementById('recent-orders');
        if (recentOrders.length === 0) {
            ordersList.innerHTML = '<p>No orders found</p>';
            return;
        }
        
        ordersList.innerHTML = recentOrders.map(order => `
            <div class="activity__item">
                <div class="activity__info">
                    <h4>Order #${order.orderNumber}</h4>
                    <p>${order.shipping.firstName} ${order.shipping.lastName}</p>
                </div>
                <div class="activity__details">
                    <span class="activity__date">${formatDate(order.date)}</span>
                    <span class="activity__amount">$${order.totals.total.toFixed(2)}</span>
                    <span class="activity__status status-${order.status}">${order.status}</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            showSection(section);
        });
    });
}

// Show specific section
async function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('[id$="-management"], #dashboard').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(sectionName).style.display = 'block';
    
    // Update active nav link
    document.querySelectorAll('.nav__link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[href="#${sectionName}"]`).classList.add('active');
    
    // Load section data
    switch (sectionName) {
        case 'products':
            await loadProducts();
            break;
        case 'orders':
            await loadOrders();
            break;
        case 'users':
            await loadUsers();
            break;
        case 'dashboard':
            await loadDashboardStats();
            await loadRecentOrders();
            break;
    }
}

// Load products for management
async function loadProducts() {
    try {
        const products = await db.getAllProducts();
        const tbody = document.getElementById('products-table-body');
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No products found</td></tr>';
            return;
        }
        
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td><img src="${resolveImageUrl(product.image)}" alt="${product.name}" class="table-image"></td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>$${product.price}</td>
                <td>${product.inStock ? 'In Stock' : 'Out of Stock'}</td>
                <td class="actions">
                    <button class="btn-edit" onclick="editProduct(${product.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function resolveImageUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) {
        // Admin pages may not have API_BASE_URL; fallback
        try { return `${API_BASE_URL.replace('/api','')}${path}`; } catch(e) { return path; }
    }
    return path;
}

// Load orders for management
async function loadOrders() {
    try {
        const orders = await db.getAllOrders();
        const tbody = document.getElementById('orders-table-body');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No orders found</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.orderNumber}</td>
                <td>${order.shipping.firstName} ${order.shipping.lastName}</td>
                <td>${formatDate(order.date)}</td>
                <td>$${order.totals.total.toFixed(2)}</td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td class="actions">
                    <button class="btn-view" onclick="viewOrder(${order.id})">View</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Load users for management
async function loadUsers() {
    try {
        const users = await db.getAllUsers();
        const tbody = document.getElementById('users-table-body');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="role-badge role-${user.role}">${user.role}</span></td>
                <td>${formatDate(user.createdAt)}</td>
                <td class="actions">
                    <button class="btn-view" onclick="viewUser(${user.id})">View</button>
                    ${user.role !== 'admin' ? `<button class="btn-delete" onclick="deleteUser(${user.id})">Delete</button>` : ''}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Product management functions
function showAddProductForm() {
    document.getElementById('modal-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-modal').style.display = 'block';
}

async function editProduct(productId) {
    try {
        const product = await db.getProduct(productId);
        if (product) {
            document.getElementById('modal-title').textContent = 'Edit Product';
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-original-price').value = product.originalPrice || '';
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-image').value = product.image;
            document.getElementById('product-sizes').value = product.sizes.join(', ');
            document.getElementById('product-colors').value = product.colors.join(', ');
            document.getElementById('product-in-stock').checked = product.inStock;
            
            document.getElementById('product-modal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading product:', error);
    }
}

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await db.deleteProduct(productId);
            await loadProducts();
            showNotification('Product deleted successfully');
        } catch (error) {
            console.error('Error deleting product:', error);
            showNotification('Error deleting product', 'error');
        }
    }
}

// Handle product form submission
document.addEventListener('DOMContentLoaded', function() {
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const productData = {
                name: document.getElementById('product-name').value,
                price: parseFloat(document.getElementById('product-price').value),
                originalPrice: parseFloat(document.getElementById('product-original-price').value) || null,
                category: document.getElementById('product-category').value,
                description: document.getElementById('product-description').value,
                image: document.getElementById('product-image').value,
                sizes: document.getElementById('product-sizes').value.split(',').map(s => s.trim()),
                colors: document.getElementById('product-colors').value.split(',').map(c => c.trim()),
                inStock: document.getElementById('product-in-stock').checked,
                rating: 0,
                reviews: 0,
                createdAt: new Date().toISOString()
            };
            
            try {
                const productId = document.getElementById('product-id').value;
                
                if (productId) {
                    // Update existing product
                    productData.id = parseInt(productId);
                    await db.updateProduct(productData);
                    showNotification('Product updated successfully');
                } else {
                    // Add new product
                    await db.addProduct(productData);
                    showNotification('Product added successfully');
                }
                
                closeModal();
                await loadProducts();
                
            } catch (error) {
                console.error('Error saving product:', error);
                showNotification('Error saving product', 'error');
            }
        });
    }
});

// Order management functions
async function updateOrderStatus(orderId, status) {
    try {
        await db.updateOrderStatus(orderId, status);
        showNotification('Order status updated successfully');
        await loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Error updating order status', 'error');
    }
}

async function viewOrder(orderId) {
    try {
        const order = await db.getOrder(orderId);
        if (order) {
            const orderDetails = `
                Order #${order.orderNumber}
                Date: ${formatDate(order.date)}
                Customer: ${order.shipping.firstName} ${order.shipping.lastName}
                Email: ${order.shipping.email}
                Total: $${order.totals.total.toFixed(2)}
                Status: ${order.status}
                
                Items:
                ${order.items.map(item => `- ${item.name} (${item.size}, ${item.color}) x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}
            `;
            alert(orderDetails);
        }
    } catch (error) {
        console.error('Error loading order:', error);
    }
}

// User management functions
async function viewUser(userId) {
    try {
        const user = await db.getUser(userId);
        if (user) {
            const userDetails = `
                Username: ${user.username}
                Email: ${user.email}
                Name: ${user.firstName} ${user.lastName}
                Role: ${user.role}
                Created: ${formatDate(user.createdAt)}
            `;
            alert(userDetails);
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await db.delete('users', userId);
            await loadUsers();
            showNotification('User deleted successfully');
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('Error deleting user', 'error');
        }
    }
}

// Modal functions
function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
}

// Data management functions
async function exportData() {
    try {
        const data = await db.exportData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ropy-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('Data exported successfully');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Error exporting data', 'error');
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                await db.importData(data);
                showNotification('Data imported successfully');
                await loadDashboardStats();
            } catch (error) {
                console.error('Error importing data:', error);
                showNotification('Error importing data', 'error');
            }
        }
    };
    
    input.click();
}

async function clearDatabase() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
        try {
            // Clear all object stores
            const stores = ['products', 'users', 'orders', 'cartItems', 'reviews', 'wishlist', 'categories'];
            for (const storeName of stores) {
                const transaction = db.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await store.clear();
            }
            
            showNotification('Database cleared successfully');
            await loadDashboardStats();
        } catch (error) {
            console.error('Error clearing database:', error);
            showNotification('Error clearing database', 'error');
        }
    }
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'success') {
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
