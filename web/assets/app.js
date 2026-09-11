/* Shared page helpers: theme, nav rendering, guards, formatting. */

/* The logo lives in one place: assets/logo.svg. Replace that file to change
   it across every page - any web image format works. */
const LOGO_IMG = '<img src="assets/logo.svg" alt="" width="20" height="20" class="logo-img" />';

const ICON_SUN = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">
  <circle cx="12" cy="12" r="4"/>
  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
</svg>`;

const ICON_MOON = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>
</svg>`;

const ICON_CARET = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M6 9l6 6 6-6"/>
</svg>`;

/* ---------------- theme ---------------- */

const Theme = {
  get() { return localStorage.getItem('ce_theme') === 'dark' ? 'dark' : 'light'; },
  apply(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('ce_theme', mode);
  },
  toggle() {
    const next = Theme.get() === 'dark' ? 'light' : 'dark';
    Theme.apply(next);
    // Remember the choice server-side too; failure here is not worth blocking on.
    if (Auth.token) api.updateSettings({ theme: next }).catch(() => {});
    return next;
  }
};

// Apply the saved theme immediately so the page never flashes the wrong one.
Theme.apply(Theme.get());

/* ---------------- guards ---------------- */

function requireAuth() {
  if (!Auth.token) {
    window.location.href = 'signin.html';
    return false;
  }
  return true;
}

/* ---------------- chrome ---------------- */

function initials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function avatarMarkup(user, extraClass = '') {
  const cls = `avatar ${extraClass}`.trim();
  return user && user.avatar
    ? `<img class="${cls}" src="${imageUrl(user.avatar)}" alt="" />`
    : `<span class="${cls}">${escapeHtml(initials(user && user.name))}</span>`;
}

function renderNav(current) {
  const user = Auth.user;
  const isOrganizer = user && user.role === 'organizer';

  const links = [{ href: 'events.html', label: 'Events' }];
  if (isOrganizer) links.push({ href: 'create-event.html', label: 'Create Event' });

  const nav = links
    .map((l) => `<a href="${l.href}"${l.href === current ? ' class="active"' : ''}>${l.label}</a>`)
    .join('');

  const institutionName =
    (user && user.institution && user.institution.name) ? user.institution.name : '';

  document.getElementById('topbar').innerHTML = `
    <div class="topbar-inner">
      <a class="brand" href="events.html">
        <span class="mark">${LOGO_IMG}</span>
        <span>Campus Events</span>
      </a>
      ${institutionName ? `<span class="brand-sub">${escapeHtml(institutionName)}</span>` : ''}

      <nav class="nav">${nav}</nav>

      <div class="topbar-right">
        <span class="role-badge">${isOrganizer ? 'Organizer' : 'Participant'}</span>

        <button class="icon-btn" id="theme-toggle" type="button"
                title="Switch theme" aria-label="Switch theme"></button>

        <div class="account">
          <button class="account-trigger" id="account-trigger" type="button"
                  aria-haspopup="true" aria-expanded="false">
            ${avatarMarkup(user)}
            ${ICON_CARET}
          </button>

          <div class="menu" id="account-menu" hidden>
            <div class="menu-head">
              <div class="menu-name">${escapeHtml(user ? user.name : '')}</div>
              <div class="menu-sub">${escapeHtml(user ? user.email : '')}</div>
            </div>
            <a href="profile.html">Profile &amp; settings</a>
            <button type="button" id="menu-theme">Switch to <span id="menu-theme-target"></span> theme</button>
            <button type="button" id="logout">Sign out</button>
          </div>
        </div>
      </div>
    </div>`;

  // --- theme control ---
  const toggle = document.getElementById('theme-toggle');
  const menuThemeTarget = document.getElementById('menu-theme-target');

  const paintTheme = () => {
    const dark = Theme.get() === 'dark';
    toggle.innerHTML = dark ? ICON_SUN : ICON_MOON;
    if (menuThemeTarget) menuThemeTarget.textContent = dark ? 'light' : 'dark';
  };
  paintTheme();

  toggle.addEventListener('click', () => { Theme.toggle(); paintTheme(); });
  document.getElementById('menu-theme').addEventListener('click', () => { Theme.toggle(); paintTheme(); });

  // --- account dropdown ---
  const trigger = document.getElementById('account-trigger');
  const menu = document.getElementById('account-menu');

  const closeMenu = () => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
    trigger.setAttribute('aria-expanded', String(!menu.hidden));
  });

  menu.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  document.getElementById('logout').addEventListener('click', () => {
    Auth.clear();
    window.location.href = 'signin.html';
  });
}

/* ---------------- formatting ---------------- */

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function formatDate(value) {
  const d = new Date(value);
  if (isNaN(d)) return '';
  return d.toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function imageUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : api.base.replace(/\/api$/, '') + path;
}

/** Only allow links we are prepared to render as an anchor. */
function safeUrl(value) {
  try {
    const url = new URL(String(value));
    return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : '';
  } catch {
    return '';
  }
}

function showNote(el, message, kind = 'error') {
  el.innerHTML = `<div class="note note-${kind === 'error' ? 'error' : 'ok'}">${escapeHtml(message)}</div>`;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearNote(el) { el.innerHTML = ''; }
