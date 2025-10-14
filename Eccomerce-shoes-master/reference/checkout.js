// Checkout page functionality
let currentStep = 1;
let checkoutData = {
    shipping: {},
    payment: {},
    order: {}
};

document.addEventListener('DOMContentLoaded', async function() {
    // Wait for database to be ready
    if (typeof db !== 'undefined') {
        await db.init();
    }
    
    // Redirect to cart if empty
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    initializeCheckout();
    updateCartCounter();
    loadOrderSummary();
});

function initializeCheckout() {
    // Initialize step navigation
    const nextBtn = document.getElementById('next-btn');
    const backBtn = document.getElementById('back-btn');
    const placeOrderBtn = document.getElementById('place-order-btn');
    
    nextBtn.addEventListener('click', nextStep);
    backBtn.addEventListener('click', prevStep);
    placeOrderBtn.addEventListener('click', placeOrder);
    
    // Initialize step indicators
    updateStepIndicators();
    
    // Load order summary
    loadOrderSummary();
}

function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < 3) {
            currentStep++;
            showStep(currentStep);
            updateStepIndicators();
            updateNavigationButtons();
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateStepIndicators();
        updateNavigationButtons();
    }
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.checkout__step').forEach(stepEl => {
        stepEl.style.display = 'none';
    });
    
    // Show current step
    document.getElementById(`step-${step}`).style.display = 'block';
}

function updateStepIndicators() {
    document.querySelectorAll('.step').forEach(step => {
        const stepNumber = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');
        
        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
}

function updateNavigationButtons() {
    const nextBtn = document.getElementById('next-btn');
    const backBtn = document.getElementById('back-btn');
    const placeOrderBtn = document.getElementById('place-order-btn');
    
    // Show/hide back button
    backBtn.style.display = currentStep > 1 ? 'block' : 'none';
    
    // Update next/place order button
    if (currentStep === 3) {
        nextBtn.style.display = 'none';
        placeOrderBtn.style.display = 'block';
        placeOrderBtn.textContent = 'Place Order';
    } else if (currentStep === 2) {
        nextBtn.style.display = 'block';
        nextBtn.textContent = 'Review Order';
        placeOrderBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'block';
        nextBtn.textContent = 'Continue to Payment';
        placeOrderBtn.style.display = 'none';
    }
}

function validateCurrentStep() {
    if (currentStep === 1) {
        return validateShippingForm();
    } else if (currentStep === 2) {
        return validatePaymentForm();
    }
    return true;
}

function validateShippingForm() {
    const requiredFields = ['email', 'first-name', 'last-name', 'address', 'city', 'state', 'zip', 'phone'];
    let isValid = true;
    
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!field || !field.value.trim()) {
            if (field) field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    // Email validation
    const emailField = document.getElementById('email');
    if (emailField) {
        const email = emailField.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailField.classList.add('error');
            isValid = false;
        }
    }
    
    if (!isValid) {
        showNotification('Please fill in all required fields correctly.', 'error');
    } else {
        // Save shipping data
        checkoutData.shipping = {
            email: document.getElementById('email').value,
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zip: document.getElementById('zip').value,
            phone: document.getElementById('phone').value,
            saveAddress: document.getElementById('save-address') ? document.getElementById('save-address').checked : false
        };
    }
    
    return isValid;
}

function validatePaymentForm() {
    const requiredFields = ['card-number', 'expiry', 'cvv', 'card-name'];
    let isValid = true;
    
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!field || !field.value.trim()) {
            if (field) field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    // Card number validation (basic)
    const cardNumberField = document.getElementById('card-number');
    if (cardNumberField) {
        const cardNumber = cardNumberField.value.replace(/\s/g, '');
        if (cardNumber.length < 13 || cardNumber.length > 19) {
            cardNumberField.classList.add('error');
            isValid = false;
        }
    }
    
    // Expiry date validation
    const expiryField = document.getElementById('expiry');
    if (expiryField) {
        const expiry = expiryField.value;
        const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!expiryRegex.test(expiry)) {
            expiryField.classList.add('error');
            isValid = false;
        }
    }
    
    // CVV validation
    const cvvField = document.getElementById('cvv');
    if (cvvField) {
        const cvv = cvvField.value;
        if (cvv.length < 3 || cvv.length > 4) {
            cvvField.classList.add('error');
            isValid = false;
        }
    }
    
    if (!isValid) {
        showNotification('Please fill in all payment fields correctly.', 'error');
    } else {
        // Save payment data (in real app, this would be encrypted)
        checkoutData.payment = {
            cardNumber: document.getElementById('card-number').value,
            expiry: document.getElementById('expiry').value,
            cvv: document.getElementById('cvv').value,
            cardName: document.getElementById('card-name').value,
            savePayment: document.getElementById('save-payment') ? document.getElementById('save-payment').checked : false
        };
    }
    
    return isValid;
}

function loadOrderSummary() {
    const summaryItems = document.getElementById('summary-items');
    const orderItems = document.getElementById('order-items');
    
    if (cart.length === 0) {
        summaryItems.innerHTML = '<p>No items in cart</p>';
        return;
    }
    
    // Calculate totals
    const subtotal = getCartTotal();
    const shipping = 9.99;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;
    
    // Update summary totals
    document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('summary-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `$${total.toFixed(2)}`;
    
    // Update order totals (step 3)
    document.getElementById('order-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('order-shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('order-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('order-total').textContent = `$${total.toFixed(2)}`;
    
    // Render items
    const itemsHTML = cart.map(item => `
        <div class="checkout-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="checkout-item__details">
                <h4>${item.name}</h4>
                <p>Size: ${item.size} | Color: ${item.color}</p>
                <p>Quantity: ${item.quantity}</p>
            </div>
            <div class="checkout-item__price">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
        </div>
    `).join('');
    
    summaryItems.innerHTML = itemsHTML;
    if (orderItems) {
        orderItems.innerHTML = itemsHTML;
    }
}

function placeOrder() {
    if (!validateCurrentStep()) {
        return;
    }
    
    // Create order object
    const order = {
        id: generateOrderId(),
        date: new Date().toISOString(),
        items: [...cart],
        shipping: checkoutData.shipping,
        payment: {
            ...checkoutData.payment,
            cardNumber: '**** **** **** ' + checkoutData.payment.cardNumber.slice(-4)
        },
        totals: {
            subtotal: getCartTotal(),
            shipping: 9.99,
            tax: getCartTotal() * 0.08,
            total: getCartTotal() + 9.99 + (getCartTotal() * 0.08)
        },
        status: 'processing'
    };
    
    // Save order to localStorage (in real app, this would go to server)
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Redirect to success page
    window.location.href = `order-success.html?orderId=${order.id}`;
}

function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
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
    }, 4000);
}

// Format card number input
document.addEventListener('DOMContentLoaded', function() {
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    // Format expiry input
    const expiryInput = document.getElementById('expiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
});
