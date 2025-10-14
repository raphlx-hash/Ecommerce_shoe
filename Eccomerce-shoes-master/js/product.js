// Product detail page functionality
let selectedSize = '';
let selectedColor = '';
let currentProduct = null;

document.addEventListener('DOMContentLoaded', function() {
    loadProduct();
    updateCartCounter();
    setupImageOptimization();
    setupScrollOptimization();
});

function setupImageOptimization() {
    // Use Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        // Observe all images
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

function setupScrollOptimization() {
    let ticking = false;
    
    function updateScrollPosition() {
        // Add scroll-based optimizations here if needed
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateScrollPosition);
            ticking = true;
        }
    });
    
    // Handle resize events
    window.addEventListener('resize', debounce(() => {
        // Recalculate image sizes on resize
        const mainImage = document.getElementById('main-product-image');
        if (mainImage && currentProduct) {
            optimizeImageDisplay(mainImage, currentProduct);
        }
    }, 250));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function optimizeImageDisplay(imgElement, product) {
    // Ensure image fits properly in container
    imgElement.style.maxWidth = '100%';
    imgElement.style.maxHeight = '100%';
    imgElement.style.objectFit = 'contain';
    imgElement.style.objectPosition = 'center';
    
    // Add loading state
    imgElement.style.opacity = '0.7';
    imgElement.style.transition = 'opacity 0.3s ease';
    
    // Handle image load
    imgElement.onload = () => {
        imgElement.style.opacity = '1';
    };
    
    // Handle image error
    imgElement.onerror = () => {
        imgElement.style.opacity = '1';
        handleImgFallback(imgElement, encodeURIComponent(product.name));
    };
}

async function loadProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }
    
    let product;
    try {
        product = await ProductsAPI.get(productId);
        currentProduct = product; // Store for optimization functions
    } catch (e) {
        window.location.href = 'shop.html';
        return;
    }
    
    // Update page title
    document.title = `${product.name} - Ropy`;
    
    // Update product information
    document.getElementById('product-name').textContent = product.name;
    const categoryText = Array.isArray(product.category) ? product.category.join(', ') : (product.category || '');
    document.getElementById('product-category').textContent = categoryText;
    document.getElementById('product-price').textContent = `$${product.price}`;
    document.getElementById('product-original-price').textContent = `$${product.originalPrice}`;
    document.getElementById('product-description').textContent = product.description;
    
    // Render features
    if (Array.isArray(product.features)) {
        const featuresList = product.features.map(f => `<li><i class='bx bx-check'></i> ${f}</li>`).join('');
        const featuresContainer = document.querySelector('.product__features ul');
        if (featuresContainer) featuresContainer.innerHTML = featuresList || '<li>No features listed</li>';
    }
    
    document.getElementById('product-rating').textContent = `${product.rating} (${product.reviews} reviews)`;
    
    // Optimize image loading
    const imgEl = document.getElementById('main-product-image');
    optimizeImageDisplay(imgEl, product);
    imgEl.src = imageForProductName(product.name);
    imgEl.setAttribute('onerror', `handleImgFallback(this, '${encodeURIComponent(product.name)}')`);
    
    // Calculate discount
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    document.querySelector('.discount-badge').textContent = `Save ${discount}%`;
    
    // Generate size options
    const sizeOptions = document.getElementById('size-options');
    sizeOptions.innerHTML = (product.sizes || []).map(size => `
        <button class="size-option" data-size="${size}">${size}</button>
    `).join('');
    
    // Generate color options
    const colorOptions = document.getElementById('color-options');
    colorOptions.innerHTML = (product.colors || []).map(color => `
        <button class="color-option" data-color="${color}" style="background-color: ${getColorValue(color)}" title="${color}"></button>
    `).join('');
    
    // Set default selections
    selectedSize = (product.sizes || [])[0] || '';
    selectedColor = (product.colors || [])[0] || '';
    
    // Update selected states
    updateSizeSelection();
    updateColorSelection();
    
    // Add event listeners
    addProductEventListeners(product);
}

function getColorValue(color) {
    const colorMap = {
        'Black': '#000000',
        'White': '#ffffff',
        'Red': '#ff0000',
        'Blue': '#0000ff',
        'Gray': '#808080',
        'Gold': '#ffd700',
        'Pink': '#ffc0cb',
        'Purple': '#800080',
        'Teal': '#008080',
        'Silver': '#c0c0c0',
        'Orange': '#ffa500',
        'Green': '#008000',
        'Yellow': '#ffff00'
    };
    return colorMap[color] || '#cccccc';
}

function addProductEventListeners(product) {
    // Size selection
    document.querySelectorAll('.size-option').forEach(button => {
        button.addEventListener('click', function() {
            selectedSize = this.dataset.size;
            updateSizeSelection();
        });
    });
    
    // Color selection
    document.querySelectorAll('.color-option').forEach(button => {
        button.addEventListener('click', function() {
            selectedColor = this.dataset.color;
            updateColorSelection();
        });
    });
    
    // Add to cart
    document.getElementById('add-to-cart-btn').addEventListener('click', async function() {
        // Require size and color selection
        if (!selectedSize || !selectedColor) {
            alert('Please select a size and color');
            return;
        }

        // Require logged-in user for backend cart
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser) {
            alert('Please login to add items to your cart.');
            window.location.href = 'auth.html';
            return;
        }

        const userName = currentUser.firstName || currentUser.username || currentUser.email;
        if (!userName) {
            alert('User name is missing. Please re-login.');
            window.location.href = 'auth.html';
            return;
        }

        // Build payload including product details
        const payload = {
            userName,
            productId: product._id || product.id,
            size: selectedSize,
            color: selectedColor,
            quantity: 1,
            // product info (server computes from DB as source of truth; included here for clarity)
            name: product.name,
            price: product.price,
            image: product.image
        };

        try {
            await CartAPI.add(payload);
            this.textContent = 'Added to Cart!';
            this.style.backgroundColor = '#28a745';
            setTimeout(() => {
                this.textContent = 'Add to Cart';
                this.style.backgroundColor = '';
            }, 2000);
        } catch (err) {
            const message = (err && err.message) ? err.message : 'Failed to add to cart';
            alert(message);
        }
    });
    
    // Wishlist button
    document.querySelector('.wishlist-btn').addEventListener('click', async function() {
        // Require size and color selection
        if (!selectedSize || !selectedColor) {
            alert('Please select a size and color');
            return;
        }

        // Require logged-in user
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser) {
            alert('Please login to add items to your wishlist.');
            window.location.href = 'auth.html';
            return;
        }
        const username = currentUser.firstName || currentUser.username || currentUser.email;
        if (!username) {
            alert('User name is missing. Please re-login.');
            window.location.href = 'auth.html';
            return;
        }

        const payload = {
            username,
            productId: product._id || product.id,
            size: selectedSize,
            color: selectedColor,
            name: product.name,
            price: product.price,
            image: product.image
        };

        try {
            await WishlistAPI.add(payload);
            this.classList.add('active');
            const icon = this.querySelector('i');
            if (icon) icon.className = 'bx bxs-heart';
            showNotification('Added to wishlist!');
        } catch (err) {
            const message = (err && err.message) ? err.message : 'Failed to add to wishlist';
            alert(message);
        }
    });
}

function updateSizeSelection() {
    document.querySelectorAll('.size-option').forEach(button => {
        button.classList.remove('selected');
        if (button.dataset.size === selectedSize) {
            button.classList.add('selected');
        }
    });
}

function updateColorSelection() {
    document.querySelectorAll('.color-option').forEach(button => {
        button.classList.remove('selected');
        if (button.dataset.color === selectedColor) {
            button.classList.add('selected');
        }
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
