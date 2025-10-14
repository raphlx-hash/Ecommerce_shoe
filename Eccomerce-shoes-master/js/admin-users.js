document.addEventListener('DOMContentLoaded', async () => {
  await loadUsers();
});

async function loadUsers() {
  try {
    const users = await AdminAPI.listUsers();
    const tbody = document.getElementById('users-table-body');
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="5">No users found</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u._id}</td>
        <td>${(u.firstName || '') + ' ' + (u.lastName || '')}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${new Date(u.createdAt).toLocaleString()}</td>
      </tr>
    `).join('');
  } catch (e) {
    alert('Failed to load users');
  }
}

async function exportTotalsReport() {
  const stats = await AdminAPI.stats();
  const w = window.open('', '_blank', 'width=800,height=600');
  const html = `
  <html><head><title>Totals Report</title></head><body>
  <h1>Totals Report</h1>
  <ul>
    <li>Total Products: ${stats.products ?? 0}</li>
    <li>Total Orders: ${stats.orders ?? 0}</li>
    <li>Total Users: ${stats.users ?? 0}</li>
    <li>Total Revenue: $${Number(stats.revenue || 0).toFixed(2)}</li>
  </ul>
  <script>window.print(); setTimeout(()=>window.close(), 500);<\/script>
  </body></html>`;
  w.document.open(); w.document.write(html); w.document.close();
}


