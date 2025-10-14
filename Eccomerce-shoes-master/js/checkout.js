// Checkout page functionality
let currentStep = 1;
let checkoutData = {
    shipping: {},
    payment: {},
    order: {}
};
let checkoutCart = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Require login
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) { window.location.href = 'auth.html'; return; }
    const userName = currentUser.firstName || currentUser.username || currentUser.email;

    // Fetch cart from backend; redirect to cart if empty
    try {
        checkoutCart = await CartAPI.list(userName);
    } catch(e) { checkoutCart = []; }
    if (!checkoutCart || checkoutCart.length === 0) { window.location.href = 'cart.html'; return; }

    initializeCheckout();
    if (typeof updateCartCounter === 'function') updateCartCounter();
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
    
    // Email validation + backend check
    const emailField = document.getElementById('email');
    if (emailField) {
        const email = emailField.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailField.classList.add('error');
            isValid = false;
        }
    }
    
    // Phone: exactly 10 digits
    const phoneField = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');
    if (phoneField) {
        const digitsOnly = (phoneField.value || '').replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
            phoneField.classList.add('error');
            if (phoneError) phoneError.style.display = 'block';
            isValid = false;
        } else {
            phoneField.classList.remove('error');
            if (phoneError) phoneError.style.display = 'none';
        }
    }
    
    if (!isValid) {
        showNotification('Please fill in all required fields correctly.', 'error');
    } else {
        // Verify email exists in backend users collection
        // Note: this call is made synchronously from nextStep() via validateCurrentStep(); we keep minimal latency
        // The emailExists check will be re-run below if needed
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

// Override nextStep to include async email existence validation
const _nextStepOriginal = nextStep;
nextStep = async function() {
    if (currentStep === 1) {
        if (!validateShippingForm()) return;
        // Backend email existence validation
        const email = (document.getElementById('email')?.value || '').trim();
        try {
            const resp = await AuthAPI.emailExists(email);
            if (!resp?.exists) {
                showNotification('Email not found. Please use your registered email.', 'error');
                document.getElementById('email')?.classList.add('error');
                return;
            }
        } catch(e) {
            showNotification('Failed to validate email. Please try again.', 'error');
            return;
        }
    }
    if (currentStep < 3) {
        currentStep++;
        showStep(currentStep);
        updateStepIndicators();
        updateNavigationButtons();
    }
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
    
    // Card number validation: exactly 16 digits
    const cardNumberField = document.getElementById('card-number');
    const cardNumberError = document.getElementById('card-number-error');
    if (cardNumberField) {
        const digits = cardNumberField.value.replace(/\D/g, '');
        if (digits.length !== 16) {
            cardNumberField.classList.add('error');
            if (cardNumberError) cardNumberError.style.display = 'block';
            isValid = false;
        } else {
            cardNumberField.classList.remove('error');
            if (cardNumberError) cardNumberError.style.display = 'none';
        }
    }
    
    // Expiry date validation
    const expiryField = document.getElementById('expiry');
    const expiryError = document.getElementById('expiry-error');
    if (expiryField) {
        const expiry = expiryField.value;
        const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!expiryRegex.test(expiry)) {
            expiryField.classList.add('error');
            if (expiryError) expiryError.style.display = 'block';
            isValid = false;
        } else {
            // Check not in the past
            const [mmStr, yyStr] = expiry.split('/');
            const mm = Number(mmStr);
            const yy = Number(yyStr);
            const now = new Date();
            const currentYY = now.getFullYear() % 100; // last two digits
            const currentMM = now.getMonth() + 1; // 1-12
            const isPast = yy < currentYY || (yy === currentYY && mm < currentMM);
            if (isPast) {
                expiryField.classList.add('error');
                if (expiryError) expiryError.style.display = 'block';
                isValid = false;
            } else {
                expiryField.classList.remove('error');
                if (expiryError) expiryError.style.display = 'none';
            }
        }
    }
    
    // CVV validation: exactly 3 digits
    const cvvField = document.getElementById('cvv');
    const cvvError = document.getElementById('cvv-error');
    if (cvvField) {
        const digits = (cvvField.value || '').replace(/\D/g, '');
        if (digits.length !== 3) {
            cvvField.classList.add('error');
            if (cvvError) cvvError.style.display = 'block';
            isValid = false;
        } else {
            cvvField.classList.remove('error');
            if (cvvError) cvvError.style.display = 'none';
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
    const items = Array.isArray(checkoutCart) ? checkoutCart : [];
    if (items.length === 0) { summaryItems.innerHTML = '<p>No items in cart</p>'; return; }

    // Calculate totals
    const subtotal = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
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
    
    // Render items (structured columns: product, unit, qty, line total)
    const itemsHTML = items.map(item => {
        const unit = Number(item.price || 0);
        const qty = Number(item.quantity || 1);
        const line = unit * qty;
        return `
        <div class="summary__row">
            <div class="summary__col col--product">
                <img class="summary__thumb" src="${imageForProductName(item.name)}" alt="${item.name}" onerror="handleImgFallback(this, '${encodeURIComponent(item.name)}')">
                <div class="summary__info">
                    <h4>${item.name}</h4>
                    <p>${item.size ? `Size: ${item.size}` : ''} ${item.color ? `| Color: ${item.color}` : ''}</p>
                </div>
            </div>
            <div class="summary__col col--unit">$${unit.toFixed(2)}</div>
            <div class="summary__col col--qty">${qty}</div>
            <div class="summary__col col--line">$${line.toFixed(2)}</div>
        </div>`;
    }).join('');

    summaryItems.innerHTML = itemsHTML;

    // Review step uses a similar layout (no header already present there)
    if (orderItems) {
        const reviewItemsHTML = items.map(item => {
            const unit = Number(item.price || 0);
            const qty = Number(item.quantity || 1);
            const line = unit * qty;
            return `
            <div class="summary__row summary__row--review">
                <div class="summary__col col--product">
                    <img class="summary__thumb" src="${imageForProductName(item.name)}" alt="${item.name}" onerror="handleImgFallback(this, '${encodeURIComponent(item.name)}')">
                    <div class="summary__info">
                        <h4>${item.name}</h4>
                        <p>${item.size ? `Size: ${item.size}` : ''} ${item.color ? `| Color: ${item.color}` : ''}</p>
                    </div>
                </div>
                <div class="summary__col col--unit">$${unit.toFixed(2)}</div>
                <div class="summary__col col--qty">${qty}</div>
                <div class="summary__col col--line">$${line.toFixed(2)}</div>
            </div>`;
        }).join('');
        orderItems.innerHTML = reviewItemsHTML;
    }
}

function placeOrder() {
    if (!validateCurrentStep()) {
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const username = currentUser ? (currentUser.firstName || currentUser.username || currentUser.email) : 'Guest';

    const items = (checkoutCart || []).map(it => ({
        productId: it.productId || it._id,
        name: it.name,
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        size: it.size,
        color: it.color,
        image: it.image,
    }));

    const subtotal = items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);

    const payload = {
        username,
        items,
        subtotal,
        shipping: {
            email: checkoutData.shipping?.email,
            firstName: checkoutData.shipping?.firstName,
            lastName: checkoutData.shipping?.lastName,
            address: checkoutData.shipping?.address,
            city: checkoutData.shipping?.city,
            state: checkoutData.shipping?.state,
            zip: checkoutData.shipping?.zip,
            phone: checkoutData.shipping?.phone,
        }
    };

    // Create order in backend then redirect
    OrdersAPI.create(payload)
        .then((resp) => {
            const orderId = resp?.id || resp?._id || '';
            try {
                const snapshot = {
                    id: orderId,
                    orderNumber: resp?.orderNumber || orderId,
                    createdAt: new Date().toISOString(),
                    totals: {
                        subtotal,
                        shipping: 9.99,
                        tax: Number((subtotal * 0.08).toFixed(2)),
                        total: Number((subtotal + 9.99 + subtotal * 0.08).toFixed(2))
                    },
                    shipping: payload.shipping,
                    items,
                    expectedDeliveryText: resp?.expectedDeliveryText || 'within 7 days from order'
                };
                sessionStorage.setItem('lastOrder', JSON.stringify(snapshot));
            } catch {}
            window.location.href = `order-success.html?orderId=${encodeURIComponent(orderId)}`;
        })
        .catch(() => {
            showNotification('Failed to place order. Please try again.', 'error');
        });
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
            let value = e.target.value.replace(/\D/g, '').slice(0, 16);
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
        cardNumberInput.addEventListener('blur', function(e) {
            const err = document.getElementById('card-number-error');
            const digits = e.target.value.replace(/\D/g, '');
            if (digits.length !== 16) {
                e.target.classList.add('error');
                if (err) err.style.display = 'block';
            } else {
                e.target.classList.remove('error');
                if (err) err.style.display = 'none';
            }
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
        expiryInput.addEventListener('blur', function(e) {
            const err = document.getElementById('expiry-error');
            const value = e.target.value;
            const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
            if (!regex.test(value)) {
                e.target.classList.add('error');
                if (err) err.style.display = 'block';
                return;
            }
            const [mmStr, yyStr] = value.split('/');
            const mm = Number(mmStr);
            const yy = Number(yyStr);
            const now = new Date();
            const currentYY = now.getFullYear() % 100;
            const currentMM = now.getMonth() + 1;
            const isPast = yy < currentYY || (yy === currentYY && mm < currentMM);
            if (isPast) {
                e.target.classList.add('error');
                if (err) err.style.display = 'block';
            } else {
                e.target.classList.remove('error');
                if (err) err.style.display = 'none';
            }
        });
    }
    
    // Enforce 10-digit phone input: filter non-digits and cap at 10
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 10);
            e.target.value = digits;
            if (digits.length === 10) {
                e.target.classList.remove('error');
                if (phoneError) phoneError.style.display = 'none';
            }
        });
        phoneInput.addEventListener('blur', function(e) {
            const digits = (e.target.value || '').replace(/\D/g, '');
            if (digits.length !== 10) {
                e.target.classList.add('error');
                if (phoneError) phoneError.style.display = 'block';
            } else {
                e.target.classList.remove('error');
                if (phoneError) phoneError.style.display = 'none';
            }
        });
    }

    // Enforce 3-digit CVV
    const cvvInput = document.getElementById('cvv');
    const cvvErrorEl = document.getElementById('cvv-error');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 3);
            e.target.value = digits;
            if (digits.length === 3) {
                e.target.classList.remove('error');
                if (cvvErrorEl) cvvErrorEl.style.display = 'none';
            }
        });
        cvvInput.addEventListener('blur', function(e) {
            const digits = (e.target.value || '').replace(/\D/g, '');
            if (digits.length !== 3) {
                e.target.classList.add('error');
                if (cvvErrorEl) cvvErrorEl.style.display = 'block';
            } else {
                e.target.classList.remove('error');
                if (cvvErrorEl) cvvErrorEl.style.display = 'none';
            }
        });
    }
});
