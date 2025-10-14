// Cart page functionality
document.addEventListener('DOMContentLoaded', async function() {
    await renderCart();
    if (typeof updateCartCounter === 'function') updateCartCounter();
});

let currentServerCart = [];

async function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCart = document.getElementById('empty-cart');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
        cartItems.style.display = 'none';
        cartSummary.style.display = 'none';
        emptyCart.style.display = 'block';
        emptyCart.querySelector('h3').textContent = 'Please login to view your cart';
        emptyCart.querySelector('a.button').textContent = 'Login';
        emptyCart.querySelector('a.button').href = 'auth.html';
        return;
    }

    const userName = currentUser.firstName || currentUser.username || currentUser.email;
    let serverCart = [];
    try {
        serverCart = await CartAPI.list(userName);
    } catch(e) {
        serverCart = [];
    }

    currentServerCart = serverCart;

    if (!serverCart.length) {
        cartItems.style.display = 'none';
        cartSummary.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }
    
    cartItems.style.display = 'block';
    cartSummary.style.display = 'block';
    emptyCart.style.display = 'none';
    
    // Render cart items
    const itemsHTML = serverCart.map(item => {
        return `
            <div class="cart-item">
                <div class="cart-item__image">
                    <img src="${imageForProductName(item.name)}" alt="${item.name}" onerror="handleImgFallback(this, '${encodeURIComponent(item.name)}')">
                </div>
                <div class="cart-item__details">
                    <h4 class="cart-item__name">${item.name}</h4>
                    <p class="cart-item__variant">${item.size ? `Size: ${item.size}` : ''} ${item.color ? `| Color: ${item.color}` : ''}</p>
                    <p class="cart-item__price">$${Number(item.price || 0).toFixed(2)}</p>
                </div>
                <div class="cart-item__quantity">
                    <button class="quantity-btn" onclick="updateServerQuantity('${item._id}', ${Math.max(1, (item.quantity||1) - 1)})">
                        <i class='bx bx-minus'></i>
                    </button>
                    <span class="quantity-number">${item.quantity || 1}</span>
                    <button class="quantity-btn" onclick="updateServerQuantity('${item._id}', ${(item.quantity||1) + 1})">
                        <i class='bx bx-plus'></i>
                    </button>
                </div>
                <div class="cart-item__total">
                    $${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                </div>
                <button class="cart-item__remove" onclick="removeServerItem('${item._id}')">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
        `;
    }).join('');
    
    cartItems.innerHTML = itemsHTML;
    
    // Update summary
    updateCartSummary(serverCart);
}

function updateCartSummary(serverCart) {
    const subtotal = (serverCart || []).reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
    const shipping = 9.99;
    const total = subtotal + shipping;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function proceedToCheckout() {
    if (!Array.isArray(currentServerCart) || currentServerCart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    window.location.href = 'checkout.html';
}

async function updateServerQuantity(id, quantity) {
    try {
        await CartAPI.update(id, quantity);
        await renderCart();
    } catch(e) { alert('Failed to update quantity'); }
}

async function removeServerItem(id) {
    try {
        await CartAPI.remove(id);
        await renderCart();
    } catch(e) { alert('Failed to remove item'); }
}

// end


