document.addEventListener('DOMContentLoaded', async () => {
  await loadWishlist();
});

async function loadWishlist() {
  const container = document.getElementById('wishlist-container');
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      container.innerHTML = '<div class="no-results">Please log in to view your wishlist.</div>';
      return;
    }
    const username = currentUser.firstName || currentUser.username || currentUser.email;
    const items = await WishlistAPI.list(username);
    if (!items || items.length === 0) {
      container.innerHTML = '<div class="no-results">No wishlist items</div>';
      return;
    }
    const resolved = await Promise.all(items.map(async (w) => {
      const name = w.name || 'Product';
      let id = w.productId || null;
      if (!id) {
        try {
          const results = await ProductsAPI.list(`q=${encodeURIComponent(name)}`);
          if (Array.isArray(results) && results.length > 0) id = results[0]._id;
        } catch {}
      }
      return { id, name, price: Number(w.price || 0) };
    }));

    container.innerHTML = resolved.map(p => {
      const cardAttrs = p.id ? `data-id="${p.id}"` : '';
      return `
        <article class="sneaker" ${cardAttrs}>
          <img src="${imageForProductName(p.name)}" alt="${p.name}" class="sneaker__img" onerror="handleImgFallback(this, '${encodeURIComponent(p.name)}')">
          <span class="sneaker__name">${p.name}</span>
          <span class="sneaker__preci">$${p.price.toFixed(2)}</span>
          <a href="#" class="button-light">View<i class='bx bx-right-arrow-alt button-icon'></i></a>
        </article>
      `;
    }).join('');

    container.querySelectorAll('.sneaker').forEach(card => {
      const id = card.getAttribute('data-id');
      if (id) {
        card.addEventListener('click', () => goToProduct(id));
        const btn = card.querySelector('.button-light');
        if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); goToProduct(id); });
      }
    });
  } catch (e) {
    container.innerHTML = '<div class="no-results">Failed to load wishlist</div>';
  }
}


