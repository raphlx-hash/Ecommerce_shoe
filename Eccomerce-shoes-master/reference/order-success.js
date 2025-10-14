// Order success page functionality
document.addEventListener('DOMContentLoaded', function() {
    loadOrderDetails();
    updateCartCounter();
});

function loadOrderDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (!orderId) {
        // Redirect to home if no order ID
        window.location.href = 'index.html';
        return;
    }
    
    // Get order from localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        // Redirect to home if order not found
        window.location.href = 'index.html';
        return;
    }
    
    // Display order information
    document.getElementById('order-number').textContent = order.id;
    document.getElementById('order-date').textContent = formatDate(order.date);
    document.getElementById('order-total').textContent = `$${order.totals.total.toFixed(2)}`;
    
    // Calculate delivery date (3-5 business days)
    const deliveryDate = new Date(order.date);
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    document.getElementById('delivery-date').textContent = formatDate(deliveryDate.toISOString());
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function printOrder() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (!orderId) return;
    
    // Get order details
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    // Create print content
    const printContent = `
        <html>
            <head>
                <title>Order Receipt - ${order.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .order-info { margin-bottom: 20px; }
                    .items { margin-bottom: 20px; }
                    .item { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .totals { border-top: 1px solid #ccc; padding-top: 10px; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .total-row.total { font-weight: bold; font-size: 1.2em; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Ropy</h1>
                    <h2>Order Receipt</h2>
                </div>
                
                <div class="order-info">
                    <p><strong>Order Number:</strong> ${order.id}</p>
                    <p><strong>Order Date:</strong> ${formatDate(order.date)}</p>
                    <p><strong>Shipping Address:</strong></p>
                    <p>${order.shipping.firstName} ${order.shipping.lastName}<br>
                    ${order.shipping.address}<br>
                    ${order.shipping.city}, ${order.shipping.state} ${order.shipping.zip}</p>
                </div>
                
                <div class="items">
                    <h3>Order Items:</h3>
                    ${order.items.map(item => `
                        <div class="item">
                            <span>${item.name} (${item.size}, ${item.color}) x${item.quantity}</span>
                            <span>$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="totals">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>$${order.totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Shipping:</span>
                        <span>$${order.totals.shipping.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Tax:</span>
                        <span>$${order.totals.tax.toFixed(2)}</span>
                    </div>
                    <div class="total-row total">
                        <span>Total:</span>
                        <span>$${order.totals.total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                    <p>Thank you for your purchase!</p>
                    <p>Estimated delivery: ${formatDate(new Date(order.date).setDate(new Date(order.date).getDate() + 5))}</p>
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
