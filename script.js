const storageKeys = {
  cart: 'amazonCloneCart',
  wishlist: 'amazonCloneWishlist',
  prefs: 'amazonClonePrefs',
};

const defaultState = {
  cart: [],
  wishlist: [],
  country: 'United States',
  language: 'English',
  darkMode: false,
};

const state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKeys.prefs) || '{}');
    return {
      ...defaultState,
      ...saved,
      cart: JSON.parse(localStorage.getItem(storageKeys.cart) || '[]'),
      wishlist: JSON.parse(localStorage.getItem(storageKeys.wishlist) || '[]'),
    };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(storageKeys.cart, JSON.stringify(state.cart));
  localStorage.setItem(storageKeys.wishlist, JSON.stringify(state.wishlist));
  localStorage.setItem(storageKeys.prefs, JSON.stringify({
    country: state.country,
    language: state.language,
    darkMode: state.darkMode,
  }));
}

function getElements() {
  return {
    cartToggle: document.getElementById('cartToggle'),
    closeCart: document.getElementById('closeCart'),
    cartDrawer: document.getElementById('cartDrawer'),
    overlay: document.getElementById('overlay'),
    settingsToggle: document.getElementById('settingsToggle'),
    closeSettings: document.getElementById('closeSettings'),
    settingsPanel: document.getElementById('settingsPanel'),
    saveSettings: document.getElementById('saveSettings'),
    cartItems: document.getElementById('cartItems'),
    cartCount: document.getElementById('cartCount'),
    cartTotal: document.getElementById('cartTotal'),
    wishlistCount: document.getElementById('wishlistCount'),
    languageButton: document.getElementById('languageButton'),
    countryButton: document.getElementById('countryButton'),
    countryLabel: document.getElementById('countryLabel'),
    activeRegion: document.getElementById('activeRegion'),
    activeLanguage: document.getElementById('activeLanguage'),
    settingsCountry: document.getElementById('settingsCountry'),
    settingsLanguage: document.getElementById('settingsLanguage'),
    darkModeToggle: document.getElementById('darkModeToggle'),
  };
}

function openCart() {
  const { cartDrawer, overlay } = getElements();
  cartDrawer?.classList.add('open');
  overlay?.classList.add('show');
}

function closeDrawer() {
  const { cartDrawer, overlay, settingsPanel } = getElements();
  cartDrawer?.classList.remove('open');
  overlay?.classList.remove('show');
  settingsPanel?.classList.remove('open');
}

function renderCart() {
  const { cartItems, cartCount, cartTotal } = getElements();
  if (!cartItems) return;

  if (!state.cart.length) {
    cartItems.innerHTML = '<p class="cart-item">Your Amazon Cart is empty.</p>';
  } else {
    cartItems.innerHTML = state.cart.map((item) => `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong>
          <div>$${item.price.toFixed(2)}</div>
        </div>
        <span>${item.qty}x</span>
      </div>
    `).join('');
  }

  const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (cartCount) cartCount.textContent = state.cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartTotal) cartTotal.textContent = `Subtotal: $${total.toFixed(2)}`;
}

function renderWishlist() {
  const { wishlistCount } = getElements();
  if (wishlistCount) wishlistCount.textContent = `${state.wishlist.length} saved`;
}

function updatePreferences() {
  const { countryLabel, activeRegion, activeLanguage, countryButton, languageButton } = getElements();
  if (countryLabel) countryLabel.textContent = state.country;
  if (activeRegion) activeRegion.textContent = state.country;
  if (activeLanguage) activeLanguage.textContent = state.language;
  if (countryButton) countryButton.textContent = state.country === 'United States' ? '🇺🇸 US' : '🌍 ' + state.country;
  if (languageButton) languageButton.textContent = state.language === 'English' ? 'EN' : state.language.slice(0, 2).toUpperCase();
  document.body.classList.toggle('dark', state.darkMode);
}

function addToCart(name, price) {
  const existing = state.cart.find((item) => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ name, price, qty: 1 });
  }
  saveState();
  renderCart();
  openCart();
}

function toggleWishlist(name, button) {
  const exists = state.wishlist.includes(name);
  if (exists) {
    state.wishlist = state.wishlist.filter((item) => item !== name);
    button.classList.remove('active');
    button.textContent = '♡';
  } else {
    state.wishlist.push(name);
    button.classList.add('active');
    button.textContent = '❤';
  }
  saveState();
  renderWishlist();
}

function bindEvents() {
  const { cartToggle, closeCart, overlay, settingsToggle, closeSettings, saveSettings, settingsCountry, settingsLanguage, darkModeToggle } = getElements();

  cartToggle?.addEventListener('click', openCart);
  closeCart?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  settingsToggle?.addEventListener('click', () => {
    if (settingsCountry) settingsCountry.value = state.country;
    if (settingsLanguage) settingsLanguage.value = state.language;
    if (darkModeToggle) darkModeToggle.checked = state.darkMode;
    const { settingsPanel, overlay } = getElements();
    settingsPanel?.classList.add('open');
    overlay?.classList.add('show');
  });
  closeSettings?.addEventListener('click', closeDrawer);
  saveSettings?.addEventListener('click', () => {
    if (settingsCountry) state.country = settingsCountry.value;
    if (settingsLanguage) state.language = settingsLanguage.value;
    if (darkModeToggle) state.darkMode = darkModeToggle.checked;
    saveState();
    updatePreferences();
    closeDrawer();
  });

  document.querySelectorAll('.add-cart').forEach((button) => {
    button.addEventListener('click', () => addToCart(button.dataset.name, parseFloat(button.dataset.price)));
  });

  document.querySelectorAll('.wishlist-btn').forEach((button) => {
    button.addEventListener('click', () => toggleWishlist(button.dataset.name, button));
  });
}

bindEvents();
updatePreferences();
renderCart();
renderWishlist();
