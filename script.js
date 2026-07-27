// ==========================================
// Storage Configuration
// ==========================================

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

let state = loadState();

// ==========================================
// State Management
// ==========================================

/**
 * Load state from localStorage with fallback to defaults
 * @returns {Object} Current application state
 */
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKeys.prefs) || '{}');
    
    // Validate data types
    if (typeof saved.country !== 'string') saved.country = defaultState.country;
    if (typeof saved.language !== 'string') saved.language = defaultState.language;
    if (typeof saved.darkMode !== 'boolean') saved.darkMode = defaultState.darkMode;
    
    const cart = JSON.parse(localStorage.getItem(storageKeys.cart) || '[]');
    const wishlist = JSON.parse(localStorage.getItem(storageKeys.wishlist) || '[]');
    
    // Validate cart items
    if (!Array.isArray(cart)) {
      console.warn('Invalid cart data, using default');
      return { ...defaultState };
    }
    
    return {
      ...defaultState,
      ...saved,
      cart: cart.filter(item => item.name && typeof item.price === 'number' && item.qty > 0),
      wishlist: Array.isArray(wishlist) ? wishlist : [],
    };
  } catch (e) {
    console.warn('Failed to load state:', e);
    return { ...defaultState };
  }
}

/**
 * Save current state to localStorage
 */
function saveState() {
  try {
    localStorage.setItem(storageKeys.cart, JSON.stringify(state.cart));
    localStorage.setItem(storageKeys.wishlist, JSON.stringify(state.wishlist));
    localStorage.setItem(storageKeys.prefs, JSON.stringify({
      country: state.country,
      language: state.language,
      darkMode: state.darkMode,
    }));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

// ==========================================
// DOM Elements
// ==========================================

/**
 * Cache and return frequently used DOM elements
 * @returns {Object} Object containing all DOM element references
 */
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
    locationButton: document.getElementById('locationButton'),
  };
}

// ==========================================
// Cart Management
// ==========================================

/**
 * Calculate total price of cart
 * @returns {number} Total cart value
 */
function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/**
 * Calculate total quantity in cart
 * @returns {number} Total number of items
 */
function getCartQuantity() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

/**
 * Add item to cart or increment quantity if already exists
 * @param {string} name - Product name
 * @param {number} price - Product price
 */
function addToCart(name, price) {
  // Validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    console.error('Invalid product name');
    return;
  }
  
  if (price === undefined || price === null || typeof price !== 'number' || price < 0) {
    console.error('Invalid product price');
    return;
  }
  
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

/**
 * Remove item from cart
 * @param {string} name - Product name to remove
 */
function removeFromCart(name) {
  if (!name || typeof name !== 'string') {
    console.error('Invalid product name');
    return;
  }
  
  state.cart = state.cart.filter(item => item.name !== name);
  saveState();
  renderCart();
}

/**
 * Update quantity of item in cart
 * @param {string} name - Product name
 * @param {number} qty - New quantity
 */
function updateCartItemQty(name, qty) {
  if (!name || typeof name !== 'string' || !Number.isInteger(qty) || qty < 1) {
    console.error('Invalid parameters for quantity update');
    return;
  }
  
  const item = state.cart.find(i => i.name === name);
  if (item) {
    item.qty = qty;
    saveState();
    renderCart();
  }
}

/**
 * Render cart items and update totals
 */
function renderCart() {
  const { cartItems, cartCount, cartTotal } = getElements();
  if (!cartItems) return;

  if (!state.cart.length) {
    cartItems.innerHTML = '<p class="cart-item empty-message">Your Amazon Cart is empty.</p>';
  } else {
    cartItems.innerHTML = state.cart.map((item) => `
      <div class="cart-item" data-name="${escapeHtml(item.name)}">
        <div class="item-details">
          <strong>${escapeHtml(item.name)}</strong>
          <div class="item-price">$${item.price.toFixed(2)}</div>
        </div>
        <div class="item-controls">
          <button class="qty-btn minus" aria-label="Decrease quantity">−</button>
          <span class="qty-display">${item.qty}x</span>
          <button class="qty-btn plus" aria-label="Increase quantity">+</button>
          <button class="remove-btn" aria-label="Remove from cart">✕</button>
        </div>
      </div>
    `).join('');
  }

  const total = getCartTotal();
  const quantity = getCartQuantity();
  
  if (cartCount) cartCount.textContent = quantity;
  if (cartTotal) cartTotal.textContent = `Subtotal: $${total.toFixed(2)}`;
}

/**
 * Render wishlist count
 */
function renderWishlist() {
  const { wishlistCount } = getElements();
  if (wishlistCount) {
    wishlistCount.textContent = `${state.wishlist.length} saved`;
  }
}

// ==========================================
// Wishlist Management
// ==========================================

/**
 * Toggle item in wishlist
 * @param {string} name - Product name
 * @param {HTMLElement} button - The wishlist button element
 */
function toggleWishlist(name, button) {
  if (!name || typeof name !== 'string' || !button) {
    console.error('Invalid parameters for wishlist toggle');
    return;
  }
  
  const exists = state.wishlist.includes(name);
  
  if (exists) {
    state.wishlist = state.wishlist.filter((item) => item !== name);
    button.classList.remove('active');
    button.textContent = '♡';
    button.setAttribute('aria-pressed', 'false');
  } else {
    state.wishlist.push(name);
    button.classList.add('active');
    button.textContent = '❤';
    button.setAttribute('aria-pressed', 'true');
  }
  
  saveState();
  renderWishlist();
}

// ==========================================
// UI State Management
// ==========================================

/**
 * Open cart drawer
 */
function openCart() {
  const { cartDrawer, overlay } = getElements();
  cartDrawer?.classList.add('open');
  overlay?.classList.add('show');
  document.body.style.overflow = 'hidden';
}

/**
 * Close all drawers and overlay
 */
function closeDrawer() {
  const { cartDrawer, overlay, settingsPanel } = getElements();
  cartDrawer?.classList.remove('open');
  overlay?.classList.remove('show');
  settingsPanel?.classList.remove('open');
  document.body.style.overflow = '';
}

/**
 * Open settings panel
 */
function openSettingsPanel() {
  const { settingsCountry, settingsLanguage, darkModeToggle, settingsPanel, overlay } = getElements();
  if (settingsCountry) settingsCountry.value = state.country;
  if (settingsLanguage) settingsLanguage.value = state.language;
  if (darkModeToggle) darkModeToggle.checked = state.darkMode;
  settingsPanel?.classList.add('open');
  overlay?.classList.add('show');
  document.body.style.overflow = 'hidden';
}

/**
 * Update preference display across the UI
 */
function updatePreferences() {
  const elements = getElements();
  
  // Update text content elements
  const textUpdates = {
    countryLabel: state.country,
    activeRegion: state.country,
    activeLanguage: state.language,
  };
  
  Object.entries(textUpdates).forEach(([key, value]) => {
    if (elements[key]) elements[key].textContent = value;
  });
  
  // Update country button with flag
  if (elements.countryButton) {
    elements.countryButton.textContent = state.country === 'United States' ? '🇺🇸 US' : '🌍 ' + state.country;
  }
  
  // Update language button
  if (elements.languageButton) {
    elements.languageButton.textContent = state.language === 'English' ? 'EN' : state.language.slice(0, 2).toUpperCase();
  }
  
  // Update form inputs
  if (elements.settingsCountry) elements.settingsCountry.value = state.country;
  if (elements.settingsLanguage) elements.settingsLanguage.value = state.language;
  if (elements.darkModeToggle) elements.darkModeToggle.checked = state.darkMode;
  
  // Apply dark mode
  document.body.classList.toggle('dark', state.darkMode);
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ==========================================
// Event Binding
// ==========================================

/**
 * Bind all event listeners to DOM elements
 */
function bindEvents() {
  const elements = getElements();
  
  // Cart toggle events
  elements.cartToggle?.addEventListener('click', openCart);
  elements.closeCart?.addEventListener('click', closeDrawer);
  elements.overlay?.addEventListener('click', closeDrawer);
  
  // Settings events
  elements.settingsToggle?.addEventListener('click', openSettingsPanel);
  elements.countryButton?.addEventListener('click', openSettingsPanel);
  elements.languageButton?.addEventListener('click', openSettingsPanel);
  elements.locationButton?.addEventListener('click', openSettingsPanel);
  elements.closeSettings?.addEventListener('click', closeDrawer);
  
  // Save settings
  elements.saveSettings?.addEventListener('click', () => {
    if (elements.settingsCountry) state.country = elements.settingsCountry.value;
    if (elements.settingsLanguage) state.language = elements.settingsLanguage.value;
    if (elements.darkModeToggle) state.darkMode = elements.darkModeToggle.checked;
    saveState();
    updatePreferences();
    closeDrawer();
  });
  
  // Event delegation for product buttons (add to cart)
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-cart')) {
      const name = e.target.dataset.name;
      const price = parseFloat(e.target.dataset.price);
      addToCart(name, price);
    }
    
    if (e.target.classList.contains('wishlist-btn')) {
      const name = e.target.dataset.name;
      toggleWishlist(name, e.target);
    }
    
    // Cart quantity controls
    if (e.target.classList.contains('qty-btn')) {
      const cartItem = e.target.closest('.cart-item');
      const itemName = cartItem?.dataset.name;
      const item = state.cart.find(i => i.name === itemName);
      
      if (item) {
        if (e.target.classList.contains('plus')) {
          updateCartItemQty(itemName, item.qty + 1);
        } else if (e.target.classList.contains('minus') && item.qty > 1) {
          updateCartItemQty(itemName, item.qty - 1);
        }
      }
    }
    
    // Remove from cart
    if (e.target.classList.contains('remove-btn')) {
      const cartItem = e.target.closest('.cart-item');
      const itemName = cartItem?.dataset.name;
      removeFromCart(itemName);
    }
  });
  
  // Initialize wishlist button states
  document.querySelectorAll('.wishlist-btn').forEach((button) => {
    const itemName = button.dataset.name;
    const isInWishlist = state.wishlist.includes(itemName);
    
    if (isInWishlist) {
      button.classList.add('active');
      button.textContent = '❤';
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.setAttribute('aria-pressed', 'false');
    }
    
    button.addEventListener('click', () => toggleWishlist(itemName, button));
  });
}

// ==========================================
// Initialization
// ==========================================

// Initialize application
bindEvents();
updatePreferences();
renderCart();
renderWishlist();
