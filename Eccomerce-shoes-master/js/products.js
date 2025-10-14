// Product data structure
const products = [
    {
        id: 1,
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
        reviews: 124
    },
    {
        id: 2,
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
        reviews: 89
    },
    {
        id: 3,
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
        reviews: 156
    },
    {
        id: 4,
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
        reviews: 78
    },
    {
        id: 5,
        name: "Nike free Tr",
        price: 130.55,
        originalPrice: 160.55,
        image: "./images/women2.png",
        category: "women",
        sizes: ["US 6", "US 7", "US 8", "US 9", "US 10"],
        colors: ["Blue", "White", "Teal"],
        description: "Versatile women's sneaker perfect for both training and casual wear.",
        inStock: true,
        rating: 4.5,
        reviews: 92
    },
    {
        id: 6,
        name: "Nike Ges bink",
        price: 130.55,
        originalPrice: 160.55,
        image: "./images/women3.png",
        category: "women",
        sizes: ["US 6", "US 7", "US 8", "US 9", "US 10"],
        colors: ["Black", "White", "Silver"],
        description: "Elegant women's sneaker with modern design and superior comfort.",
        inStock: true,
        rating: 4.6,
        reviews: 67
    },
    {
        id: 7,
        name: "Nike Get 5",
        price: 130.55,
        originalPrice: 160.55,
        image: "./images/women4.png",
        category: "women",
        sizes: ["US 6", "US 7", "US 8", "US 9", "US 10"],
        colors: ["Red", "White", "Black"],
        description: "High-performance women's athletic shoe with advanced cushioning.",
        inStock: true,
        rating: 4.8,
        reviews: 83
    },
    {
        id: 8,
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
        reviews: 45
    },
    {
        id: 9,
        name: "Nike Sply",
        price: 120.2,
        originalPrice: 150.2,
        image: "./images/new3.png",
        category: "new",
        sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"],
        colors: ["Blue", "White", "Orange"],
        description: "Fresh design from Nike Sply line with contemporary styling.",
        inStock: true,
        rating: 4.3,
        reviews: 38
    },
    {
        id: 10,
        name: "Nike Sply",
        price: 120.2,
        originalPrice: 150.2,
        image: "./images/new4.png",
        category: "new",
        sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"],
        colors: ["Green", "White", "Yellow"],
        description: "Bold new colorway in the popular Nike Sply series.",
        inStock: true,
        rating: 4.5,
        reviews: 52
    },
    {
        id: 11,
        name: "Nike Sply",
        price: 120.2,
        originalPrice: 150.2,
        image: "./images/new5.png",
        category: "new",
        sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"],
        colors: ["Purple", "White", "Pink"],
        description: "Limited edition Nike Sply with unique color combination.",
        inStock: true,
        rating: 4.7,
        reviews: 29
    }
];

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(productId, selectedSize = 'US 9', selectedColor = 'Black') {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => 
        item.id === productId && 
        item.size === selectedSize && 
        item.color === selectedColor
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            size: selectedSize,
            color: selectedColor,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCounter();
    showAddToCartNotification();
}

function removeFromCart(productId, size, color) {
    cart = cart.filter(item => 
        !(item.id === productId && item.size === size && item.color === color)
    );
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCounter();
    if (typeof renderCart === 'function') {
        renderCart();
    }
}

function updateQuantity(productId, size, color, newQuantity) {
    const item = cart.find(item => 
        item.id === productId && item.size === size && item.color === color
    );
    
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId, size, color);
        } else {
            item.quantity = newQuantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            if (typeof renderCart === 'function') {
                renderCart();
            }
        }
    }
}

function updateCartCounter() {
    const counter = document.querySelector('.cart-counter');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (counter) {
        counter.textContent = totalItems;
        counter.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function showAddToCartNotification() {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class='bx bx-check'></i>
            <span>Added to cart!</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize cart counter on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCounter();
});
