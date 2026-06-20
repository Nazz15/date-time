// locations-menu.js — builds the Locations mega menu from a single cached JSON file.
// Loaded once per browser session; subsequent page navigations reuse the
// browser HTTP cache instead of re-downloading 20-27KB of HTML per page.

(function () {
  var CACHE_KEY = 'wc_locations_menu_data';
  var CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  function flagHtml(cc, size) {
    size = size || 16;
    var h = Math.round(size * 0.75);
    return '<span class="fi fi-' + (cc || 'un').toLowerCase() +
      '" style="width:' + size + 'px;height:' + h +
      'px;border-radius:2px;display:inline-block;background-size:cover;flex-shrink:0" aria-hidden="true"></span>';
  }

  function buildMenuHtml(countries) {
    return countries.map(function (country) {
      var cityLinks = country.cities.map(function (c) {
        return '<a href="/location/' + country.slug + '/' + c.slug + '/" class="loc-menu-city">' + c.name + '</a>';
      }).join('');
      return '<div class="loc-menu-col">' +
        '<a href="/location/' + country.slug + '/" class="loc-menu-country">' +
        flagHtml(country.cc, 16) + ' ' + country.name +
        '</a>' +
        '<div class="loc-menu-cities">' + cityLinks + '</div>' +
        '</div>';
    }).join('');
  }

  function renderMenu(countries) {
    var targets = document.querySelectorAll('.loc-mega-menu[data-locations-menu]');
    if (!targets.length) return;
    var html = buildMenuHtml(countries);
    targets.forEach(function (el) { el.innerHTML = html; });
  }

  function loadFromCache() {
    try {
      var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && (Date.now() - cached.ts) < CACHE_TTL) return cached.data;
    } catch (e) {}
    return null;
  }

  function saveToCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) {}
  }

  function init() {
    var cached = loadFromCache();
    if (cached) {
      renderMenu(cached);
      return; // still good — skip the network request entirely
    }
    fetch('/locations-data.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        renderMenu(data);
        saveToCache(data);
      })
      .catch(function () {
        // Fail silently — menu just won't populate, rest of the page still works
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
