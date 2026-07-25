// nav.js — Mobile hamburger drawer
// Injected into every page via inject_nav.py
// Requires: util.js already loaded (for toggleTheme, toggle24h)

(function () {

  var NAV_ITEMS = [
    { label:'World Clock',      href:'/',                         icon:'ti-clock'          },
    { label:'Converter',        href:'/converter.html',           icon:'ti-arrows-exchange'},
    { label:'Sun & Moon',       href:'/sunmoon.html',             icon:'ti-sun'            },
    { label:'Weather',          href:'/weather.html',             icon:'ti-cloud'          },
    { label:'Time Difference',  href:'/time-difference-calculator', icon:'ti-chart-bar'   },
    { label:'Tools',            href:'/tools.html',               icon:'ti-tool'           },
    { label:'Locations',        href:'/location/',                icon:'ti-map-pin'        },
    { label:'World Map',        href:'/world-time-map',           icon:'ti-map'            },
    { label:'Blog',             href:'/blog/',                    icon:'ti-pencil'         },
  ];

  var LOGO_SVG =
    '<svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    + '<defs>'
    + '<linearGradient id="dlg" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">'
    + '<stop offset="0%" stop-color="#3b82f6"/>'
    + '<stop offset="100%" stop-color="#1e3a8a"/>'
    + '</linearGradient>'
    + '<clipPath id="dlc"><circle cx="32" cy="32" r="26"/></clipPath>'
    + '</defs>'
    + '<circle cx="32" cy="32" r="26" fill="url(#dlg)"/>'
    + '<g clip-path="url(#dlc)" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1">'
    + '<ellipse cx="32" cy="32" rx="10" ry="26"/>'
    + '<line x1="6" y1="32" x2="58" y2="32"/>'
    + '</g>'
    + '<path d="M32 6 A26 26 0 0 1 32 58 A17 26 0 0 0 32 6" fill="rgba(0,8,32,0.38)"/>'
    + '<circle cx="32" cy="32" r="30" fill="none" stroke="#1d4ed8" stroke-width="2.8"/>'
    + '<path d="M32 2 A30 30 0 0 1 62 32" fill="none" stroke="#f59e0b" stroke-width="3.8" stroke-linecap="round"/>'
    + '<line x1="32" y1="32" x2="32" y2="17" stroke="white" stroke-width="2.4" stroke-linecap="round"/>'
    + '<line x1="32" y1="32" x2="43" y2="39" stroke="white" stroke-width="2" stroke-linecap="round"/>'
    + '<circle cx="32" cy="32" r="2.4" fill="white"/>'
    + '</svg>';

  function currentPath() {
    return location.pathname.replace(/\/$/, '') || '/';
  }

  function isActive(href) {
    var p = currentPath();
    var h = href.replace(/\/$/, '') || '/';
    if (h === '/') return p === '/';
    return p === h || p.startsWith(h);
  }

  // ── Build hamburger button (appended to .topnav-inner) ───────────────────────
  function injectHamburger() {
    var inner = document.querySelector('.topnav-inner');
    if (!inner || document.getElementById('nav-hamburger')) return;
    var btn = document.createElement('button');
    btn.id = 'nav-hamburger';
    btn.className = 'nav-hamburger';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'nav-drawer');
    btn.innerHTML = '<i class="ti ti-menu-2"></i>';
    btn.addEventListener('click', openDrawer);
    inner.appendChild(btn);
  }

  // ── Build drawer HTML ─────────────────────────────────────────────────────────
  function injectDrawer() {
    if (document.getElementById('nav-drawer')) return;

    var items = NAV_ITEMS.map(function (item) {
      var active = isActive(item.href) ? ' active' : '';
      return '<a href="' + item.href + '" class="nav-drawer-item' + active + '">'
        + '<i class="ti ' + item.icon + '" aria-hidden="true"></i>'
        + '<span>' + item.label + '</span>'
        + '</a>';
    }).join('');

    var is24h = localStorage.getItem('wc_24h') === '1';
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    var html =
      '<div id="nav-drawer-overlay" class="nav-drawer-overlay" role="presentation"></div>'
      + '<nav id="nav-drawer" class="nav-drawer" aria-label="Mobile navigation">'
      + '  <div class="nav-drawer-head">'
      + '    <a class="nav-drawer-logo" href="/">'
      + LOGO_SVG
      + '      <span class="logo-name">Timezone<em>Budy</em></span>'
      + '    </a>'
      + '    <button id="nav-drawer-close" class="nav-drawer-close" aria-label="Close menu">'
      + '      <i class="ti ti-x"></i>'
      + '    </button>'
      + '  </div>'
      + '  <div class="nav-drawer-body">' + items + '</div>'
      + '  <div class="nav-drawer-foot">'
      + '    <button class="nav-btn" onclick="toggle24h()" style="flex:1">'
      + (is24h ? '12h' : '24h')
      + '    </button>'
      + '    <button class="nav-btn" onclick="toggleTheme()" style="flex:1">'
      + (isDark ? '☀️ Light' : '🌙 Dark')
      + '    </button>'
      + '  </div>'
      + '</nav>';

    var container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    document.getElementById('nav-drawer-overlay').addEventListener('click', closeDrawer);
    document.getElementById('nav-drawer-close').addEventListener('click', closeDrawer);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  function openDrawer() {
    var overlay = document.getElementById('nav-drawer-overlay');
    var drawer  = document.getElementById('nav-drawer');
    var btn     = document.getElementById('nav-hamburger');
    if (!overlay || !drawer) return;
    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (btn) btn.setAttribute('aria-expanded', 'true');
    // Focus first item for accessibility
    var first = drawer.querySelector('.nav-drawer-item');
    if (first) setTimeout(function(){ first.focus(); }, 280);
  }

  function closeDrawer() {
    var overlay = document.getElementById('nav-drawer-overlay');
    var drawer  = document.getElementById('nav-drawer');
    var btn     = document.getElementById('nav-hamburger');
    if (!overlay || !drawer) return;
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
    if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────
  function init() {
    injectHamburger();
    injectDrawer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
