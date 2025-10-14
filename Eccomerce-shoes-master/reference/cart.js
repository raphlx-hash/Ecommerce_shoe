// Cart page functionality
document.addEventListener('DOMContentLoaded', function() {
    renderCart();
    updateCartCounter();
});

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCart = document.getElementById('empty-cart');
    
    if (cart.length === 0) {
        cartItems.style.display = 'none';
        cartSummary.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }
    
    cartItems.style.display = 'block';
    cartSummary.style.display = 'block';
    emptyCart.style.display = 'none';
    
    // Render cart items
    const itemsHTML = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        return `
            <div class="cart-item">
                <div class="cart-item__image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item__details">
                    <h4 class="cart-item__name">${item.name}</h4>
                    <p class="cart-item__variant">Size: ${item.size} | Color: ${item.color}</p>
                    <p class="cart-item__price">$${item.price}</p>
                </div>
                <div class="cart-item__quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, '${item.size}', '${item.color}', ${item.quantity - 1})">
                        <i class='bx bx-minus'></i>
                    </button>
                    <span class="quantity-number">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, '${item.size}', '${item.color}', ${item.quantity + 1})">
                        <i class='bx bx-plus'></i>
                    </button>
                </div>
                <div class="cart-item__total">
                    $${(item.price * item.quantity).toFixed(2)}
                </div>
                <button class="cart-item__remove" onclick="removeFromCart(${item.id}, '${item.size}', '${item.color}')">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
        `;
    }).join('');
    
    cartItems.innerHTML = itemsHTML;
    
    // Update summary
    updateCartSummary();
}

function updateCartSummary() {
    const subtotal = getCartTotal();
    const shipping = 9.99;
    const total = subtotal + shipping;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Initialize cart when page loads
if (typeof cart !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        renderCart();
        updateCartCounter();
    });
}
