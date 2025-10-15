// Order success page functionality
document.addEventListener('DOMContentLoaded', async function() {
    await loadOrderDetails();
    if (typeof updateCartCounter === 'function') updateCartCounter();
});

async function loadOrderDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (!orderId) {
        // Redirect to home if no order ID
        window.location.href = 'index.html';
        return;
    }
    
    // Use snapshot from checkout for immediate rendering
    try {
        const snap = JSON.parse(sessionStorage.getItem('lastOrder') || 'null');
        if (snap && (String(snap.id) === String(orderId) || String(snap.orderNumber) === String(orderId))) {
            renderOrder(snap);
            return;
        }
    } catch {}

    // Try to fetch order from backend first
    let order = null;
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const username = currentUser ? (currentUser.firstName || currentUser.username || currentUser.email) : '';
        const list = await OrdersAPI.list(username);
        order = (list || []).find(o => String(o._id) === String(orderId) || String(o.id) === String(orderId));
    } catch (e) {
        order = null;
    }
    // Fallback: localStorage (legacy flow)
    if (!order) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        order = orders.find(o => o.id === orderId);
    }
    
    if (!order) {
        // Redirect to home if order not found
        window.location.href = 'index.html';
        return;
    }
    
    renderOrder(order);
}

function renderOrder(order) {
    const orderNumber = order.orderNumber || order._id || order.id;
    const createdAt = order.createdAt || order.date || new Date().toISOString();
    const totals = order.totals || {};
    document.getElementById('order-number').textContent = orderNumber;
    document.getElementById('order-date').textContent = formatDate(createdAt);
    document.getElementById('order-total').textContent = `$${Number(totals.total || 0).toFixed(2)}`;

    const eta = order.expectedDeliveryText || '';
    if (eta) {
        document.getElementById('delivery-date').textContent = eta;
    } else {
        const base = new Date(createdAt);
        base.setDate(base.getDate() + 5);
        document.getElementById('delivery-date').textContent = formatDate(base.toISOString());
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function printOrder() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (!orderId) return;
    
    // Get order details - try sessionStorage first, then backend, then localStorage
    let order = null;
    
    // Try sessionStorage snapshot first
    try {
        const snap = JSON.parse(sessionStorage.getItem('lastOrder') || 'null');
        if (snap && (String(snap.id) === String(orderId) || String(snap.orderNumber) === String(orderId))) {
            order = snap;
        }
    } catch {}
    
    // Try backend if not found in sessionStorage
    if (!order) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            const username = currentUser ? (currentUser.firstName || currentUser.username || currentUser.email) : '';
            const list = await OrdersAPI.list(username);
            order = (list || []).find(o => String(o._id) === String(orderId) || String(o.id) === String(orderId));
        } catch (e) {
            order = null;
        }
    }
    
    // Fallback to localStorage
    if (!order) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        order = orders.find(o => o.id === orderId);
    }
    
    if (!order) return;
    
    // Get username for display
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const username = currentUser ? (currentUser.firstName || currentUser.username || currentUser.email) : 'Guest';
    
    // Prepare order data
    const orderNumber = order.orderNumber || order._id || order.id;
    const orderDate = order.createdAt || order.date || new Date().toISOString();
    const totals = order.totals || {};
    const shipping = order.shipping || {};
    const items = order.items || [];
    const estimatedDelivery = order.expectedDeliveryText || formatDate(new Date(orderDate).setDate(new Date(orderDate).getDate() + 5));
    
    // Create print content
    const printContent = `
        <html>
            <head>
                <title>Order Receipt - ${orderNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .order-info { margin-bottom: 20px; }
                    .items { margin-bottom: 20px; }
                    .item { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .totals { border-top: 1px solid #ccc; padding-top: 10px; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .total-row.total { font-weight: bold; font-size: 1.2em; }
                    .customer-info { background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Ropy</h1>
                    <h2>Order Receipt</h2>
                </div>
                
                <div class="customer-info">
                    <p><strong>Customer:</strong> ${username}</p>
                    <p><strong>Order Number:</strong> ${orderNumber}</p>
                    <p><strong>Order Date:</strong> ${formatDate(orderDate)}</p>
                    <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
                </div>
                
                <div class="order-info">
                    <p><strong>Shipping Address:</strong></p>
                    <p>${shipping.firstName || ''} ${shipping.lastName || ''}<br>
                    ${shipping.address || ''}<br>
                    ${shipping.city || ''}, ${shipping.state || ''} ${shipping.zip || ''}</p>
                </div>
                
                <div class="items">
                    <h3>Order Items:</h3>
                    ${items.map(item => `
                        <div class="item">
                            <span>${item.name || 'N/A'} (${item.size || 'N/A'}, ${item.color || 'N/A'}) x${item.quantity || 1}</span>
                            <span>$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="totals">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>$${(totals.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Shipping:</span>
                        <span>$${(totals.shipping || 0).toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Tax:</span>
                        <span>$${(totals.tax || 0).toFixed(2)}</span>
                    </div>
                    <div class="total-row total">
                        <span>Total:</span>
                        <span>$${(totals.total || 0).toFixed(2)}</span>
                    </div>
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                    <p>Thank you for your purchase!</p>
                    <p>Estimated delivery: ${estimatedDelivery}</p>
                </div>
            </body>
        </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}
