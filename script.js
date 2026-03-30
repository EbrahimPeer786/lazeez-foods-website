window.addEventListener('scroll', () => {
  document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

function showTab(name, btn) {
  document.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
}

// Intersection observer for menu/info card animations
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      obs.unobserve(e.target); // stop watching once visible
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.menu-item, .info-card, .catering-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  obs.observe(el);
});

// ── Gallery lazy-load with IntersectionObserver ──────────────────────────────
// Swap data-src → src only when the card enters the viewport
const imgObs = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const img = entry.target;
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
    observer.unobserve(img);
  });
}, {
  // Start loading a little before the image scrolls into view
  rootMargin: '200px 400px 200px 400px'
});

document.querySelectorAll('.gallery-card img[data-src]').forEach(img => {
  imgObs.observe(img);
});

// ── Pause gallery animation when tab is hidden (saves CPU/GPU) ───────────────
const galleryTrack = document.querySelector('.gallery-track');
document.addEventListener('visibilitychange', () => {
  if (galleryTrack) {
    galleryTrack.style.animationPlayState =
      document.hidden ? 'paused' : 'running';
  }
});