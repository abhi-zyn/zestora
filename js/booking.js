/* ===== Booking Page JS ===== */
(function() {
  const form = document.getElementById('booking-form');
  const confirmation = document.querySelector('.booking-confirmation');
  const formWrapper = document.querySelector('.booking-form-wrapper');
  const reservationsList = document.querySelector('.reservations-list');

  // Reveal form fields sequentially
  const groups = document.querySelectorAll('.form-group');
  groups.forEach((g, i) => {
    setTimeout(() => g.classList.add('visible'), 200 + i * 120);
  });

  // Load existing reservations
  function getReservations() {
    return JSON.parse(localStorage.getItem('zestora-bookings') || '[]');
  }

  function renderReservations() {
    const bookings = getReservations();
    if (!reservationsList) return;
    if (bookings.length === 0) {
      reservationsList.innerHTML = '<p style="opacity:0.5;text-align:center;">No reservations yet</p>';
      return;
    }
    reservationsList.innerHTML = bookings.map(b => `
      <div class="reservation-card">
        <div class="res-info">
          <h4>${b.name}</h4>
          <p>${b.guests} guests · ${b.time}</p>
        </div>
        <div class="res-date">${b.date}</div>
      </div>
    `).join('');
  }

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      name: form.querySelector('#name').value,
      email: form.querySelector('#email').value,
      date: form.querySelector('#date').value,
      time: form.querySelector('#time').value,
      guests: form.querySelector('#guests').value,
      notes: form.querySelector('#notes').value,
      id: Date.now()
    };

    const bookings = getReservations();
    bookings.unshift(data);
    localStorage.setItem('zestora-bookings', JSON.stringify(bookings));

    // Show confirmation
    formWrapper.style.display = 'none';
    confirmation.classList.add('show');
    spawnConfetti();
    renderReservations();

    // Reset after delay
    setTimeout(() => {
      confirmation.classList.remove('show');
      formWrapper.style.display = 'block';
      form.reset();
      groups.forEach(g => { g.classList.remove('visible'); });
      groups.forEach((g, i) => { setTimeout(() => g.classList.add('visible'), 100 + i * 100); });
    }, 4000);
  });

  function spawnConfetti() {
    const container = document.querySelector('.confirmation-confetti');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#c9a961', '#e2bd78', '#f5e8d3', '#d97742', '#4a7a5a'];
    for (let i = 0; i < 30; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = '40%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.animationDuration = (1 + Math.random()) + 's';
      container.appendChild(piece);
    }
  }

  // Set min date to today
  const dateInput = form.querySelector('#date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  renderReservations();
})();
