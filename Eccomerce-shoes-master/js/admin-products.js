document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  const form = document.getElementById('product-form');
  form.addEventListener('submit', onSubmitProductForm);
});

async function loadProducts() {
  try {
    const products = await ProductsAPI.list();
    const tbody = document.getElementById('products-table-body');
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="6">No products found</td></tr>';
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td>${p._id}</td>
        <td>${p.name}</td>
        <td>${Array.isArray(p.category) ? p.category.join(', ') : (p.category || '')}</td>
        <td>$${Number(p.price).toFixed(2)}</td>
        <td>${(p.features || []).length}</td>
        <td>${Number(p.quantity || 0) === 0 ? 'Out of Stock' : Number(p.quantity)}</td>
        <td class="actions">
          <button class="btn-edit" onclick="editProduct('${p._id}')">Edit</button>
          <button class="btn-delete" onclick="deleteProduct('${p._id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    alert('Failed to load products');
  }
}

function resolveImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${API_BASE_URL.replace('/api','')}${path}`;
  return path;
}

function showAddProductForm() {
  document.getElementById('modal-title').textContent = 'Add New Product';
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  document.getElementById('product-modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('product-modal').style.display = 'none';
}

async function editProduct(id) {
  const p = await ProductsAPI.get(id);
  document.getElementById('modal-title').textContent = 'Edit Product';
  document.getElementById('product-id').value = p._id;
  document.getElementById('product-name').value = p.name;
  document.getElementById('product-price').value = p.price;
  document.getElementById('product-original-price').value = p.originalPrice || '';
  document.getElementById('product-quantity').value = p.quantity || 0;
  document.getElementById('product-instock').checked = p.inStock !== false;
  // Handle categories - convert string to array if needed
  const categories = Array.isArray(p.category) ? p.category : (p.category ? [p.category] : []);
  const categoryCheckboxes = document.querySelectorAll('#product-categories input[type="checkbox"]');
  categoryCheckboxes.forEach(cb => {
    cb.checked = categories.includes(cb.value);
  });
  document.getElementById('product-description').value = p.description || '';
  document.getElementById('product-brand').value = p.brand || '';
  
  const featuresWrap = document.getElementById('product-features');
  const features = p.features || [];
  Array.from(featuresWrap.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
    cb.checked = features.includes(cb.value);
  });
  document.getElementById('product-sizes').value = (p.sizes || []).join(', ');
  document.getElementById('product-colors').value = (p.colors || []).join(', ');
  document.getElementById('product-modal').style.display = 'block';
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  await ProductsAPI.remove(id);
  await loadProducts();
}

async function onSubmitProductForm(e) {
  e.preventDefault();
  const id = document.getElementById('product-id').value;
  const payload = {
    name: document.getElementById('product-name').value,
    price: document.getElementById('product-price').value,
    originalPrice: document.getElementById('product-original-price').value,
    quantity: document.getElementById('product-quantity').value,
    inStock: document.getElementById('product-instock').checked,
    category: Array.from(document.querySelectorAll('#product-categories input[type="checkbox"]:checked')).map(cb => cb.value),
    description: document.getElementById('product-description').value,
    brand: document.getElementById('product-brand').value,
    features: Array.from(document.querySelectorAll('#product-features input[type="checkbox"]:checked')).map(cb=>cb.value),
    sizes: document.getElementById('product-sizes').value.split(',').map(s=>s.trim()).filter(Boolean),
    colors: document.getElementById('product-colors').value.split(',').map(s=>s.trim()).filter(Boolean),
  };
  

  if (id) await ProductsAPI.update(id, payload); else await ProductsAPI.create(payload);
  closeModal();
  await loadProducts();
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


