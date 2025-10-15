document.addEventListener('DOMContentLoaded', async () => {
  await loadOrders();
});

async function loadOrders() {
  const tbody = document.getElementById('orders-tbody');
  try {
    // Validate username from session
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      tbody.innerHTML = '<tr><td colspan="6">Please log in to view your orders.</td></tr>';
      return;
    }
    const username = currentUser.firstName || currentUser.username || currentUser.email;

    // Fetch orders by username
    const orders = await OrdersAPI.list(username);
    if (!orders || orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No orders found</td></tr>';
      return;
    }

    // Build table rows
    const rows = orders.flatMap(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      const orderSubtotal = Number(o?.totals?.subtotal || 0);
      if (items.length === 0) {
        return [`
          <tr>
            <td>${o._id}</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>$${orderSubtotal.toFixed(2)}</td>
            <td>${o.status || 'processing'}</td>
            <td>${o.expectedDeliveryText || 'within 7 days from order'}</td>
          </tr>
        `];
      }
      return items.map((it) => {
        const name = it.name || 'Product';
        const thumb = imageForProductName(name);
        const unit = Number(it.price || 0);
        const qty = Number(it.quantity || 1);
        const line = unit * qty;
        const sizeColor = [it.size ? `Size: ${it.size}` : null, it.color ? `Color: ${it.color}` : null].filter(Boolean).join(' | ');
        return `
          <tr>
            <td>${o._id}</td>
            <td><img src="${thumb}" alt="${name}" class="order-thumb" onerror="handleImgFallback(this, '${encodeURIComponent(name)}')"></td>
            <td>${name}</td>
            <td>${sizeColor || '-'}</td>
            <td>$${unit.toFixed(2)}</td>
            <td>${qty}</td>
            <td>$${line.toFixed(2)}</td>
            <td>$${orderSubtotal.toFixed(2)}</td>
            <td>${o.status || 'processing'}</td>
            <td>${o.expectedDeliveryText || 'within 7 days from order'}</td>
          </tr>
        `;
      });
    }).join('');

    tbody.innerHTML = rows;
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6">Failed to load orders</td></tr>';
  }
}


