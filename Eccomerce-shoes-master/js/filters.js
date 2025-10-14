// Filtering and sorting functionality for shop page
let filteredProducts = [];
let currentFilters = {
    category: '',
    price: '',
    brand: '',
    sort: 'name'
};

document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    renderProducts();
});

function initializeFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const brandFilter = document.getElementById('brand-filter');
    const sortFilter = document.getElementById('sort-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentFilters.category = this.value;
            applyFilters();
        });
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', function() {
            currentFilters.price = this.value;
            applyFilters();
        });
    }
    
    if (brandFilter) {
        brandFilter.addEventListener('change', function() {
            currentFilters.brand = this.value;
            applyFilters();
        });
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            currentFilters.sort = this.value;
            applyFilters();
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
}

async function applyFilters() {
    const params = new URLSearchParams();
    if (currentFilters.category) params.set('category', currentFilters.category);
    if (currentFilters.brand) params.set('brand', currentFilters.brand);
    if (currentFilters.sort) params.set('sort', currentFilters.sort);

    // Price range client-side filter after fetch
    let list = [];
    try {
        list = await ProductsAPI.list(params.toString());
    } catch (e) {
        list = [];
    }

    if (currentFilters.price) {
        const [min, max] = currentFilters.price.split('-').map(Number);
        list = list.filter(product => {
            if (currentFilters.price === '200+') return product.price >= 200;
            return product.price >= min && product.price <= max;
        });
    }

    filteredProducts = list;
    renderProducts();
}

function clearFilters() {
    currentFilters = {
        category: '',
        price: '',
        brand: '',
        sort: 'name'
    };
    
    // Reset all filter selects
    document.getElementById('category-filter').value = '';
    document.getElementById('price-filter').value = '';
    const brandEl = document.getElementById('brand-filter');
    if (brandEl) brandEl.value = '';
    document.getElementById('sort-filter').value = 'name';
    
    applyFilters();
}

function renderProducts() {
    const container = document.getElementById('products-container');
    const productCount = document.getElementById('product-count');
    
    if (!container) return;
    
    // Update product count
    if (productCount) {
        productCount.textContent = `(${filteredProducts.length} items)`;
    }
    
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class='bx bx-search-alt'></i>
                <h3>No products found</h3>
                <p>Try adjusting your filters to see more products.</p>
                <button class="button" onclick="clearFilters()">Clear Filters</button>
            </div>
        `;
        return;
    }
    
    // Render filtered products
    const productsHTML = filteredProducts.map(product => `
        <article class="sneaker" onclick="goToProduct('${product._id}')">
            <img src="${imageForProductName(product.name)}" alt="${product.name}" class="sneaker__img" onerror="handleImgFallback(this, '${encodeURIComponent(product.name)}')">
            <span class="sneaker__name">${product.name}</span>
            <span class="sneaker__preci">$${Number(product.price).toFixed(2)}</span>
            <a href="#" class="button-light" onclick="event.stopPropagation(); goToProduct('${product._id}')">
                Add To Cart<i class='bx bx-right-arrow-alt button-icon'></i>
            </a>
        </article>
    `).join('');
    
    container.innerHTML = productsHTML;
}

// Remove quick filters entirely

document.addEventListener('DOMContentLoaded', function() {
    // initial load with URL params
    const url = new URL(window.location.href);
    const brand = url.searchParams.get('brand');
    if (brand) {
        currentFilters.brand = brand;
        const brandEl = document.getElementById('brand-filter');
        if (brandEl) brandEl.value = brand;
    }
    applyFilters();
});
