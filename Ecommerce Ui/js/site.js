/**
 * js/site.js — Shopify Frontend Application
 *
 * Routing: each HTML page carries  data-page="PageName"  on <body>.
 * DOMContentLoaded dispatches to the matching init function.
 *
 * Data is stored in localStorage (keyed with "sf_") and session state in
 * sessionStorage so a page refresh keeps the user logged in but closing
 * the tab logs them out.
 */

'use strict';

/* =====================================================================
   DATA LAYER  — localStorage wrappers
   ===================================================================== */

function _get(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function _set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

const Store = {
  getUsers:     ()  => _get('sf_users',    []),
  saveUsers:    (v) => _set('sf_users',    v),
  getProducts:  ()  => _get('sf_products', []),
  saveProducts: (v) => _set('sf_products', v),
  getOrders:    ()  => _get('sf_orders',   []),
  saveOrders:   (v) => _set('sf_orders',   v),
  getCart:      ()  => _get('sf_cart',     []),
  saveCart:     (v) => _set('sf_cart',     v),
  getWishlist:  ()  => _get('sf_wishlist', []),
  saveWishlist: (v) => _set('sf_wishlist', v),
  getSession:   ()  => { try { return JSON.parse(sessionStorage.getItem('sf_user')); } catch { return null; } },
  setSession:   (u) => sessionStorage.setItem('sf_user', JSON.stringify(u)),
  clearSession: ()  => sessionStorage.removeItem('sf_user'),
};

/* ---- Seed demo data on first visit ---- */
function seedData() {
  if (_get('sf_seeded', false)) return;

  Store.saveUsers([
    { id: 1, name: 'Admin User',     email: 'admin@shopify.com',  password: 'admin123',  role: 'Admin',  status: 'Active' },
    { id: 2, name: 'Jane Seller',    email: 'seller@shopify.com', password: 'seller123', role: 'Seller', status: 'Active' },
    { id: 3, name: 'Bob Seller',     email: 'bob@shopify.com',    password: 'bob123',    role: 'Seller', status: 'Active' },
    { id: 4, name: 'Alice Customer', email: 'user@shopify.com',   password: 'user123',   role: 'User',   status: 'Active' },
  ]);

  Store.saveProducts([
    { id: 1, name: 'Classic White Sneakers',    category: 'Footwear',    price: 1299, stock: 50,  image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',  description: 'Timeless white sneakers for everyday style.',            sellerId: 2, approved: true,  rating: 4.8, reviewCount: 120 },
    { id: 2, name: 'Urban Denim Jacket',        category: 'Clothing',    price: 2499, stock: 30,  image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&q=80', description: 'Premium denim jacket with a modern slim fit.',           sellerId: 2, approved: true,  rating: 4.5, reviewCount: 87  },
    { id: 3, name: 'Slim Leather Wallet',       category: 'Accessories', price: 799,  stock: 100, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80', description: 'Genuine leather slim bifold wallet.',                   sellerId: 3, approved: true,  rating: 4.7, reviewCount: 200 },
    { id: 4, name: 'Wireless Earbuds Pro',      category: 'Electronics', price: 3999, stock: 25,  image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80', description: 'High-fidelity audio with active noise cancellation.',   sellerId: 3, approved: true,  rating: 4.6, reviewCount: 310 },
    { id: 5, name: 'Lightweight Running Shorts',category: 'Clothing',    price: 699,  stock: 80,  image: 'https://images.unsplash.com/photo-1562886877-7c45f5b50a18?w=500&q=80', description: 'Breathable shorts engineered for performance running.',  sellerId: 2, approved: false, rating: 4.3, reviewCount: 45  },
    { id: 6, name: 'Aviator Sunglasses',        category: 'Accessories', price: 1599, stock: 60,  image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80', description: 'Classic aviator frame with UV400 protection.',          sellerId: 3, approved: true,  rating: 4.9, reviewCount: 156 },
  ]);

  Store.saveOrders([
    { id: 'ORD-001', userId: 4, items: [{ productId: 1, name: 'Classic White Sneakers', qty: 1, price: 1299 }], total: 1329, address: '123 Main St, Mumbai', status: 'Delivered',  date: '2026-05-10' },
    { id: 'ORD-002', userId: 4, items: [{ productId: 4, name: 'Wireless Earbuds Pro',   qty: 1, price: 3999 }], total: 4029, address: '123 Main St, Mumbai', status: 'Processing', date: '2026-05-20' },
  ]);

  Store.saveCart([]);
  Store.saveWishlist([]);
  _set('sf_seeded', true);
}

/* =====================================================================
   CART
   ===================================================================== */

function addToCart(productId) {
  const pid = parseInt(productId);
  const cart = Store.getCart();
  const idx  = cart.findIndex(i => i.productId === pid);

  if (idx > -1) {
    cart[idx].qty += 1;
  } else {
    const product = Store.getProducts().find(p => p.id === pid);
    if (!product) { showToast('Product not found', 'danger'); return; }
    cart.push({ productId: pid, qty: 1 });
  }
  Store.saveCart(cart);
  updateCartCount();
  showToast('Added to cart!', 'success');
}

function removeFromCart(productId) {
  Store.saveCart(Store.getCart().filter(i => i.productId !== parseInt(productId)));
  updateCartCount();
  renderCart();
}

function updateQty(productId, qty) {
  const pid = parseInt(productId);
  const q   = parseInt(qty);
  const cart = Store.getCart();
  const idx  = cart.findIndex(i => i.productId === pid);
  if (idx > -1) {
    if (q < 1) cart.splice(idx, 1);
    else cart[idx].qty = q;
  }
  Store.saveCart(cart);
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const count = Store.getCart().reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#nav-cart-count, #cart-count').forEach(el => {
    el.textContent = count;
  });
}

function buyNow(productId) {
  addToCart(productId);
  window.location.href = 'checkout.html';
}

/* =====================================================================
   WISHLIST
   ===================================================================== */

function toggleWishlist(productId) {
  const pid = parseInt(productId);
  const wl  = Store.getWishlist();
  const idx = wl.indexOf(pid);
  if (idx > -1) {
    wl.splice(idx, 1);
    showToast('Removed from wishlist', 'warning');
  } else {
    wl.push(pid);
    showToast('Added to wishlist!', 'success');
  }
  Store.saveWishlist(wl);
  const countEl = document.getElementById('user-wishlist-count');
  if (countEl) countEl.textContent = wl.length;
}

function removeFromWishlist(productId) {
  Store.saveWishlist(Store.getWishlist().filter(id => id !== parseInt(productId)));
  showToast('Removed from wishlist', 'warning');
  initWishlistPage();
}

/* =====================================================================
   AUTH
   ===================================================================== */

function logout() {
  Store.clearSession();
  window.location.href = 'login.html';
}

/* =====================================================================
   UI HELPERS
   ===================================================================== */

function showToast(msg, type = 'success') {
  let container = document.getElementById('sf-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sf-toast-container';
    container.style.cssText =
      'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;' +
      'display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} shadow py-2 px-4 mb-0`;
  toast.style.cssText =
    'min-width:220px;border-radius:1rem;animation:fadeIn .25s ease;pointer-events:auto;';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function trackOrderMock() {
  showToast('Your order is on its way — ETA 2–3 business days.', 'info');
}

function fmt(n) {
  return Number(n).toLocaleString('en-IN');
}

/* ---- Reusable product card HTML ---- */
function productCardHTML(p) {
  const inWL = Store.getWishlist().includes(p.id);
  return `
  <div class="col-sm-6 col-lg-4">
    <div class="product-card card h-100">
      <img src="${p.image}" class="product-img card-img-top"
           alt="${p.name}"
           onerror="this.src='https://placehold.co/500x320?text=No+Image'">
      <div class="card-body d-flex flex-column p-4">
        <span class="badge bg-warning text-dark mb-2 align-self-start">${p.category}</span>
        <h5 class="card-title mb-1">${p.name}</h5>
        <p class="text-muted small mb-3 flex-grow-1">${p.description}</p>
        <div class="d-flex align-items-center justify-content-between mb-3">
          <span class="fw-bold text-primary fs-5">₹${fmt(p.price)}</span>
          <span class="small text-warning">
            <i class="fas fa-star"></i> ${p.rating}
            <span class="text-muted">(${p.reviewCount})</span>
          </span>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-primary flex-grow-1" onclick="addToCart(${p.id})">
            <i class="fas fa-cart-plus me-1"></i>Add to Cart
          </button>
          <button class="btn btn-outline-secondary"
                  onclick="toggleWishlist(${p.id})"
                  title="${inWL ? 'Remove from wishlist' : 'Add to wishlist'}">
            <i class="fas fa-heart ${inWL ? 'text-danger' : ''}"></i>
          </button>
          <a href="product-details.html?id=${p.id}" class="btn btn-outline-primary" title="View details">
            <i class="fas fa-eye"></i>
          </a>
        </div>
      </div>
    </div>
  </div>`;
}

/* ---- Category grid ---- */
const CATEGORIES = [
  { name: 'Clothing',    icon: 'fas fa-tshirt',     color: '#4361ee' },
  { name: 'Footwear',    icon: 'fas fa-shoe-prints', color: '#f72585' },
  { name: 'Accessories', icon: 'fas fa-glasses',     color: '#7209b7' },
  { name: 'Electronics', icon: 'fas fa-microchip',   color: '#3a0ca3' },
];

function renderCategories(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c => `
    <div class="col-6 col-md-3">
      <div class="category-card card text-center h-100"
           onclick="filterByCategory('${c.name}', event)">
        <div class="card-body d-flex flex-column align-items-center justify-content-center p-4">
          <div class="category-icon mb-3"
               style="background:${c.color}22;width:64px;height:64px;
                      border-radius:1.5rem;display:grid;place-items:center;">
            <i class="${c.icon} fa-2x" style="color:${c.color}"></i>
          </div>
          <h6 class="mb-0 fw-bold">${c.name}</h6>
        </div>
      </div>
    </div>`).join('');
}

function filterByCategory(cat) {
  const products  = Store.getProducts().filter(p => p.approved && p.category === cat);
  const container = document.getElementById('hero-products')
                  || document.getElementById('featured-products');
  if (!container) return;
  container.innerHTML = products.length
    ? products.map(productCardHTML).join('')
    : `<div class="col-12"><p class="text-muted">No products in ${cat}.</p></div>`;
}

/* =====================================================================
   PAGE: INDEX
   ===================================================================== */

function initIndexPage() {
  const products  = Store.getProducts().filter(p => p.approved);
  const container = document.getElementById('hero-products');
  if (container) container.innerHTML = products.map(productCardHTML).join('');
  renderCategories('category-row');

  const searchInput = document.getElementById('search-query');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      const filtered = Store.getProducts().filter(
        p => p.approved && (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      );
      if (container) {
        container.innerHTML = filtered.length
          ? filtered.map(productCardHTML).join('')
          : '<div class="col-12"><p class="text-muted">No products matched your search.</p></div>';
      }
    });
  }
}

/* =====================================================================
   PAGE: AUTH (login.html)
   ===================================================================== */

function initAuthPage() {
  const loginForm  = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const tabLogin   = document.getElementById('tab-login');
  const tabSignup  = document.getElementById('tab-signup');

  function showLogin() {
    loginForm.classList.remove('d-none');
    signupForm.classList.add('d-none');
    tabLogin.classList.replace('btn-outline-primary', 'btn-primary');
    tabSignup.classList.replace('btn-primary', 'btn-outline-primary');
  }
  function showSignup() {
    signupForm.classList.remove('d-none');
    loginForm.classList.add('d-none');
    tabSignup.classList.replace('btn-outline-primary', 'btn-primary');
    tabLogin.classList.replace('btn-primary', 'btn-outline-primary');
  }

  tabLogin?.addEventListener('click', showLogin);
  tabSignup?.addEventListener('click', showSignup);

  /* ---- LOGIN ---- */
  document.getElementById('login-submit')?.addEventListener('click', () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const role     = document.getElementById('login-role').value;

    if (!email || !password) { showToast('Please fill in all fields', 'warning'); return; }

    const user = Store.getUsers().find(
      u => u.email === email && u.password === password && u.role === role
    );
    if (!user) { showToast('Invalid email, password, or role', 'danger'); return; }
    if (user.status === 'Suspended') { showToast('Account suspended. Contact support.', 'danger'); return; }

    Store.setSession(user);
    showToast(`Welcome back, ${user.name}!`, 'success');
    setTimeout(() => {
      if (user.role === 'Admin')  window.location.href = 'admin-dashboard.html';
      else if (user.role === 'Seller') window.location.href = 'seller-dashboard.html';
      else window.location.href = 'user-dashboard.html';
    }, 800);
  });

  /* ---- SIGN UP ---- */
  document.getElementById('signup-submit')?.addEventListener('click', () => {
    const name     = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const role     = document.getElementById('signup-role').value;

    if (!name || !email || !password) { showToast('Please fill in all fields', 'warning'); return; }

    const users = Store.getUsers();
    if (users.find(u => u.email === email)) { showToast('Email already registered', 'warning'); return; }

    const newUser = { id: Date.now(), name, email, password, role, status: 'Active' };
    users.push(newUser);
    Store.saveUsers(users);
    Store.setSession(newUser);
    showToast('Account created! Redirecting…', 'success');
    setTimeout(() => {
      window.location.href = role === 'Seller' ? 'seller-dashboard.html' : 'user-dashboard.html';
    }, 800);
  });

  document.getElementById('forgot-password')?.addEventListener('click', () => {
    showToast('Password reset link sent (demo mode)', 'info');
  });
}

/* =====================================================================
   PAGE: CART (cart.html)
   ===================================================================== */

function renderCart() {
  const cart     = Store.getCart();
  const products = Store.getProducts();
  const body     = document.getElementById('cart-items-body');
  const summary  = document.getElementById('cart-summary');
  const btn      = document.getElementById('checkout-button');
  const countEl  = document.getElementById('cart-count');

  const subtotal = cart.reduce((s, i) => {
    const p = products.find(pr => pr.id === i.productId);
    return s + (p ? p.price * i.qty : 0);
  }, 0);

  if (countEl) countEl.textContent = cart.reduce((s, i) => s + i.qty, 0);

  if (!cart.length) {
    if (body) body.innerHTML =
      '<div class="col-12"><div class="alert alert-info">' +
      'Your cart is empty. <a href="index.html">Continue shopping</a></div></div>';
    if (summary) summary.innerHTML = '<p class="text-muted mb-0">No items yet.</p>';
    if (btn) btn.disabled = true;
    return;
  }

  if (body) {
    body.innerHTML = cart.map(item => {
      const p = products.find(pr => pr.id === item.productId);
      if (!p) return '';
      return `
      <div class="col-12">
        <div class="card rounded-4 p-3 d-flex flex-row align-items-center gap-3">
          <img src="${p.image}" width="80" height="80"
               style="object-fit:cover;border-radius:1rem;flex-shrink:0"
               onerror="this.src='https://placehold.co/80'">
          <div class="flex-grow-1 min-width-0">
            <h6 class="mb-1 text-truncate">${p.name}</h6>
            <span class="badge bg-warning text-dark">${p.category}</span>
            <p class="mb-0 text-primary fw-bold mt-1">₹${fmt(p.price * item.qty)}</p>
          </div>
          <div class="d-flex align-items-center gap-1">
            <button class="btn btn-outline-secondary btn-sm"
                    onclick="updateQty(${p.id},${item.qty - 1})">−</button>
            <span class="px-2 fw-bold">${item.qty}</span>
            <button class="btn btn-outline-secondary btn-sm"
                    onclick="updateQty(${p.id},${item.qty + 1})">+</button>
          </div>
          <button class="btn btn-outline-danger btn-sm"
                  onclick="removeFromCart(${p.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`;
    }).join('');
  }

  if (summary) {
    summary.innerHTML = `
      <div class="d-flex justify-content-between mb-2">
        <span>Subtotal</span><strong>₹${fmt(subtotal)}</strong>
      </div>
      <div class="d-flex justify-content-between mb-2">
        <span>Shipping</span><strong>₹50</strong>
      </div>
      <hr/>
      <div class="d-flex justify-content-between">
        <span class="fw-bold">Total</span>
        <strong class="fs-5">₹${fmt(subtotal + 50)}</strong>
      </div>`;
  }

  if (btn) {
    btn.disabled = false;
    btn.onclick  = () => window.location.href = 'checkout.html';
  }
}

/* =====================================================================
   PAGE: CHECKOUT (checkout.html)
   ===================================================================== */

function initCheckoutPage() {
  const cart     = Store.getCart();
  const products = Store.getProducts();

  const subtotal = cart.reduce((s, i) => {
    const p = products.find(pr => pr.id === i.productId);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const total = subtotal + 50 - 20;

  const summaryEl   = document.getElementById('checkout-summary');
  const subtotalEl  = document.getElementById('checkout-subtotal');
  const totalEl     = document.getElementById('checkout-total');

  if (summaryEl) {
    summaryEl.innerHTML = cart.length
      ? cart.map(item => {
          const p = products.find(pr => pr.id === item.productId);
          if (!p) return '';
          return `
          <div class="d-flex justify-content-between mb-2">
            <span>${p.name} <span class="text-muted">×${item.qty}</span></span>
            <strong>₹${fmt(p.price * item.qty)}</strong>
          </div>`;
        }).join('')
      : '<p class="text-muted">Your cart is empty.</p>';
  }
  if (subtotalEl) subtotalEl.textContent = `₹${fmt(subtotal)}`;
  if (totalEl)    totalEl.textContent    = `₹${fmt(total)}`;

  /* BUG FIX: checkout-form had no submit handler attached anywhere.
     The form's submit event is wired here via addEventListener. */
  const form = document.getElementById('checkout-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cart.length) { showToast('Your cart is empty', 'warning'); return; }

    const address = document.getElementById('checkout-address').value.trim();
    if (!address)  { showToast('Please enter your shipping address', 'warning'); return; }

    const user = Store.getSession();
    const order = {
      id:      'ORD-' + Date.now(),
      userId:  user ? user.id : 0,
      items:   cart.map(i => {
        const p = products.find(pr => pr.id === i.productId);
        return { productId: i.productId, name: p?.name || 'Product', qty: i.qty, price: p?.price || 0 };
      }),
      total,
      address,
      status:  'Processing',
      date:    new Date().toISOString().split('T')[0],
    };

    const orders = Store.getOrders();
    orders.push(order);
    Store.saveOrders(orders);
    Store.saveCart([]);
    updateCartCount();

    showToast('Order placed successfully! 🎉', 'success');
    setTimeout(() => {
      window.location.href = user?.role === 'User' ? 'user-dashboard.html' : 'index.html';
    }, 1500);
  });
}

/* =====================================================================
   PAGE: PRODUCT DETAILS (product-details.html)
   BUG FIX: activeProductId was used in inline onclick handlers but never
   declared. It is now a global var set during initProductDetailsPage().
   ===================================================================== */

var activeProductId = null; // global — referenced in HTML onclick attrs

function initProductDetailsPage() {
  const params = new URLSearchParams(window.location.search);
  const id     = parseInt(params.get('id'));
  if (!id) { showToast('No product specified', 'warning'); return; }

  activeProductId = id; // make available to onclick handlers in HTML

  const product = Store.getProducts().find(p => p.id === id);
  if (!product) { showToast('Product not found', 'danger'); return; }

  const set = (elId, val) => {
    const el = document.getElementById(elId);
    if (el) el.textContent = val;
  };

  document.getElementById('detail-image').src = product.image;
  set('detail-category',    product.category);
  set('detail-title',       product.name);
  set('detail-description', product.description);
  set('detail-price',       `₹${fmt(product.price)}`);
  set('detail-rating',      product.rating);
  set('detail-stock',       product.stock);
  set('detail-reviews',     product.reviewCount);
  document.title = `Shopify | ${product.name}`;

  /* Sample reviews */
  const reviewsEl = document.getElementById('reviews-list');
  if (reviewsEl) {
    const samples = [
      { user: 'Rahul M.', rating: 5, text: 'Excellent quality, totally worth it!',    date: '2026-05-01' },
      { user: 'Priya K.', rating: 4, text: 'Good product and surprisingly fast delivery.', date: '2026-05-05' },
      { user: 'Amit S.',  rating: 5, text: 'Highly recommended. Looks just like the photos.', date: '2026-05-12' },
    ];
    reviewsEl.innerHTML = samples.map(r => `
      <div class="list-group-item px-0 py-3 border-0 border-bottom">
        <div class="d-flex justify-content-between mb-1">
          <strong>${r.user}</strong>
          <span class="text-warning">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
        </div>
        <p class="mb-1 text-muted">${r.text}</p>
        <small class="text-muted">${r.date}</small>
      </div>`).join('');
  }
}

/* =====================================================================
   PAGE: USER DASHBOARD (user-dashboard.html)
   ===================================================================== */

function initUserDashboard() {
  const user = Store.getSession();
  if (!user || user.role !== 'User') {
    showToast('Please log in as a customer', 'warning');
    setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    return;
  }

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  set('user-name',    user.name);
  set('profile-name', user.name);
  set('profile-email', user.email);

  const orders  = Store.getOrders().filter(o => o.userId === user.id);
  const wishlist = Store.getWishlist();

  set('user-orders-count',   orders.length);
  set('user-wishlist-count', wishlist.length);

  /* Products */
  const products    = Store.getProducts().filter(p => p.approved);
  const featuredEl  = document.getElementById('featured-products');
  if (featuredEl) featuredEl.innerHTML = products.map(productCardHTML).join('');

  renderCategories('category-row');

  /* Order history */
  const orderEl = document.getElementById('order-history');
  if (orderEl) {
    orderEl.innerHTML = orders.length
      ? orders.map(o => `
        <div class="list-group-item rounded-4 mb-2 border-0 shadow-sm p-3">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <strong>${o.id}</strong>
              <p class="mb-0 text-muted small">${o.items.map(i => i.name).join(', ')}</p>
            </div>
            <div class="text-end">
              <span class="badge ${o.status === 'Delivered' ? 'bg-success' : o.status === 'Processing' ? 'bg-warning text-dark' : 'bg-secondary'}">${o.status}</span>
              <p class="mb-0 text-muted small mt-1">${o.date}</p>
              <strong>₹${fmt(o.total)}</strong>
            </div>
          </div>
        </div>`)
        .join('')
      : '<p class="text-muted">No orders yet. <a href="index.html">Start shopping!</a></p>';
  }

  /* Recent activity */
  const activityEl = document.getElementById('profile-activity');
  if (activityEl) {
    const items = orders.length
      ? orders.map(o => `Placed order ${o.id} — ${o.items.map(i => i.name).join(', ')}`)
      : ['Browse products and place your first order!'];
    activityEl.innerHTML = items.map(a => `<li class="list-group-item border-0 px-0">${a}</li>`).join('');
  }

  /* Search */
  const searchInput = document.getElementById('product-search');
  if (searchInput && featuredEl) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      const filtered = products.filter(
        p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
      featuredEl.innerHTML = filtered.length
        ? filtered.map(productCardHTML).join('')
        : '<div class="col-12"><p class="text-muted">No products matched.</p></div>';
    });
  }
}

/* =====================================================================
   PAGE: SELLER DASHBOARD (seller-dashboard.html)
   ===================================================================== */

function renderSellerProducts() {
  const user = Store.getSession();
  if (!user) return;
  const products = Store.getProducts().filter(p => p.sellerId === user.id);
  const el = document.getElementById('seller-products');
  if (!el) return;

  el.innerHTML = products.length
    ? products.map(p => `
      <div class="col-sm-6 col-lg-4">
        <div class="card rounded-4 p-3 shadow-sm">
          <img src="${p.image}" height="160"
               style="object-fit:cover;border-radius:1rem;width:100%"
               onerror="this.src='https://placehold.co/400x160'">
          <div class="mt-3">
            <span class="badge ${p.approved ? 'bg-success' : 'bg-warning text-dark'} mb-2">
              ${p.approved ? 'Approved' : 'Pending Approval'}
            </span>
            <h6 class="mb-1">${p.name}</h6>
            <p class="text-muted small mb-2">₹${fmt(p.price)} · Stock: ${p.stock}</p>
            <button class="btn btn-outline-danger btn-sm w-100"
                    onclick="deleteProduct(${p.id})">
              <i class="fas fa-trash me-1"></i>Remove
            </button>
          </div>
        </div>
      </div>`)
      .join('')
    : '<div class="col-12"><p class="text-muted">No products listed yet. Add your first product above.</p></div>';
}

function deleteProduct(productId) {
  if (!confirm('Remove this product?')) return;
  Store.saveProducts(Store.getProducts().filter(p => p.id !== productId));
  renderSellerProducts();
  _refreshSellerStats();
  showToast('Product removed', 'warning');
}

function _refreshSellerStats() {
  const user = Store.getSession();
  if (!user) return;
  const products = Store.getProducts().filter(p => p.sellerId === user.id);
  const orders   = Store.getOrders().filter(
    o => o.items.some(i => products.find(p => p.id === i.productId))
  );
  const sales = orders.reduce((s, o) => s + o.total, 0);
  const set   = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  set('seller-products-count', products.length);
  set('seller-orders-count',   orders.filter(o => o.status === 'Processing').length);
  set('seller-sales',          `₹${fmt(sales)}`);
  set('seller-rating',         products.length
    ? (products.filter(p => p.rating > 0).reduce((s, p) => s + p.rating, 0) / Math.max(1, products.filter(p => p.rating > 0).length)).toFixed(1)
    : '—');
  set('seller-weekly-revenue', `₹${fmt(Math.round(sales * 0.25))}`);
  set('seller-conversion',     '3.2%');
}

function initSellerDashboard() {
  const user = Store.getSession();
  if (!user || user.role !== 'Seller') {
    showToast('Please log in as a seller', 'warning');
    setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    return;
  }

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('seller-shop-name', `${user.name}'s Shop`);
  set('seller-email',     user.email);

  _refreshSellerStats();
  renderSellerProducts();

  /* Customer orders for this seller */
  const myProducts = Store.getProducts().filter(p => p.sellerId === user.id);
  const orders     = Store.getOrders().filter(
    o => o.items.some(i => myProducts.find(p => p.id === i.productId))
  );
  const ordersEl = document.getElementById('seller-orders');
  if (ordersEl) {
    ordersEl.innerHTML = orders.length
      ? orders.map(o => `
        <div class="list-group-item rounded-4 mb-2 border-0 shadow-sm p-3">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <strong>${o.id}</strong>
              <p class="mb-0 text-muted small">${o.items.map(i => i.name).join(', ')}</p>
            </div>
            <div class="text-end">
              <span class="badge ${o.status === 'Delivered' ? 'bg-success' : 'bg-warning text-dark'}">${o.status}</span>
              <p class="mb-0 fw-bold mt-1">₹${fmt(o.total)}</p>
            </div>
          </div>
        </div>`).join('')
      : '<p class="text-muted">No orders yet.</p>';
  }

  /* Add product form */
  const form = document.getElementById('seller-product-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name        = document.getElementById('seller-product-name').value.trim();
    const category    = document.getElementById('seller-product-category').value;
    const price       = parseFloat(document.getElementById('seller-product-price').value);
    const stock       = parseInt(document.getElementById('seller-product-stock').value);
    const imageUrl    = document.getElementById('seller-product-image').value.trim();
    const description = document.getElementById('seller-product-description').value.trim();

    if (!name || !price || !stock) { showToast('Please fill in all required fields', 'warning'); return; }

    const products = Store.getProducts();
    products.push({
      id:          Date.now(),
      name, category, price, stock,
      image:       imageUrl || `https://placehold.co/500x320?text=${encodeURIComponent(name)}`,
      description: description || 'No description provided.',
      sellerId:    user.id,
      approved:    false,
      rating:      0,
      reviewCount: 0,
    });
    Store.saveProducts(products);
    renderSellerProducts();
    _refreshSellerStats();
    form.reset();
    showToast('Product submitted for admin approval!', 'success');
  });
}

/* =====================================================================
   PAGE: ADMIN DASHBOARD (admin-dashboard.html)
   BUG FIX: renderAdminUsers() was expected to fill a <tbody> inside
   #admin-users, but #admin-users is the wrapping <div>. Selector now
   targets document.querySelector('#admin-users table tbody') correctly.
   ===================================================================== */

function renderAdminUsers() {
  const users = Store.getUsers();
  /* BUG FIX: was getElementById('admin-users') which targets the <div>,
     not the <tbody>. Using querySelector to reach the actual table body. */
  const tbody = document.querySelector('#admin-users table tbody');
  if (!tbody) return;

  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><span class="badge bg-${u.role === 'Admin' ? 'danger' : u.role === 'Seller' ? 'info text-dark' : 'primary'}">${u.role}</span></td>
      <td><span class="badge bg-${u.status === 'Active' ? 'success' : 'secondary'}">${u.status}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1"
                onclick="toggleUserStatus(${u.id})">
          ${u.status === 'Active' ? 'Suspend' : 'Activate'}
        </button>
        <button class="btn btn-sm btn-outline-danger"
                onclick="deleteUser(${u.id})">Delete</button>
      </td>
    </tr>`).join('');
}

function toggleUserStatus(userId) {
  const users = Store.getUsers().map(u =>
    u.id === userId ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u
  );
  Store.saveUsers(users);
  renderAdminUsers();
  renderAdminSellers();
  showToast('User status updated', 'info');
}

function deleteUser(userId) {
  if (!confirm('Permanently delete this user?')) return;
  Store.saveUsers(Store.getUsers().filter(u => u.id !== userId));
  renderAdminUsers();
  renderAdminSellers();
  _refreshAdminStats();
  showToast('User deleted', 'warning');
}

function renderAdminSellers() {
  const sellers = Store.getUsers().filter(u => u.role === 'Seller');
  const el      = document.getElementById('admin-sellers');
  if (!el) return;
  el.innerHTML = sellers.length
    ? sellers.map(s => `
      <div class="col-md-4">
        <div class="card rounded-4 p-4 shadow-sm">
          <div class="d-flex align-items-center mb-3">
            <div class="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3"
                 style="width:48px;height:48px;font-size:1.25rem;flex-shrink:0">
              ${s.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h6 class="mb-0">${s.name}</h6>
              <p class="text-muted small mb-0">${s.email}</p>
            </div>
          </div>
          <span class="badge bg-${s.status === 'Active' ? 'success' : 'secondary'} mb-3">${s.status}</span>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-warning btn-sm flex-grow-1"
                    onclick="toggleUserStatus(${s.id})">
              ${s.status === 'Active' ? 'Suspend' : 'Activate'}
            </button>
            <button class="btn btn-outline-danger btn-sm"
                    onclick="deleteUser(${s.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>`)
      .join('')
    : '<div class="col-12"><p class="text-muted">No sellers registered.</p></div>';
}

function renderAdminProductApproval() {
  const pending = Store.getProducts().filter(p => !p.approved);
  const el      = document.getElementById('admin-product-approval');
  if (!el) return;
  el.innerHTML = pending.length
    ? pending.map(p => `
      <div class="col-md-4">
        <div class="card rounded-4 p-3 shadow-sm">
          <img src="${p.image}" height="140"
               style="object-fit:cover;border-radius:1rem;width:100%"
               onerror="this.src='https://placehold.co/400x140'">
          <div class="mt-3">
            <h6 class="mb-1">${p.name}</h6>
            <p class="text-muted small mb-2">₹${fmt(p.price)} · ${p.category}</p>
            <div class="d-flex gap-2">
              <button class="btn btn-success btn-sm flex-grow-1"
                      onclick="approveProduct(${p.id})">
                <i class="fas fa-check me-1"></i>Approve
              </button>
              <button class="btn btn-danger btn-sm"
                      onclick="rejectProduct(${p.id})">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`)
      .join('')
    : '<div class="col-12"><p class="text-muted">No pending approvals.</p></div>';
}

function approveProduct(productId) {
  Store.saveProducts(
    Store.getProducts().map(p => p.id === productId ? { ...p, approved: true } : p)
  );
  renderAdminProductApproval();
  _refreshAdminStats();
  showToast('Product approved!', 'success');
}

function rejectProduct(productId) {
  if (!confirm('Reject and delete this product?')) return;
  Store.saveProducts(Store.getProducts().filter(p => p.id !== productId));
  renderAdminProductApproval();
  _refreshAdminStats();
  showToast('Product rejected', 'warning');
}

function _refreshAdminStats() {
  const users    = Store.getUsers();
  const products = Store.getProducts();
  const orders   = Store.getOrders();
  const sellers  = users.filter(u => u.role === 'Seller');
  const revenue  = orders.reduce((s, o) => s + o.total, 0);
  const set      = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  set('admin-users-count',      users.filter(u => u.role === 'User').length);
  set('admin-sellers-count',    sellers.length);
  set('admin-products-count',   products.filter(p => p.approved).length);
  set('admin-orders-count',     orders.length);
  set('admin-revenue',          fmt(revenue));
  set('admin-conversion',       '4.2%');
  set('admin-pending-products', products.filter(p => !p.approved).length);
  set('admin-active-sellers',   sellers.filter(s => s.status === 'Active').length);
  set('admin-new-users',        users.filter(u => u.role === 'User').length);
}

function initAdminDashboard() {
  const user = Store.getSession();
  if (!user || user.role !== 'Admin') {
    showToast('Admin access required', 'danger');
    setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    return;
  }

  _refreshAdminStats();
  renderAdminUsers();
  renderAdminSellers();
  renderAdminProductApproval();

  /* All orders */
  const orders  = Store.getOrders();
  const ordersEl = document.getElementById('admin-orders');
  if (ordersEl) {
    ordersEl.innerHTML = orders.length
      ? orders.map(o => `
        <div class="list-group-item rounded-4 mb-2 border-0 shadow-sm p-3">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <strong>${o.id}</strong>
              <p class="mb-0 text-muted small">${o.items.map(i => i.name).join(', ')}</p>
              <small class="text-muted">Ship to: ${o.address}</small>
            </div>
            <div class="text-end">
              <span class="badge ${o.status === 'Delivered' ? 'bg-success' : o.status === 'Processing' ? 'bg-warning text-dark' : 'bg-secondary'}">${o.status}</span>
              <p class="mb-0 fw-bold mt-1">₹${fmt(o.total)}</p>
              <small class="text-muted">${o.date}</small>
            </div>
          </div>
        </div>`).join('')
      : '<p class="text-muted">No orders yet.</p>';
  }
}

/* =====================================================================
   PAGE: WISHLIST (wishlist.html)
   ===================================================================== */

function initWishlistPage() {
  const wishlist = Store.getWishlist();
  const products = Store.getProducts().filter(p => wishlist.includes(p.id));
  const el       = document.getElementById('wishlist-products');
  const emptyEl  = document.getElementById('empty-wishlist');
  if (!el) return;

  if (!products.length) {
    el.innerHTML = '';
    emptyEl?.classList.remove('d-none');
    return;
  }
  emptyEl?.classList.add('d-none');
  el.innerHTML = products.map(p => `
    <div class="col-sm-6 col-md-4 col-lg-3">
      <div class="product-card card h-100">
        <img src="${p.image}" class="product-img card-img-top"
             alt="${p.name}"
             onerror="this.src='https://placehold.co/500x320'">
        <div class="card-body d-flex flex-column p-4">
          <span class="badge bg-warning text-dark mb-2 align-self-start">${p.category}</span>
          <h6 class="card-title mb-1">${p.name}</h6>
          <p class="text-primary fw-bold mb-3">₹${fmt(p.price)}</p>
          <div class="d-flex gap-2 mt-auto">
            <button class="btn btn-primary btn-sm flex-grow-1"
                    onclick="addToCart(${p.id})">Add to Cart</button>
            <button class="btn btn-outline-danger btn-sm"
                    onclick="removeFromWishlist(${p.id})"
                    title="Remove from wishlist">
              <i class="fas fa-heart-broken"></i>
            </button>
          </div>
        </div>
      </div>
    </div>`).join('');
}

/* =====================================================================
   ROUTER — dispatch on DOMContentLoaded
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  seedData();

  /* BUG FIX: .navbar { position: fixed } in CSS caused every page's content
     to start hidden under the fixed navbar — no padding-top was set anywhere.
     Fix: add a class to <body> when a .topbar is present so the CSS rule
     body.has-topbar { padding-top: 70px } (in style.css) kicks in. */
  if (document.querySelector('.topbar')) {
    document.body.classList.add('has-topbar');
  }

  updateCartCount();

  const page = document.body.dataset.page;
  switch (page) {
    case 'IndexPage':       initIndexPage();         break;
    case 'AuthPage':        initAuthPage();          break;
    case 'CartPage':        renderCart();            break;
    case 'CheckoutPage':    initCheckoutPage();      break;
    case 'ProductDetails':  initProductDetailsPage();break;
    case 'UserDashboard':   initUserDashboard();     break;
    case 'SellerDashboard': initSellerDashboard();   break;
    case 'AdminDashboard':  initAdminDashboard();    break;
    case 'WishlistPage':    initWishlistPage();      break;
    default:
      console.warn('[site.js] Unknown data-page:', page);
  }
});