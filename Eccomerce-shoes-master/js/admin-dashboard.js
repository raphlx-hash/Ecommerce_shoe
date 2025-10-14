document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadRecentOrders();
});

async function loadStats() {
  try {
    const stats = await AdminAPI.stats();
    document.getElementById('total-products').textContent = stats.products ?? 0;
    document.getElementById('total-orders').textContent = stats.orders ?? 0;
    document.getElementById('total-users').textContent = stats.users ?? 0;
    document.getElementById('total-revenue').textContent = `$${Number(stats.revenue || 0).toFixed(2)}`;
  } catch (e) {
    console.error(e);
  }
}

async function loadRecentOrders() {
  try {
    const orders = await AdminAPI.listOrders();
    const recent = orders.slice(0, 5);
    const el = document.getElementById('recent-orders');
    if (!recent.length) {
      el.innerHTML = '<p>No orders found</p>';
      return;
    }
    el.innerHTML = recent.map(order => `
      <div class="activity__item">
        <div class="activity__info">
          <h4>Order #${order.orderNumber || order._id?.slice(-6)}</h4>
          <p>${order.shipping?.firstName || ''} ${order.shipping?.lastName || ''}</p>
        </div>
        <div class="activity__details">
          <span class="activity__date">${new Date(order.createdAt || order.updatedAt).toLocaleString()}</span>
          <span class="activity__amount">$${Number(order.totals?.total || 0).toFixed(2)}</span>
          <span class="activity__status status-${order.status}">${order.status}</span>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

async function exportTotalsReport() {
  try {
    const stats = await AdminAPI.stats();
    const reportWindow = window.open('', '_blank', 'width=800,height=600');
    const html = `
      <html>
        <head>
          <title>Ropy Admin - Totals Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin: 0 0 16px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .card { border: 1px solid #ddd; padding: 16px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>Totals Report</h1>
          <div class="grid">
            <div class="card"><strong>Total Products:</strong> ${stats.products ?? 0}</div>
            <div class="card"><strong>Total Orders:</strong> ${stats.orders ?? 0}</div>
            <div class="card"><strong>Total Users:</strong> ${stats.users ?? 0}</div>
            <div class="card"><strong>Total Revenue:</strong> $${Number(stats.revenue || 0).toFixed(2)}</div>
          </div>
          <script>window.print(); setTimeout(()=>window.close(), 500);<\/script>
        </body>
      </html>
    `;
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  } catch (e) {
    alert('Failed to export report');
  }
}


