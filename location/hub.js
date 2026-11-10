/* Locations hub (/location/) — live times, search, filters, saved cities.
   Needs util.js (WC, fmt, offMin, isDST, flag, addPin, removePin, isPinned, toast) and window.LOC. */
(function () {
'use strict';
var L = window.LOC, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var ALIAS = {'Asia/Calcutta':'Asia/Kolkata','Asia/Saigon':'Asia/Ho_Chi_Minh','Asia/Katmandu':'Asia/Kathmandu','Asia/Rangoon':'Asia/Yangon','Europe/Kiev':'Europe/Kyiv','America/Buenos_Aires':'America/Argentina/Buenos_Aires','Pacific/Ponape':'Pacific/Pohnpei','Atlantic/Faeroe':'Atlantic/Faroe'};
var HOL = ['united-states','united-kingdom','india','canada','australia','united-arab-emirates','germany','japan','brazil','south-africa'];
var ME = (function () { var t = 'UTC'; try { t = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) {} return ALIAS[t] || t; })();
var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
var norm = function (s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); };

/* ---------- time helpers ---------- */
var HF = {};
function hour(tz) { try { if (!HF[tz]) HF[tz] = new Intl.DateTimeFormat('en-GB', {timeZone: tz, hour: '2-digit', hourCycle: 'h23'}); return +HF[tz].format(new Date()); } catch (e) { return 12; } }
function zoneOf(tz) { for (var i = 0; i < L.z.length; i++) if (L.z[i][3].indexOf(tz) > -1) return L.z[i]; return null; }
function abbr(tz) { var z = zoneOf(tz); if (!z) return ''; return (z[2] && isDST(tz)) ? z[2] : z[1]; }
function offStr(m) { return 'UTC' + (m < 0 ? '−' : '+') + ('0' + Math.floor(Math.abs(m) / 60)).slice(-2) + ':' + ('0' + Math.abs(m) % 60).slice(-2); }
function off(tz) { return offMin(new Date(), tz); }
function diff(tz) {
  var d = off(tz) - off(ME); if (!d) return 'Same time';
  var h = Math.floor(Math.abs(d) / 60), m = Math.abs(d) % 60;
  return (d > 0 ? '+' : '−') + (h ? h + 'h' : '') + (m ? (h ? ' ' : '') + m + 'm' : '');
}
function hms(tz) {
  var p = {}; try { new Intl.DateTimeFormat('en-US', {timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !WC.is24h}).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; }); } catch (e) {}
  return (p.hour || '--') + ':' + (p.minute || '--') + '<small>:' + (p.second || '--') + (p.dayPeriod ? ' ' + p.dayPeriod : '') + '</small>';
}
function part(h) { return h >= 5 && h < 12 ? 'Morning' : h >= 12 && h < 17 ? 'Afternoon' : h >= 17 && h < 21 ? 'Evening' : 'Night'; }

/* ---------- live ticking ---------- */
function paint() {
  $$('[data-t]').forEach(function (el) { el.textContent = fmt(el.getAttribute('data-t')); });
  $$('[data-dn]').forEach(function (el) { var h = hour(el.getAttribute('data-dn')); el.classList.toggle('day', h >= 6 && h < 18); el.title = h >= 6 && h < 18 ? 'Daytime' : 'Night-time'; });
  $$('[data-ab]').forEach(function (el) { el.textContent = abbr(el.getAttribute('data-ab')); });
  $$('[data-off]').forEach(function (el) { el.textContent = offStr(off(el.getAttribute('data-off'))); });
  $$('[data-diff]').forEach(function (el) { el.textContent = diff(el.getAttribute('data-diff')); });
}
var lastMin = -1;
function tick() {
  var t = $('#lcYouT'); if (t) t.innerHTML = hms(ME);
  var m = new Date().getMinutes(); if (m !== lastMin) { lastMin = m; paint(); you(); }
}

/* ---------- "your time zone" card ---------- */
var mine = null; // {k, c}
function findMine() {
  var hit = null;
  L.k.forEach(function (k) {
    var c = k.c.filter(function (x) { return x[2] === ME; })[0];
    if (c && (!hit || (k.tz === ME && hit.k.tz !== ME))) hit = {k: k, c: c};
  });
  return hit;
}
function you() {
  var n = $('#lcYouN'), d = $('#lcYouD'), a = $('#lcYouA'); if (!n) return;
  var h = hour(ME), dt = ''; try { dt = new Intl.DateTimeFormat('en-GB', {timeZone: ME, weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'}).format(new Date()); } catch (e) {}
  var ab = abbr(ME);
  d.textContent = dt + ' · ' + (ab ? ab + ' · ' : '') + offStr(off(ME)) + ' · ' + part(h);
  if (a.childElementCount) return;
  if (mine) {
    n.innerHTML = '<span class="fi fi-' + mine.k.cc + '" aria-hidden="true"></span>' + esc(mine.c[1]) + ', ' + esc(mine.k.n);
    a.innerHTML = '<a class="pri" href="/location/' + mine.k.s + '/">' + esc(mine.k.n) + '<span class="lc-xl">: all cities</span> →</a><a href="/location/' + mine.k.s + '/' + mine.c[0] + '/">' + esc(mine.c[1]) + ' page</a>';
  } else {
    var c = (window.CITIES || []).filter(function (x) { return x.tz === ME; }).sort(function (x, y) { return (y.pop || 0) - (x.pop || 0); })[0];
    var name = c ? c.name : ME.split('/').pop().replace(/_/g, ' ');
    n.innerHTML = (c ? flag(c.cc, 24) : '') + esc(name) + (c ? ', ' + esc(c.country) : '');
    a.innerHTML = '<a class="pri" href="/time-difference-calculator">Compare with another city →</a><a href="/world-clock/">World Clock</a>';
  }
}

/* ---------- continent tabs + sort ---------- */
var filt = 'all', sortBy = 'az';
function applyFilter() {
  var any = false;
  $$('.lc-card').forEach(function (c) { var show = filt === 'all' || c.getAttribute('data-cont') === filt; c.hidden = !show; any = any || show; });
  $$('.lc-sec').forEach(function (s) { s.hidden = !$$('.lc-card', s).some(function (c) { return !c.hidden; }); });
  $('#lcEmpty').hidden = any;
}
function applySort() {
  $$('.lc-grid').forEach(function (g) {
    $$('.lc-card', g).sort(function (a, b) {
      if (sortBy === 'off') { var d = off(a.getAttribute('data-tz')) - off(b.getAttribute('data-tz')); if (d) return d; }
      return a.getAttribute('data-name').localeCompare(b.getAttribute('data-name'));
    }).forEach(function (c) { g.appendChild(c); });
  });
}
function bindBar() {
  $$('#lcTabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      filt = b.getAttribute('data-f');
      $$('#lcTabs button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      applyFilter();
      var top = $('#lcSecs').getBoundingClientRect().top, bar = $('.lc-bar').getBoundingClientRect().bottom;
      if (top < bar) window.scrollTo({top: window.scrollY + top - bar - 12, behavior: 'smooth'});
    });
  });
  $$('.lc-sort button').forEach(function (b) {
    b.addEventListener('click', function () {
      sortBy = b.getAttribute('data-sort');
      $$('.lc-sort button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      applySort();
    });
  });
  $$('.lc-exp').forEach(function (b) {
    b.addEventListener('click', function () {
      var c = b.closest('.lc-card'), o = !c.classList.contains('open');
      c.classList.toggle('open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
  });
  // On phones, tapping anywhere on the row (except the country link) toggles it.
  $$('.lc-top').forEach(function (t) {
    t.addEventListener('click', function (e) { if (window.innerWidth > 640 || e.target.closest('a,button')) return; $('.lc-exp', t).click(); });
  });
}

/* ---------- time zone table ---------- */
function tzTable() {
  var tb = $('#lcZB'), more = $('#lcZMore'); if (!tb) return;
  var rows = $$('tr', tb).sort(function (a, b) { return off(a.getAttribute('data-tz')) - off(b.getAttribute('data-tz')); });
  var meZ = zoneOf(ME), LIMIT = 10;
  rows.forEach(function (r, i) {
    tb.appendChild(r);
    var isMe = meZ && meZ[3].indexOf(r.getAttribute('data-tz')) > -1;
    if (isMe) { r.classList.add('lc-me'); $('td:nth-child(2)', r).insertAdjacentHTML('beforeend', '<span class="lc-me-tag">you</span>'); }
  });
  var meIdx = rows.findIndex(function (r) { return r.classList.contains('lc-me'); });
  var start = meIdx < 0 ? 0 : Math.max(0, Math.min(meIdx - 4, rows.length - LIMIT));
  rows.forEach(function (r, i) { if (i < start || i >= start + LIMIT) r.classList.add('lc-x'); });
  tb.classList.add('lc-cut');
  more.addEventListener('click', function () {
    var cut = tb.classList.toggle('lc-cut');
    more.setAttribute('aria-expanded', cut ? 'false' : 'true');
    more.innerHTML = cut ? 'Show all ' + rows.length + ' time zones <i class="ti ti-chevron-down"></i>' : 'Show fewer <i class="ti ti-chevron-up"></i>';
  });
}
function showZone(tz) {
  var r = $('#lcZB tr[data-tz="' + tz + '"]'); if (!r) return;
  if (r.classList.contains('lc-x') && $('#lcZB').classList.contains('lc-cut')) $('#lcZMore').click();
  r.scrollIntoView({behavior: 'smooth', block: 'center'});
  r.classList.remove('lc-flash'); void r.offsetWidth; r.classList.add('lc-flash');
}

/* ---------- saved cities (shared wc_pins) ---------- */
function pageFor(name, tz) {
  for (var i = 0; i < L.k.length; i++) for (var j = 0; j < L.k[i].c.length; j++) { var c = L.k[i].c[j]; if (c[1] === name && c[2] === tz) return '/location/' + L.k[i].s + '/' + c[0] + '/'; }
  return '';
}
function renderSaved() {
  var el = $('#lcSaved'); if (!el) return;
  var p = WC.pinned || [];
  el.innerHTML = p.length ? p.map(function (c, i) {
    var u = pageFor(c.name, c.tz), nm = esc(c.name);
    return '<span class="lc-sv">' + (c.cc ? flag(c.cc, 16) : '') + (u ? '<a href="' + u + '">' + nm + '</a>' : '<span>' + nm + '</span>') +
      '<span class="lc-mono" data-t="' + esc(c.tz) + '">' + fmt(c.tz) + '</span><button type="button" data-rm="' + i + '" aria-label="Remove ' + nm + '"><i class="ti ti-x"></i></button></span>';
  }).join('') : '<span class="lc-none">No saved cities yet.</span>';
  $$('.lc-star').forEach(function (b) {
    var a = b.getAttribute('data-pin').split('|'), on = isPinned({name: a[0], tz: a[3]});
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    $('i', b).className = on ? 'ti ti-star-filled' : 'ti ti-star';
    b.setAttribute('aria-label', (on ? 'Remove ' : 'Save ') + a[0]);
  });
}
function togglePin(c) {
  var i = WC.pinned.findIndex(function (p) { return p.tz === c.tz && p.name === c.name; });
  if (i > -1) removePin(i); else addPin(c);
}
window.onPinsChanged = renderSaved;
window.onFmtChange = function () { lastMin = -1; tick(); renderSaved(); };

/* ---------- search ---------- */
var IDX = [], FULL_LOADING = false, sel = -1;
function buildIdx() {
  L.k.forEach(function (k) {
    IDX.push({t: 'k', n: k.n, keys: [norm(k.n)].concat(norm(k.al).split(/\s+/).filter(Boolean)), k: k, tz: k.tz, u: '/location/' + k.s + '/'});
    k.c.forEach(function (c) { IDX.push({t: 'c', n: c[1], keys: [norm(c[1])], k: k, tz: c[2], u: '/location/' + k.s + '/' + c[0] + '/'}); });
  });
}
function score(keys, q) {
  var best = 9;
  keys.forEach(function (s) {
    if (s === q) best = Math.min(best, 0);
    else if (s.indexOf(q) === 0) best = Math.min(best, 1);
    else if ((' ' + s).indexOf(' ' + q) > -1 || s.indexOf('(' + q) > -1) best = Math.min(best, 2);
    else if (q.length > 2 && s.indexOf(q) > -1) best = Math.min(best, 3);
  });
  return best;
}
function parseOff(q) {
  var m = q.replace(/−/g, '-').match(/^(?:utc|gmt)?\s*([+-])\s*(\d{1,2})(?:[:.]?(\d{2}))?$/);
  if (!m) return null; var v = (+m[2]) * 60 + (+(m[3] || 0)); return m[1] === '-' ? -v : v;
}
function loadFull() {
  if (window.CITIES_FULL || FULL_LOADING) return; FULL_LOADING = true;
  var s = document.createElement('script'); s.src = '/cities-full.js'; s.async = true;
  s.onload = function () { FULL_LOADING = false; if ($('#lcQ').value.trim()) search(); };
  s.onerror = function () { FULL_LOADING = false; };
  document.head.appendChild(s);
}
// skip gazetteer variants of a city that already has a page ("New York City" vs New York)
function dupOf(n, c) { return L.k.some(function (k) { return k.cc === c.cc && k.c.some(function (x) { return x[2] === c.tz && n.indexOf(norm(x[1]) + ' ') === 0 && /city$/.test(n); }); }); }
function row(attrs, inner) { return '<a class="lc-r" role="option" ' + attrs + '>' + inner + '</a>'; }
function search() {
  var inp = $('#lcQ'), dd = $('#lcDrop'), raw = inp.value, q = norm(raw);
  sel = -1;
  if (!q) { dd.classList.remove('open'); inp.setAttribute('aria-expanded', 'false'); return; }
  var html = '', countries = [], cities = [], zones = [], others = [];
  // countries + cities with pages
  IDX.forEach(function (it) { var s = score(it.keys, q); if (s < 9) (it.t === 'k' ? countries : cities).push({it: it, s: s}); });
  var by = function (a, b) { return a.s - b.s || a.it.n.localeCompare(b.it.n); };
  countries.sort(by); cities.sort(by);
  // time zones: abbreviation, name or UTC offset
  var om = parseOff(q);
  L.z.forEach(function (z) {
    var tz = z[3][0], ab = [norm(z[1]), norm(z[2])], s = 9;
    if (om !== null) { if (off(tz) === om) s = 0; }
    else if (ab.indexOf(q) > -1) s = 0;
    else if (q.length > 2) { var nm = norm(z[0]); if (nm.indexOf(q) === 0) s = 1; else if ((' ' + nm).indexOf(' ' + q) > -1) s = 2; }
    if (s < 9) zones.push({z: z, s: s});
  });
  zones.sort(function (a, b) { return a.s - b.s; });
  // any other city (gazetteer)
  if (q.length > 1) {
    var have = {}; cities.forEach(function (c) { have[norm(c.it.n) + '|' + c.it.k.cc] = 1; });
    L.k.forEach(function (k) { k.c.forEach(function (c) { have[norm(c[1]) + '|' + k.cc] = 1; }); });
    var src = window.CITIES_FULL || window.CITIES || [];
    for (var i = 0; i < src.length && others.length < 40; i++) {
      var c = src[i], n = norm(c.name), s2 = n === q ? 0 : n.indexOf(q) === 0 ? 1 : (' ' + n).indexOf(' ' + q) > -1 ? 2 : 9;
      if (s2 < 9 && !have[n + '|' + c.cc] && !dupOf(n, c)) { have[n + '|' + c.cc] = 1; others.push({c: c, s: s2}); }
    }
    others.sort(function (a, b) { return a.s - b.s || (b.c.pop || 0) - (a.c.pop || 0); });
  }
  if (countries.length) {
    html += '<div class="lc-g">Countries</div>' + countries.slice(0, 4).map(function (x) {
      var k = x.it.k, nz = k.c.length;
      return row('href="' + x.it.u + '"', '<span class="fi fi-' + k.cc + '" aria-hidden="true"></span><b>' + esc(k.n) + '</b><small>' + abbr(k.tz) + ' · ' + offStr(off(k.tz)) + ' · ' + (nz > 1 ? nz + ' cities' : 'city-state') + '</small><span class="lc-mono">' + fmt(k.tz) + '</span>');
    }).join('');
  }
  if (cities.length) {
    html += '<div class="lc-g">Cities</div>' + cities.slice(0, 6).map(function (x) {
      var it = x.it;
      return row('href="' + it.u + '"', '<span class="fi fi-' + it.k.cc + '" aria-hidden="true"></span><span>' + esc(it.n) + ', ' + esc(it.k.n) + '</span><small>' + abbr(it.tz) + ' · ' + offStr(off(it.tz)) + '</small><span class="lc-mono">' + fmt(it.tz) + '</span>');
    }).join('');
  }
  if (zones.length) {
    html += '<div class="lc-g">Time zones</div>' + zones.slice(0, 4).map(function (x) {
      var tz = x.z[3][0];
      return row('href="#lcZones" data-zone="' + tz + '"', '<span class="lc-ab">' + abbr(tz) + '</span><span>' + esc(x.z[0]) + '</span><small>' + offStr(off(tz)) + '</small><span class="lc-mono">' + fmt(tz) + '</span>');
    }).join('');
  }
  if (others.length) {
    html += '<div class="lc-g">More cities</div>' + others.slice(0, 6).map(function (x, i) {
      var c = x.c, on = isPinned(c);
      return row('href="#" data-other="' + i + '"', flag(c.cc, 22) + '<span>' + esc(c.name) + ', ' + esc(c.country) + '</span><small>' + offStr(off(c.tz)) + '</small><span class="lc-mono">' + fmt(c.tz) + '</span><span class="lc-tag">' + (on ? '★ Saved' : '☆ Save') + '</span>');
    }).join('');
  }
  if (!html) html = '<div class="lc-x">' + (FULL_LOADING ? 'Searching all cities…' : 'No matches for “' + esc(raw) + '”. Try a city, a country, or a time zone like “IST” or “UTC+8”.') + '</div>';
  else html += '<div class="lc-foot">↑↓ to move · Enter to open · Esc to close</div>';
  dd.innerHTML = html; dd.classList.add('open'); inp.setAttribute('aria-expanded', 'true');
  dd._others = others.slice(0, 6).map(function (x) { return x.c; });
}
function closeDrop() { var dd = $('#lcDrop'); dd.classList.remove('open'); $('#lcQ').setAttribute('aria-expanded', 'false'); sel = -1; }
function bindSearch() {
  var inp = $('#lcQ'), dd = $('#lcDrop'); if (!inp) return;
  buildIdx();
  if (window.innerWidth <= 640) inp.placeholder = 'Search city, country or IST…';
  inp.addEventListener('focus', function () { loadFull(); if (inp.value.trim()) search(); });
  inp.addEventListener('input', search);
  inp.addEventListener('keydown', function (e) {
    var rows = $$('.lc-r', dd);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!rows.length) return; e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
      rows.forEach(function (r, i) { r.classList.toggle('hl', i === sel); r.setAttribute('aria-selected', i === sel ? 'true' : 'false'); });
      rows[sel].scrollIntoView({block: 'nearest'});
    } else if (e.key === 'Enter') {
      e.preventDefault(); var r = rows[sel < 0 ? 0 : sel]; if (r) r.click();
    } else if (e.key === 'Escape') { closeDrop(); inp.blur(); }
  });
  dd.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep focus while clicking
  dd.addEventListener('click', function (e) {
    var r = e.target.closest('.lc-r'); if (!r) return;
    if (r.hasAttribute('data-zone')) { e.preventDefault(); closeDrop(); inp.blur(); showZone(r.getAttribute('data-zone')); }
    else if (r.hasAttribute('data-other')) {
      e.preventDefault(); var c = dd._others[+r.getAttribute('data-other')];
      if (c) { if (isPinned(c)) toast(flag(c.cc, 16) + ' <b>' + esc(c.name) + '</b> is already in your cities'); else addPin({name: c.name, country: c.country, cc: c.cc, tz: c.tz}); }
      search();
    }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.lc-search')) closeDrop(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') && !e.metaKey && !e.ctrlKey) { e.preventDefault(); inp.focus(); }
  });
}

/* ---------- boot ---------- */
function navH() {
  var n = document.querySelector('.tzb-nav,.topnav'); if (!n) return;
  var cs = getComputedStyle(n);
  document.documentElement.style.setProperty('--lc-navh', (cs.position === 'sticky' || cs.position === 'fixed') ? n.offsetHeight + 'px' : '0px');
}
window.LC_BOOT = function () {
  mine = findMine();
  if (mine) {
    var card = $('.lc-card[data-name="' + mine.k.n.replace(/"/g, '') + '"]'); if (card) card.classList.add('lc-me');
    if (HOL.indexOf(mine.k.s) > -1) { var h = $('#lcHolLink'); if (h) { h.href = '/holiday/' + mine.k.s + '/'; h.lastChild.textContent = 'Public holidays in ' + mine.k.n; } }
  }
  if (!zoneOf(ME)) { var nt = $('#lcDiffNote'); if (nt) nt.textContent = 'Difference shown from your time (' + offStr(off(ME)) + ').'; }
  else { var nt2 = $('#lcDiffNote'); if (nt2) nt2.textContent = 'Difference shown from your time (' + abbr(ME) + ').'; }
  tzTable(); bindBar(); bindSearch();
  $$('.lc-star').forEach(function (b) {
    b.addEventListener('click', function () { var a = b.getAttribute('data-pin').split('|'); togglePin({name: a[0], country: a[1], cc: a[2], tz: a[3]}); });
  });
  renderSaved(); tick(); setInterval(tick, 1000);
  navH(); setTimeout(navH, 400); window.addEventListener('resize', navH);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { lastMin = -1; tick(); } });
};
})();
