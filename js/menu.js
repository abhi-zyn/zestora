/* ===== Menu Page JS ===== */
(function() {
  const menuData = {
    coffee: [
      { name: 'Espresso', desc: 'Rich, bold single shot', price: 3.50, emoji: '☕' },
      { name: 'Matcha Latte', desc: 'Ceremonial grade matcha with oat milk', price: 5.50, emoji: '🍵' },
      { name: 'Cold Brew', desc: '24hr steeped, smooth & refreshing', price: 4.50, emoji: '🧊' },
      { name: 'Cappuccino', desc: 'Velvety foam, double shot', price: 4.50, emoji: '☕' },
      { name: 'Flat White', desc: 'Silky microfoam, strong espresso', price: 4.80, emoji: '🥛' },
      { name: 'Mocha', desc: 'Espresso meets dark chocolate', price: 5.50, emoji: '🍫' }
    ],
    food: [
      { name: 'Açaí Bowl', desc: 'Topped with granola, banana & berries', price: 9.50, emoji: '🫐' },
      { name: 'Avocado Toast', desc: 'Sourdough, poached egg, chili flakes', price: 8.50, emoji: '🥑' },
      { name: 'Buddha Bowl', desc: 'Quinoa, roasted veg, tahini drizzle', price: 11.00, emoji: '🥗' },
      { name: 'Croissant', desc: 'Butter croissant, freshly baked', price: 4.00, emoji: '🥐' },
      { name: 'Grain Salad', desc: 'Farro, pomegranate, feta, mint', price: 10.00, emoji: '🌾' },
      { name: 'Wrap', desc: 'Grilled chicken, hummus, greens', price: 9.00, emoji: '🌯' }
    ],
    drinks: [
      { name: 'Green Smoothie', desc: 'Spinach, mango, banana, coconut', price: 7.00, emoji: '🥬' },
      { name: 'Fresh OJ', desc: 'Squeezed to order', price: 5.00, emoji: '🍊' },
      { name: 'Kombucha', desc: 'House-brewed, ginger-lemon', price: 5.50, emoji: '🫧' },
      { name: 'Iced Lemonade', desc: 'Mint, honey, sparkling', price: 4.50, emoji: '🍋' },
      { name: 'Berry Blast', desc: 'Mixed berries, yogurt, chia', price: 7.50, emoji: '🍓' },
      { name: 'Turmeric Latte', desc: 'Golden milk, warming spices', price: 5.50, emoji: '✨' }
    ],
    desserts: [
      { name: 'Tiramisu', desc: 'Classic Italian, espresso-soaked', price: 7.50, emoji: '🍰' },
      { name: 'Matcha Cheesecake', desc: 'Creamy, earthy, no-bake', price: 8.00, emoji: '🍵' },
      { name: 'Brownie', desc: 'Fudgy dark chocolate, sea salt', price: 5.00, emoji: '🍫' },
      { name: 'Fruit Tart', desc: 'Seasonal fruits, vanilla custard', price: 6.50, emoji: '🍓' },
      { name: 'Affogato', desc: 'Vanilla gelato drowned in espresso', price: 6.00, emoji: '🍨' },
      { name: 'Cookie', desc: 'Giant chocolate chip, warm', price: 3.50, emoji: '🍪' }
    ]
  };

  let cart = JSON.parse(localStorage.getItem('zestora-cart') || '[]');
  let activeCategory = 'coffee';

  const grid = document.querySelector('.menu-grid');
  const tabs = document.querySelectorAll('.tab-btn');
  const cartPanel = document.querySelector('.cart-panel');
  const cartOverlay = document.querySelector('.cart-overlay');
  const cartToggle = document.querySelector('.cart-toggle');
  const cartBadge = document.querySelector('.cart-badge');
  const cartItemsEl = document.querySelector('.cart-items');
  const cartTotalEl = document.querySelector('.cart-total-price');

  function renderMenu(category) {
    activeCategory = category;
    grid.innerHTML = '';
    const items = menuData[category];
    items.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'menu-card';
      card.style.transitionDelay = `${i * 0.08}s`;
      card.innerHTML = `
        <div class="menu-card-emoji">${item.emoji}</div>
        <h3>${item.name}</h3>
        <p class="description">${item.desc}</p>
        <div class="menu-card-footer">
          <span class="price">$${item.price.toFixed(2)}</span>
          <button class="add-btn" data-name="${item.name}" data-price="${item.price}">+</button>
        </div>
      `;
      grid.appendChild(card);
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('visible')));
    });

    grid.querySelectorAll('.add-btn').forEach(btn => {
      btn.addEventListener('click', () => addToCart(btn.dataset.name, parseFloat(btn.dataset.price)));
    });
  }

  function addToCart(name, price) {
    const existing = cart.find(i => i.name === name);
    if (existing) existing.qty++;
    else cart.push({ name, price, qty: 1 });
    saveCart();
    renderCart();
  }

  function saveCart() {
    localStorage.setItem('zestora-cart', JSON.stringify(cart));
    const total = cart.reduce((s, i) => s + i.qty, 0);
    cartBadge.textContent = total;
    cartBadge.style.display = total > 0 ? 'flex' : 'none';
  }

  function renderCart() {
    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
    } else {
      cartItemsEl.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <span class="cart-item-price">$${item.price.toFixed(2)}</span>
          </div>
          <div class="cart-item-qty">
            <button class="qty-btn" data-i="${i}" data-action="dec">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-i="${i}" data-action="inc">+</button>
          </div>
        </div>
      `).join('');
      cartItemsEl.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.i);
          if (btn.dataset.action === 'inc') cart[idx].qty++;
          else { cart[idx].qty--; if (cart[idx].qty <= 0) cart.splice(idx, 1); }
          saveCart();
          renderCart();
        });
      });
    }
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    cartTotalEl.textContent = `$${total.toFixed(2)}`;
  }

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderMenu(tab.dataset.category);
    });
  });

  // Cart panel toggle
  cartToggle.addEventListener('click', () => {
    cartPanel.classList.add('open');
    cartOverlay.classList.add('open');
  });
  document.querySelector('.cart-close').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  function closeCart() {
    cartPanel.classList.remove('open');
    cartOverlay.classList.remove('open');
  }

  // Init
  renderMenu('coffee');
  saveCart();
  renderCart();

  // Scroll entrance for cards on menu page
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.batch('.menu-card', {
      onEnter: (elements) => {
        gsap.to(elements, { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out' });
      },
      start: 'top 90%'
    });
  }
})();
