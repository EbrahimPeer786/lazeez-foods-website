// ============================
// NAV SCROLL EFFECT
// ============================
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }
}, { passive: true });

// ============================
// MENU TABS
// ============================
function showTab(name, btn) {
  document.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  if (btn) btn.classList.add('active');
}

// ============================
// ANIMATIONS
// ============================
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.menu-item, .info-card, .catering-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  obs.observe(el);
});

// ============================
// GALLERY LAZY LOAD
// ============================
const imgObs = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const img = entry.target;
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
    observer.unobserve(img);
  });
}, { rootMargin: '200px' });

document.querySelectorAll('.gallery-card img[data-src]').forEach(img => {
  imgObs.observe(img);
});

// ============================
// PAUSE ANIMATION WHEN TAB HIDDEN
// ============================
const galleryTrack = document.querySelector('.gallery-track');
document.addEventListener('visibilitychange', () => {
  if (galleryTrack) {
    galleryTrack.style.animationPlayState =
      document.hidden ? 'paused' : 'running';
  }

  if (!document.hidden) {
    askToClearCartAfterWhatsApp();
  }
});

// ============================
// MOBILE MENU
// ============================
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('show');
    });
  });
}

document.querySelectorAll('a[target="_blank"]').forEach(link => {
  link.rel = 'noopener noreferrer';
});

// ============================
// CART SYSTEM
// ============================
const WHATSAPP_NUMBER = '27723480786';
const CART_STORAGE_KEY = 'lazeezFoodsCart';
const cart = [];

const cartPanel = document.getElementById('cartPanel');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartCountEl = document.getElementById('cartCount');
const checkoutModal = document.getElementById('checkoutModal');
const checkoutForm = document.getElementById('checkoutForm');
const orderTypeEl = document.getElementById('orderType');
const customerHouseNumberEl = document.getElementById('customerHouseNumber');
const customerAddressEl = document.getElementById('customerAddress');
const checkoutSummaryEl = document.getElementById('checkoutSummary');
let deliveryChargeNoticeShown = false;
let waitingForWhatsAppReturn = false;
let canAskToClearCart = false;

const cartToggleEl = document.getElementById('cartToggle');
try {
  localStorage.removeItem(CART_STORAGE_KEY);
} catch {
  // Ignore storage errors; the in-memory cart already starts empty.
}

if (cartToggleEl && cartCountEl) {
  cartToggleEl.textContent = '';
  cartToggleEl.append('Cart ');
  cartToggleEl.appendChild(cartCountEl);
  cartToggleEl.setAttribute('type', 'button');
  cartToggleEl.setAttribute('aria-label', 'Open cart');
}

const checkoutBox = document.querySelector('.checkout-box');
if (checkoutBox && !document.getElementById('closeCheckout')) {
  const closeCheckoutBtn = document.createElement('button');
  closeCheckoutBtn.id = 'closeCheckout';
  closeCheckoutBtn.type = 'button';
  closeCheckoutBtn.textContent = 'x';
  closeCheckoutBtn.setAttribute('aria-label', 'Close checkout');
  checkoutBox.prepend(closeCheckoutBtn);
}

function saveCart() {
  try {
    if (cart.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  } catch {
    // The cart still works for the current visit if storage is unavailable.
  }
}

function clearCart() {
  cart.splice(0, cart.length);
  saveCart();
  renderCart();
}

function askToClearCartAfterWhatsApp() {
  if (!waitingForWhatsAppReturn || !canAskToClearCart || cart.length === 0) return;

  waitingForWhatsAppReturn = false;
  canAskToClearCart = false;

  const shouldClearCart = confirm('Welcome back. Would you like to clear your cart now that your WhatsApp order has been prepared?');

  if (shouldClearCart) {
    clearCart();
    closeCart();
  }
}

function formatMoney(value) {
  return `R${Number(value).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function openExternalUrl(url) {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (newWindow) newWindow.opener = null;
}

function getItemCategory(item) {
  const grid = item.closest('.menu-grid');
  let sibling = grid?.previousElementSibling;

  while (sibling) {
    if (sibling.classList?.contains('menu-cat-title')) {
      return sibling.textContent.trim();
    }
    sibling = sibling.previousElementSibling;
  }

  return item.closest('.menu-panel')?.id?.replace('tab-', '') || 'Menu';
}

function makeCartKey(name, category, price) {
  return `${category}|${name}|${price}`;
}

function getTodayName() {
  return new Intl.DateTimeFormat('en-ZA', { weekday: 'long' }).format(new Date());
}

function canOrderSpecial(requiredDay, itemName) {
  if (!requiredDay) return true;

  const today = getTodayName();
  if (today === requiredDay) return true;

  alert(`${itemName} is only available on ${requiredDay}. Today is ${today}, so this special cannot be ordered today.`);
  return false;
}

function markAvailableWeekdaySpecials() {
  const today = getTodayName();

  document.querySelectorAll('.weekday-special[data-special-day]').forEach(item => {
    const requiredDay = item.dataset.specialDay;
    item.classList.toggle('is-available-today', requiredDay === today);
    item.classList.toggle('is-unavailable-today', requiredDay !== today);
  });
}

function addToCart({ name, category = 'Menu', price }) {
  const parsedPrice = Number(price);
  if (!name || Number.isNaN(parsedPrice) || parsedPrice <= 0) return;

  const key = makeCartKey(name, category, parsedPrice);
  const existingItem = cart.find(item => item.key === key);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      key,
      name,
      category,
      price: parsedPrice,
      qty: 1
    });
  }

  saveCart();
  renderCart();
  openCart();
}

function getCartTotals() {
  return cart.reduce((totals, item) => {
    totals.total += item.price * item.qty;
    totals.count += item.qty;
    return totals;
  }, { total: 0, count: 0 });
}

function openCart() {
  cartPanel?.classList.add('open');
  document.body.classList.add('cart-open');
}

function closeCart() {
  cartPanel?.classList.remove('open');
  document.body.classList.remove('cart-open');
}

function openCheckout() {
  updateCheckoutSummary();
  checkoutModal?.classList.add('show');
  document.body.classList.add('modal-open');
  document.getElementById('customerName')?.focus();
}

function closeCheckout() {
  checkoutModal?.classList.remove('show');
  document.body.classList.remove('modal-open');
}

function updateDeliveryFields() {
  if (!orderTypeEl || !customerAddressEl) return;
  const isDelivery = orderTypeEl.value === 'Delivery';
  if (customerHouseNumberEl) {
    customerHouseNumberEl.required = isDelivery;
    customerHouseNumberEl.style.display = isDelivery ? '' : 'none';
  }
  customerAddressEl.required = isDelivery;
  customerAddressEl.style.display = isDelivery ? '' : 'none';
  const fieldWrapper = customerAddressEl.closest('.delivery-address');
  fieldWrapper?.classList.toggle('is-visible', isDelivery);

  if (isDelivery && !deliveryChargeNoticeShown) {
    alert('Delivery charges will be TBD. Lazeez Foods will confirm the delivery price.');
    deliveryChargeNoticeShown = true;
  }
}

function updateCheckoutSummary() {
  if (!checkoutSummaryEl) return;
  const { total, count } = getCartTotals();
  checkoutSummaryEl.textContent = `${count} item${count === 1 ? '' : 's'} - ${formatMoney(total)}`;
}

function isValidPhoneNumber(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10;
}

document.getElementById('cartToggle')?.addEventListener('click', openCart);
document.getElementById('closeCart')?.addEventListener('click', closeCart);
document.getElementById('closeCheckout')?.addEventListener('click', closeCheckout);
orderTypeEl?.addEventListener('change', updateDeliveryFields);

checkoutModal?.addEventListener('click', event => {
  if (event.target === checkoutModal) {
    closeCheckout();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeCart();
    closeCheckout();
  }
});

window.addEventListener('focus', askToClearCartAfterWhatsApp);

// ============================
// ADD BUTTONS TO MENU ITEMS
// ============================
document.querySelectorAll('.menu-item').forEach(item => {
  if (item.classList.contains('bunny-big')) return;

  const nameEl = item.querySelector('.mi-name');
  const priceEl = item.querySelector('.mi-price');
  if (!nameEl || !priceEl || item.querySelector('.add-btn')) return;

  const name = nameEl.textContent.trim();
  const category = getItemCategory(item);
  const price = parseFloat(priceEl.textContent.replace(/[^\d.]/g, ''));
  if (Number.isNaN(price)) return;

  const btn = document.createElement('button');
  btn.className = 'add-btn';
  btn.type = 'button';
  btn.textContent = 'Add';
  btn.setAttribute('aria-label', `Add ${name} to cart`);

  btn.addEventListener('click', () => {
    if (!canOrderSpecial(item.dataset.specialDay, name)) return;

    addToCart({ name, category, price });
    btn.textContent = 'Added';
    setTimeout(() => {
      btn.textContent = 'Add';
    }, 900);
  });

  item.appendChild(btn);
});

// ============================
// RENDER CART
// ============================
function renderCart() {
  if (!cartItemsEl || !cartTotalEl || !cartCountEl) return;

  cartItemsEl.innerHTML = '';

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    cartTotalEl.textContent = '0.00';
    cartCountEl.textContent = '0';
    updateCheckoutSummary();
    return;
  }

  cart.forEach((item, index) => {
    const lineTotal = item.price * item.qty;
    const cartRow = document.createElement('div');
    cartRow.className = 'cart-item';

    cartRow.innerHTML = `
      <div class="cart-item-main">
        <div class="cart-item-category">${escapeHtml(item.category)}</div>
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-meta">${formatMoney(item.price)} x ${item.qty}</div>
        <div class="cart-item-total">${formatMoney(lineTotal)}</div>
      </div>
      <div class="cart-item-actions" aria-label="Update ${escapeHtml(item.name)} quantity">
        <button type="button" data-action="increase" data-index="${index}" aria-label="Increase quantity">+</button>
        <button type="button" data-action="decrease" data-index="${index}" aria-label="Decrease quantity">-</button>
        <button type="button" data-action="remove" data-index="${index}" aria-label="Remove item">x</button>
      </div>
    `;

    cartItemsEl.appendChild(cartRow);
  });

  const { total, count } = getCartTotals();
  cartTotalEl.textContent = total.toFixed(2);
  cartCountEl.textContent = count.toString();
  updateCheckoutSummary();
}

// ============================
// CART BUTTON ACTIONS
// ============================
cartItemsEl?.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const action = target.dataset.action;
  const index = Number(target.dataset.index);
  if (Number.isNaN(index) || !cart[index]) return;

  if (action === 'increase') {
    cart[index].qty += 1;
  } else if (action === 'decrease') {
    cart[index].qty -= 1;
    if (cart[index].qty <= 0) cart.splice(index, 1);
  } else if (action === 'remove') {
    cart.splice(index, 1);
  }

  saveCart();
  renderCart();
});

// ============================
// CHECKOUT
// ============================
document.getElementById('checkoutBtn')?.addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }

  openCheckout();
});

// ============================
// SEND TO WHATSAPP
// ============================
function submitOrder(event) {
  event.preventDefault();

  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }

  const customerName = document.getElementById('customerName')?.value.trim() || '';
  const customerSurname = document.getElementById('customerSurname')?.value.trim() || '';
  const customerPhone = document.getElementById('customerPhone')?.value.trim() || '';
  const orderType = orderTypeEl?.value || 'Collection';
  const customerHouseNumber = customerHouseNumberEl?.value.trim() || '';
  const customerAddress = customerAddressEl?.value.trim() || '';
  const customerNotes = document.getElementById('customerNotes')?.value.trim() || '';
  const { total } = getCartTotals();

  if (!customerName) {
    alert('Please enter your name before sending the order.');
    document.getElementById('customerName')?.focus();
    return;
  }

  if (!customerPhone) {
    alert('Please enter your phone number before sending the order.');
    document.getElementById('customerPhone')?.focus();
    return;
  }

  if (!isValidPhoneNumber(customerPhone)) {
    alert('Please enter a valid phone number with at least 10 digits.');
    document.getElementById('customerPhone')?.focus();
    return;
  }

  if (orderType === 'Delivery' && !customerHouseNumber) {
    alert('Please enter your house number for delivery.');
    customerHouseNumberEl?.focus();
    return;
  }

  if (checkoutForm) {
    if (!checkoutForm.reportValidity()) return;
  } else {
    if (!customerName || !customerPhone || !orderType) {
      alert('Please enter your name, phone number and order type.');
      return;
    }

    if (orderType === 'Delivery' && !customerHouseNumber) {
      alert('Please enter your house number for delivery.');
      customerHouseNumberEl?.focus();
      return;
    }

    if (orderType === 'Delivery' && !customerAddress) {
      alert('Please enter a delivery address.');
      customerAddressEl?.focus();
      return;
    }
  }

  const lines = [
    'Hello Lazeez Foods, I would like to place an order.',
    '',
    `Name: ${customerName}`
  ];

  if (customerSurname) {
    lines.push(`Surname: ${customerSurname}`);
  }

  lines.push(
    `Phone: ${customerPhone}`,
    `Order type: ${orderType}`
  );

  if (orderType === 'Delivery') {
    lines.push('Delivery charge: TBD - Lazeez Foods will confirm the delivery price.');
    lines.push(`House number: ${customerHouseNumber}`);
    lines.push(`Address: ${customerAddress}`);
  }

  lines.push('', 'Items:');

  cart.forEach((item, index) => {
    const lineTotal = item.price * item.qty;
    lines.push(`${index + 1}. ${item.name} (${item.category}) x${item.qty} - ${formatMoney(lineTotal)}`);
  });

  lines.push('', `Total: ${formatMoney(total)}`);

  if (customerNotes) {
    lines.push('', `Notes: ${customerNotes}`);
  }

  lines.push('', 'Please confirm availability and preparation time.');

  alert('Thank you for placing your order with Lazeez Foods. You will now be redirected to WhatsApp. Please press Send in WhatsApp to confirm and submit your order.');

  waitingForWhatsAppReturn = true;
  canAskToClearCart = false;
  openExternalUrl(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`);
  closeCheckout();

  setTimeout(() => {
    canAskToClearCart = true;
  }, 1500);
}

checkoutForm?.addEventListener('submit', submitOrder);
document.getElementById('approveOrder')?.addEventListener('click', event => {
  if (!checkoutForm) submitOrder(event);
});

document.querySelectorAll('.bunny-cell').forEach(cell => {
  cell.setAttribute('role', 'button');
  cell.setAttribute('tabindex', '0');

  const addBunnyToCart = () => {
    const name = cell.dataset.name;
    const price = Number(cell.dataset.price);
    if (!name || !price) return;

    addToCart({
      name,
      category: 'Bunny Chows',
      price
    });

    const originalText = cell.textContent;
    cell.textContent = 'Added';
    cell.classList.add('is-added');

    setTimeout(() => {
      cell.textContent = originalText;
      cell.classList.remove('is-added');
    }, 900);
  };

  cell.addEventListener('click', addBunnyToCart);
  cell.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      addBunnyToCart();
    }
  });
});

updateDeliveryFields();
markAvailableWeekdaySpecials();
renderCart();
