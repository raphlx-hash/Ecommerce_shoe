// Database management using IndexedDB
class DatabaseManager {
    constructor() {
        this.dbName = 'ropy_ecommerce';
        this.dbVersion = 1;
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                this.createObjectStores();
            };
        });
    }

    // Create object stores (tables)
    createObjectStores() {
        // Products store
        if (!this.db.objectStoreNames.contains('products')) {
            const productsStore = this.db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
            productsStore.createIndex('category', 'category', { unique: false });
            productsStore.createIndex('name', 'name', { unique: false });
            productsStore.createIndex('price', 'price', { unique: false });
        }

        // Users store
        if (!this.db.objectStoreNames.contains('users')) {
            const usersStore = this.db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            usersStore.createIndex('email', 'email', { unique: true });
            usersStore.createIndex('username', 'username', { unique: true });
        }

        // Orders store
        if (!this.db.objectStoreNames.contains('orders')) {
            const ordersStore = this.db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
            ordersStore.createIndex('userId', 'userId', { unique: false });
            ordersStore.createIndex('orderNumber', 'orderNumber', { unique: true });
            ordersStore.createIndex('status', 'status', { unique: false });
            ordersStore.createIndex('date', 'date', { unique: false });
        }

        // Cart items store
        if (!this.db.objectStoreNames.contains('cartItems')) {
            const cartStore = this.db.createObjectStore('cartItems', { keyPath: 'id', autoIncrement: true });
            cartStore.createIndex('userId', 'userId', { unique: false });
            cartStore.createIndex('productId', 'productId', { unique: false });
        }

        // Reviews store
        if (!this.db.objectStoreNames.contains('reviews')) {
            const reviewsStore = this.db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
            reviewsStore.createIndex('productId', 'productId', { unique: false });
            reviewsStore.createIndex('userId', 'userId', { unique: false });
            reviewsStore.createIndex('rating', 'rating', { unique: false });
        }

        // Wishlist store
        if (!this.db.objectStoreNames.contains('wishlist')) {
            const wishlistStore = this.db.createObjectStore('wishlist', { keyPath: 'id', autoIncrement: true });
            wishlistStore.createIndex('userId', 'userId', { unique: false });
            wishlistStore.createIndex('productId', 'productId', { unique: false });
        }

        // Categories store
        if (!this.db.objectStoreNames.contains('categories')) {
            const categoriesStore = this.db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
            categoriesStore.createIndex('name', 'name', { unique: true });
        }
    }

    // Generic CRUD operations
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Product operations
    async addProduct(product) {
        return this.add('products', product);
    }

    async getProduct(id) {
        return this.get('products', id);
    }

    async getAllProducts() {
        return this.getAll('products');
    }

    async updateProduct(product) {
        return this.update('products', product);
    }

    async deleteProduct(id) {
        return this.delete('products', id);
    }

    async getProductsByCategory(category) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const index = store.index('category');
            const request = index.getAll(category);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async searchProducts(query) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const request = store.getAll();

            request.onsuccess = () => {
                const products = request.result;
                const filtered = products.filter(product => 
                    product.name.toLowerCase().includes(query.toLowerCase()) ||
                    product.description.toLowerCase().includes(query.toLowerCase()) ||
                    product.category.toLowerCase().includes(query.toLowerCase())
                );
                resolve(filtered);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // User operations
    async addUser(user) {
        return this.add('users', user);
    }

    async getUser(id) {
        return this.get('users', id);
    }

    async getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('email');
            const request = index.get(email);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateUser(user) {
        return this.update('users', user);
    }

    async authenticateUser(email, password) {
        const user = await this.getUserByEmail(email);
        if (user && user.password === password) {
            return user;
        }
        return null;
    }

    // Order operations
    async addOrder(order) {
        return this.add('orders', order);
    }

    async getOrder(id) {
        return this.get('orders', id);
    }

    async getAllOrders() {
        return this.getAll('orders');
    }

    async getOrdersByUser(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['orders'], 'readonly');
            const store = transaction.objectStore('orders');
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateOrderStatus(orderId, status) {
        const order = await this.getOrder(orderId);
        if (order) {
            order.status = status;
            order.updatedAt = new Date().toISOString();
            return this.update('orders', order);
        }
        return null;
    }

    // Cart operations
    async addToCart(userId, productId, size, color, quantity = 1) {
        const cartItem = {
            userId: userId,
            productId: productId,
            size: size,
            color: color,
            quantity: quantity,
            addedAt: new Date().toISOString()
        };
        return this.add('cartItems', cartItem);
    }

    async getCartItems(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cartItems'], 'readonly');
            const store = transaction.objectStore('cartItems');
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateCartItemQuantity(cartItemId, quantity) {
        const cartItem = await this.get('cartItems', cartItemId);
        if (cartItem) {
            cartItem.quantity = quantity;
            return this.update('cartItems', cartItem);
        }
        return null;
    }

    async removeFromCart(cartItemId) {
        return this.delete('cartItems', cartItemId);
    }

    async clearCart(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cartItems'], 'readwrite');
            const store = transaction.objectStore('cartItems');
            const index = store.index('userId');
            const request = index.openCursor(userId);

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Review operations
    async addReview(review) {
        return this.add('reviews', review);
    }

    async getReviewsByProduct(productId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['reviews'], 'readonly');
            const store = transaction.objectStore('reviews');
            const index = store.index('productId');
            const request = index.getAll(productId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAverageRating(productId) {
        const reviews = await this.getReviewsByProduct(productId);
        if (reviews.length === 0) return 0;
        
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return sum / reviews.length;
    }

    // Wishlist operations
    async addToWishlist(userId, productId) {
        const wishlistItem = {
            userId: userId,
            productId: productId,
            addedAt: new Date().toISOString()
        };
        return this.add('wishlist', wishlistItem);
    }

    async getWishlist(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['wishlist'], 'readonly');
            const store = transaction.objectStore('wishlist');
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removeFromWishlist(wishlistItemId) {
        return this.delete('wishlist', wishlistItemId);
    }

    async isInWishlist(userId, productId) {
        const wishlist = await this.getWishlist(userId);
        return wishlist.some(item => item.productId === productId);
    }

    // Category operations
    async addCategory(category) {
        return this.add('categories', category);
    }

    async getAllCategories() {
        return this.getAll('categories');
    }

    // Initialize with sample data
    async initializeWithSampleData() {
        try {
            // Check if products already exist
            const existingProducts = await this.getAllProducts();
            if (existingProducts.length > 0) {
                console.log('Database already initialized with products');
                return;
            }

            // Add sample categories
            const categories = [
                { name: 'Featured', description: 'Featured products' },
                { name: 'Women', description: 'Women\'s shoes' },
                { name: 'New', description: 'New arrivals' },
                { name: 'Men', description: 'Men\'s shoes' }
            ];

            for (const category of categories) {
                await this.addCategory(category);
            }

            // Add sample products
            const sampleProducts = [
                {
                    name: "Nike Jordan",
                    price: 149.2,
                    originalPrice: 199.2,
                    image: "./images/featured1.png",
                    category: "featured",
                    sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"],
                    colors: ["Black", "White", "Red"],
                    description: "The iconic Nike Jordan sneaker featuring premium materials and classic design.",
                    inStock: true,
                    rating: 4.8,
                    reviews: 124,
                    createdAt: new Date().toISOString()
                },
                {
                    name: "Nike Free Nm",
                    price: 149.2,
                    originalPrice: 179.2,
                    image: "./images/featured2.png",
                    category: "featured",
                    sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"],
                    colors: ["Blue", "White", "Gray"],
                    description: "Lightweight running shoe with natural motion technology for ultimate comfort.",
                    inStock: true,
                    rating: 4.6,
                    reviews: 89,
                    createdAt: new Date().toISOString()
                },
                {
                    name: "Nike Jordan Yd",
                    price: 149.2,
                    originalPrice: 189.2,
                    image: "./images/featured3.png",
                    category: "featured",
                    sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"],
                    colors: ["Black", "Gold", "White"],
                    description: "Premium Jordan design with enhanced cushioning and durability.",
                    inStock: true,
                    rating: 4.9,
                    reviews: 156,
                    createdAt: new Date().toISOString()
                },
                {
                    name: "Nike free Tr",
                    price: 130.55,
                    originalPrice: 160.55,
                    image: "./images/women1.png",
                    category: "women",
                    sizes: ["US 6", "US 7", "US 8", "US 9", "US 10"],
                    colors: ["Pink", "White", "Purple"],
                    description: "Women's training shoe designed for flexibility and support during workouts.",
                    inStock: true,
                    rating: 4.7,
                    reviews: 78,
                    createdAt: new Date().toISOString()
                },
                {
                    name: "Nike Sply",
                    price: 120.2,
                    originalPrice: 150.2,
                    image: "./images/new2.png",
                    category: "new",
                    sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"],
                    colors: ["Black", "White", "Gray"],
                    description: "Latest Nike Sply collection featuring innovative design and technology.",
                    inStock: true,
                    rating: 4.4,
                    reviews: 45,
                    createdAt: new Date().toISOString()
                }
            ];

            for (const product of sampleProducts) {
                await this.addProduct(product);
            }

            // Add sample admin user
            const adminUser = {
                username: "admin",
                email: "admin@ropy.com",
                password: "admin123",
                firstName: "Admin",
                lastName: "User",
                role: "admin",
                createdAt: new Date().toISOString()
            };
            await this.addUser(adminUser);

            // Add sample customer user
            const customerUser = {
                username: "customer",
                email: "customer@ropy.com",
                password: "customer123",
                firstName: "John",
                lastName: "Doe",
                role: "customer",
                createdAt: new Date().toISOString()
            };
            await this.addUser(customerUser);

            console.log('Database initialized with sample data');
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }

    // Backup and restore functionality
    async exportData() {
        const data = {
            products: await this.getAllProducts(),
            users: await this.getAllUsers(),
            orders: await this.getAllOrders(),
            categories: await this.getAllCategories(),
            exportDate: new Date().toISOString()
        };
        return data;
    }

    async importData(data) {
        try {
            if (data.products) {
                for (const product of data.products) {
                    await this.addProduct(product);
                }
            }
            if (data.users) {
                for (const user of data.users) {
                    await this.addUser(user);
                }
            }
            if (data.orders) {
                for (const order of data.orders) {
                    await this.addOrder(order);
                }
            }
            if (data.categories) {
                for (const category of data.categories) {
                    await this.addCategory(category);
                }
            }
            console.log('Data imported successfully');
        } catch (error) {
            console.error('Error importing data:', error);
        }
    }
}

// Global database instance
let db = new DatabaseManager();

// Initialize database when page loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await db.init();
        await db.initializeWithSampleData();
        console.log('Database ready');
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
});
