document.addEventListener('DOMContentLoaded', async () => {
  await loadNewProducts();
});

async function loadNewProducts() {
  const container = document.getElementById('new-products-container');
  try {
    const products = await ProductsAPI.list('category=new&sort=newest');
    if (!products || products.length === 0) {
      container.innerHTML = '<div class="no-results">No new products</div>';
      return;
    }
    container.innerHTML = products.map(p => `
      <article class="sneaker" data-id="${p._id}">
        <img src="${imageForProductName(p.name)}" alt="${p.name}" class="sneaker__img" onerror="handleImgFallback(this, '${encodeURIComponent(p.name)}')">
        <span class="sneaker__name">${p.name}</span>
        <span class="sneaker__preci">$${Number(p.price).toFixed(2)}</span>
        <a href="#" class="button-light">Add To Cart<i class='bx bx-right-arrow-alt button-icon'></i></a>
      </article>
    `).join('');

    container.querySelectorAll('.sneaker').forEach(card => {
      const id = card.getAttribute('data-id');
      card.addEventListener('click', () => goToProduct(id));
      const btn = card.querySelector('.button-light');
      if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); goToProduct(id); });
    });
  } catch (e) {
    container.innerHTML = '<div class="no-results">Failed to load products</div>';
  }
}


