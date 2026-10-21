/* =========================================================
   VELOX MARKET — shared behaviour
   Sections: session/auth, header account state, marketplace UI,
   auth (login) page, dashboard page.
   ========================================================= */

const VM_AUTH_KEY = "veloxmarket_session";
const VM_ROLE_ROUTES = { consumer: "dashboard.html", producer: "dashboard.html", courier: "dashboard.html" };
const VM_ROLE_LABEL = { consumer: "Consumer", producer: "Producer", courier: "Courier" };

document.addEventListener('DOMContentLoaded', () => {
  initToast();
  initHeaderAccountState();
  initAuthModal();
  initFavorites();
  initMobileNav();
  initChips();
  initGallery();
  initPostAdStepper();
  initCategoryPicker();
  initFilterToggle();
  initSearchForm();
  initAuthPage();
  initDashboardPage();
});

/* =========================================================
   SESSION — the only code that touches localStorage.
   ========================================================= */
function vmSaveSession(role, extra = {}) {
  const session = { role, loggedInAt: Date.now(), ...extra };
  localStorage.setItem(VM_AUTH_KEY, JSON.stringify(session));
  return session;
}

function vmGetSession() {
  const raw = localStorage.getItem(VM_AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    localStorage.removeItem(VM_AUTH_KEY);
    return null;
  }
}

function vmClearSession() {
  localStorage.removeItem(VM_AUTH_KEY);
}

/* ---------- header "Login" / "Dashboard" slot on every page ---------- */
function initHeaderAccountState() {
  const slots = document.querySelectorAll('[data-account-slot]');
  if (!slots.length) return;
  const session = vmGetSession();
  slots.forEach(slot => {
    if (session) {
      slot.innerHTML = `<a href="dashboard.html" class="icon-link">👤 <span>${VM_ROLE_LABEL[session.role] || 'Account'}</span></a>`;
    } else {
      slot.innerHTML = `<a href="login.html" class="icon-link">👤 <span>Login</span></a>`;
    }
  });
}

/* ---------- toast ---------- */
function initToast() {
  const toast = document.getElementById('toast');
  if (!toast) return;
  window.showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  };
}

/* ---------- lightweight auth modal (used to gate "chat / show phone" on listing.html) ---------- */
function initAuthModal() {
  const overlay = document.getElementById('authModal');
  if (!overlay) return;
  const openers = document.querySelectorAll('[data-open-auth]');
  const closers = overlay.querySelectorAll('[data-close-auth]');

  openers.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    // Already signed in — no need for the modal, just confirm.
    if (vmGetSession()) {
      showToast && showToast('You are already signed in.');
      return;
    }
    overlay.classList.add('is-open');
  }));
  closers.forEach(btn => btn.addEventListener('click', () => overlay.classList.remove('is-open')));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('is-open'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.classList.remove('is-open'); });

  const form = overlay.querySelector('form');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    overlay.classList.remove('is-open');
    showToast && showToast('Signed in — head to your dashboard for the full experience.');
  });
}

/* ---------- favourite heart toggle ---------- */
function initFavorites() {
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.toggle('is-fav');
      btn.textContent = btn.classList.contains('is-fav') ? '♥' : '♡';
      showToast && showToast(btn.classList.contains('is-fav') ? 'Saved to favourites' : 'Removed from favourites');
    });
  });
}

/* ---------- mobile nav toggle ---------- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const strip = document.querySelector('.cat-strip');
  if (!toggle || !strip) return;
  toggle.addEventListener('click', () => {
    strip.classList.toggle('is-open');
    strip.style.display = strip.classList.contains('is-open') ? 'block' : '';
  });
}

/* ---------- location / filter chips ---------- */
function initChips() {
  document.querySelectorAll('.chip-row').forEach(row => {
    row.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        row.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
      });
    });
  });
}

/* ---------- listing gallery (listing.html) ---------- */
function initGallery() {
  const main = document.querySelector('.gallery-main');
  const thumbs = document.querySelectorAll('.gallery-thumbs div');
  if (!main || !thumbs.length) return;
  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
      main.style.filter = `hue-rotate(${i * 18}deg)`;
    });
  });
}

/* ---------- post an ad stepper (post-ad.html) ---------- */
function initPostAdStepper() {
  const steps = document.querySelectorAll('.step-item');
  const panels = document.querySelectorAll('.form-panel');
  if (!steps.length) return;
  let current = 0;

  const nextBtns = document.querySelectorAll('[data-step-next]');
  const prevBtns = document.querySelectorAll('[data-step-prev]');

  function render() {
    steps.forEach((s, i) => {
      s.classList.toggle('is-active', i === current);
      s.classList.toggle('is-done', i < current);
    });
    panels.forEach((p, i) => p.classList.toggle('is-active', i === current));
  }

  nextBtns.forEach(btn => btn.addEventListener('click', () => {
    if (current < steps.length - 1) {
      current++;
      render();
      window.scrollTo({ top: document.querySelector('.form-card').offsetTop - 90, behavior: 'smooth' });
    } else {
      showToast && showToast('Your ad has been submitted for review!');
    }
  }));
  prevBtns.forEach(btn => btn.addEventListener('click', () => {
    if (current > 0) { current--; render(); }
  }));

  steps.forEach((s, i) => s.addEventListener('click', () => { current = i; render(); }));

  render();
}

/* ---------- category picker inside post-ad step 1 ---------- */
function initCategoryPicker() {
  const picks = document.querySelectorAll('.cat-pick-btn');
  picks.forEach(btn => btn.addEventListener('click', () => {
    picks.forEach(b => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
  }));
}

/* ---------- filter sidebar collapse on mobile (category.html) ---------- */
function initFilterToggle() {
  const toggle = document.querySelector('[data-filter-toggle]');
  const sidebar = document.querySelector('.filters-sidebar');
  if (!toggle || !sidebar) return;
  toggle.addEventListener('click', () => sidebar.classList.toggle('is-open'));
}

/* ---------- search form ---------- */
function initSearchForm() {
  document.querySelectorAll('.search-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      const input = form.querySelector('.search-input');
      if (input && !input.value.trim() && form.dataset.allowEmpty !== 'true') {
        e.preventDefault();
        input.focus();
      }
    });
  });
}

/* =========================================================
   LOGIN PAGE (login.html)
   ========================================================= */
function initAuthPage() {
  const page = document.querySelector('[data-page="auth"]');
  if (!page) return;

  // Already signed in — skip the form and go straight to the dashboard.
  if (vmGetSession()) {
    window.location.replace('dashboard.html');
    return;
  }

  const tabs = page.querySelectorAll('.auth-tab');
  const panels = page.querySelectorAll('.auth-panel');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.toggle('is-active', t === tab));
    panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab));
  }));

  page.querySelectorAll('.role-picker').forEach(picker => {
    const buttons = picker.querySelectorAll('.role-btn');
    buttons.forEach(btn => btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      picker.dataset.selectedRole = btn.dataset.role;
    }));
  });

  function selectedRole(picker) {
    return picker?.dataset.selectedRole || picker?.querySelector('.role-btn.is-selected')?.dataset.role || 'consumer';
  }

  function showError(panel, message) {
    let box = panel.querySelector('.auth-error');
    if (!box) {
      box = document.createElement('div');
      box.className = 'auth-error';
      panel.prepend(box);
    }
    box.textContent = message;
  }

  const loginForm = document.getElementById('vm-login-form');
  if (loginForm) loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('vm-login-email').value.trim();
    const password = document.getElementById('vm-login-password').value;
    const picker = loginForm.querySelector('.role-picker');
    const role = selectedRole(picker);

    if (!email || !password) {
      showError(loginForm, 'Enter both an email and a password.');
      return;
    }
    vmSaveSession(role, { email });
    window.location.href = VM_ROLE_ROUTES[role];
  });

  const registerForm = document.getElementById('vm-register-form');
  if (registerForm) registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('vm-reg-name').value.trim();
    const email = document.getElementById('vm-reg-email').value.trim();
    const password = document.getElementById('vm-reg-password').value;
    const picker = registerForm.querySelector('.role-picker');
    const role = selectedRole(picker);

    if (!name || !email || !password) {
      showError(registerForm, 'Fill in your name, email, and password.');
      return;
    }
    vmSaveSession(role, { email, name });
    window.location.href = VM_ROLE_ROUTES[role];
  });

  const walletBtns = page.querySelectorAll('[data-wallet-connect]');
  walletBtns.forEach(btn => btn.addEventListener('click', () => {
    const panel = btn.closest('.auth-panel');
    const picker = panel.querySelector('.role-picker');
    const role = selectedRole(picker);
    const mockWalletAddress = '0x' + Math.random().toString(16).slice(2, 10) + '…';
    vmSaveSession(role, { walletAddress: mockWalletAddress });
    window.location.href = VM_ROLE_ROUTES[role];
  }));
}

/* =========================================================
   DASHBOARD PAGE (dashboard.html)
   ========================================================= */
function initDashboardPage() {
  const page = document.querySelector('[data-page="dashboard"]');
  if (!page) return;

  const session = vmGetSession();
  if (!session) {
    window.location.replace('login.html');
    return;
  }

  document.querySelectorAll('[data-role-badge]').forEach(el => { el.textContent = session.role; });
  document.querySelectorAll('[data-account-name]').forEach(el => {
    el.textContent = session.name || session.email || (session.walletAddress ? 'Wallet user' : 'there');
  });

  // Reveal only the panel matching the signed-in role.
  document.querySelectorAll('[data-role-panel]').forEach(panel => {
    panel.style.display = panel.dataset.rolePanel === session.role ? 'grid' : 'none';
  });

  const logoutBtn = document.getElementById('vm-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    vmClearSession();
    window.location.href = 'login.html';
  });
}
