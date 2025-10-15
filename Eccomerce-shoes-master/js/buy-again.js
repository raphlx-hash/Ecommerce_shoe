// Buy Again page functionality
document.addEventListener('DOMContentLoaded', async function() {
    await loadBuyAgain();
    if (typeof updateCartCounter === 'function') updateCartCounter();
    if (typeof updateUserInfo === 'function') updateUserInfo();
});

async function loadBuyAgain() {
    const container = document.getElementById('buy-again-container');
    
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
        container.innerHTML = `
            <div class="no-results">
                <h3>Please log in to see your buy again items</h3>
                <a href="login.html" class="button">Login</a>
            </div>
        `;
        return;
    }
    
    const username = currentUser.firstName || currentUser.username || currentUser.email;
    
    try {
        // Fetch orders for the user
        const orders = await BuyAgainAPI.list(username);
        
        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <h3>No previous orders found</h3>
                    <p>Start shopping to see your buy again items here!</p>
                    <a href="shop.html" class="button">Start Shopping</a>
                </div>
            `;
            return;
        }
        
        // Extract unique products from all orders
        const uniqueProducts = new Map();
        
        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const productId = item.product?._id || item.product;
                    if (productId && !uniqueProducts.has(productId)) {
                        uniqueProducts.set(productId, {
                            _id: productId,
                            name: item.name || item.product?.name || 'Unknown Product',
                            price: item.price || item.product?.price || 0,
                            image: item.image || item.product?.image || '',
                            size: item.size || 'N/A',
                            color: item.color || 'N/A'
                        });
                    }
                });
            }
        });
        
        const products = Array.from(uniqueProducts.values());
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <h3>No products found in your order history</h3>
                    <p>Your orders don't contain any products to buy again.</p>
                    <a href="shop.html" class="button">Start Shopping</a>
                </div>
            `;
            return;
        }
        
        // Render product cards
        container.innerHTML = products.map(product => `
            <article class="sneaker" data-id="${product._id}">
                <img src="${imageForProductName(product.name)}" 
                     alt="${product.name}" 
                     class="sneaker__img" 
                     onerror="handleImgFallback(this, '${encodeURIComponent(product.name)}')">
                <span class="sneaker__name">${product.name}</span>
                <span class="sneaker__price">$${product.price.toFixed(2)}</span>
                <a href="#" class="button-light buy-again-btn" data-id="${product._id}">
                    Buy again<i class='bx bx-right-arrow-alt button-icon'></i>
                </a>
            </article>
        `).join('');
        
        // Add event listeners
        container.querySelectorAll('.sneaker').forEach(card => {
            const productId = card.getAttribute('data-id');
            
            // Card click - go to product page
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.buy-again-btn')) {
                    goToProduct(productId);
                }
            });
            
            // Buy again button click
            const buyAgainBtn = card.querySelector('.buy-again-btn');
            if (buyAgainBtn) {
                buyAgainBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleBuyAgain(productId, product);
                });
            }
        });
        
    } catch (error) {
        console.error('Error loading buy again items:', error);
        container.innerHTML = `
            <div class="no-results">
                <h3>Failed to load buy again items</h3>
                <p>Please try again later.</p>
                <button onclick="loadBuyAgain()" class="button">Retry</button>
            </div>
        `;
    }
}

async function handleBuyAgain(productId, product) {
    try {
        // Navigate to product page with the specific product
        window.location.href = `product.html?id=${productId}`;
    } catch (error) {
        console.error('Error handling buy again:', error);
        showNotification('Failed to navigate to product page', 'error');
    }
}

function goToProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('notification--show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('notification--show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}
