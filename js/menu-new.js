(function() {
  const dishes = [
    { name: 'French Toast Caramel Syrup & Vanilla Sundae', category: 'Desserts', price: 249 },
    { name: 'French Toast Choco-Chips & Chocolate Souce', category: 'Desserts', price: 229 },
    { name: 'French Toast Honey & Caramelized Banana', category: 'Desserts', price: 219 },
    { name: 'Ranch Wrap', category: 'Wraps', price: 179 },
    { name: 'Veg Fried Momos', category: 'Momos', price: 149 },
    { name: 'Chicken Manchurian Momos', category: 'Momos', price: 189 },
    { name: 'Chicken Steamed Momos', category: 'Momos', price: 169 },
    { name: 'Watermelon Feta Salad', category: 'Salads', price: 199 },
    { name: 'Caesar Salad', category: 'Salads', price: 189 },
    { name: 'Greek Salad', category: 'Salads', price: 179 },
    { name: 'Mexican Wrap', category: 'Wraps', price: 189 },
    { name: 'Falafel Wrap', category: 'Wraps', price: 179 },
    { name: 'Veg Schezwan Momos', category: 'Momos', price: 149 },
    { name: 'Chicken Fried Momos', category: 'Momos', price: 179 },
    { name: 'Chicken Schezwan Momos', category: 'Momos', price: 189 },
    { name: 'Chilli Paneer Wrap', category: 'Wraps', price: 199 }
  ];

  // Also include the unnamed file if it exists
  const categories = ['All', ...new Set(dishes.map(d => d.category))];
  let activeCategory = 'All';
  let filtered = [...dishes];
  let currentIndex = 0;

  const tabsEl = document.getElementById('categoryTabs');
  const gridEl = document.getElementById('menuGrid');
  const overlay = document.getElementById('detailOverlay');
  const detailImage = document.getElementById('detailImage');
  const detailName = document.getElementById('detailName');
  const detailCategory = document.getElementById('detailCategory');
  const detailPrice = document.getElementById('detailPrice');
  const detailBack = document.getElementById('detailBack');
  const searchInput = document.getElementById('searchInput');

  function getImagePath(name) {
    return 'images/dishes/' + name + '.png';
  }

  function renderTabs() {
    tabsEl.innerHTML = categories.map(c =>
      `<button class="tab-btn${c === activeCategory ? ' active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
    tabsEl.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        filterAndRender();
      });
    });
  }

  function filterAndRender() {
    const query = searchInput.value.toLowerCase();
    filtered = dishes.filter(d => {
      const catMatch = activeCategory === 'All' || d.category === activeCategory;
      const searchMatch = !query || d.name.toLowerCase().includes(query);
      return catMatch && searchMatch;
    });
    renderTabs();
    renderGrid();
  }

  function renderGrid() {
    gridEl.innerHTML = filtered.map((d, i) => `
      <div class="menu-card" data-index="${i}">
        <button class="heart">♡</button>
        <img class="menu-card-img" src="${getImagePath(d.name)}" alt="${d.name}">
        <h3>${d.name}</h3>
        <p class="category">${d.category}</p>
        <div class="menu-card-footer">
          <span class="price">₹${d.price}</span>
          <button class="add-btn">+</button>
        </div>
      </div>
    `).join('');

    gridEl.querySelectorAll('.menu-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.add-btn') || e.target.closest('.heart')) return;
        currentIndex = parseInt(card.dataset.index);
        openDetail();
      });
    });
  }

  function openDetail() {
    const dish = filtered[currentIndex];
    detailImage.src = getImagePath(dish.name);
    detailImage.alt = dish.name;
    detailName.textContent = dish.name;
    detailCategory.textContent = dish.category;
    detailPrice.textContent = '₹' + dish.price;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  detailBack.addEventListener('click', closeDetail);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDetail();
  });

  // Swipe support
  let touchStartX = 0;
  const modal = document.getElementById('detailModal');
  modal.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
  modal.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 60) {
      if (diff < 0 && currentIndex < filtered.length - 1) { currentIndex++; openDetail(); }
      else if (diff > 0 && currentIndex > 0) { currentIndex--; openDetail(); }
    }
  });

  // Keyboard nav
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeDetail();
    if (e.key === 'ArrowRight' && currentIndex < filtered.length - 1) { currentIndex++; openDetail(); }
    if (e.key === 'ArrowLeft' && currentIndex > 0) { currentIndex--; openDetail(); }
  });

  searchInput.addEventListener('input', filterAndRender);

  // Init
  renderTabs();
  renderGrid();
})();
