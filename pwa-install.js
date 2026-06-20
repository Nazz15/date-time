// pwa-install.js — registers the service worker and shows a custom "Install App" prompt.

// ── Register service worker ────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/service-worker.js').catch(function (err) {
      console.warn('Service worker registration failed:', err);
    });
  });
}

// ── Custom install prompt ──────────────────────────────────────────────────────
var deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallBanner();
});

function showInstallBanner() {
  if (localStorage.getItem('wc_install_dismissed') === 'true') return;
  if (document.getElementById('pwa-install-banner')) return;

  var banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML =
    '<span class="pwa-install-icon">🌍</span>' +
    '<div class="pwa-install-text"><strong>Install TimezoneBudy</strong><span>Quick access from your home screen</span></div>' +
    '<button class="pwa-install-btn" id="pwa-install-yes">Install</button>' +
    '<button class="pwa-install-close" id="pwa-install-no" aria-label="Dismiss">&times;</button>';
  document.body.appendChild(banner);

  document.getElementById('pwa-install-yes').addEventListener('click', function () {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function () {
        banner.remove();
      });
    }
  });

  document.getElementById('pwa-install-no').addEventListener('click', function () {
    localStorage.setItem('wc_install_dismissed', 'true');
    banner.remove();
  });
}

window.addEventListener('appinstalled', function () {
  var banner = document.getElementById('pwa-install-banner');
  if (banner) banner.remove();
  localStorage.setItem('wc_install_dismissed', 'true');
});
