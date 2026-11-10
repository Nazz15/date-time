/* converter.js — Meeting Planner (/converter)
   Needs util.js: WC, fmt, offMin, flag, toast, boot, isPinned, addPin. Optional: cities.js (CITIES), /cities-full.js (lazy).
   Storage: wc_conv (city list, shared with the old converter), wc_mtg (length + work hours). */
(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
var norm = function (s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); };
var pad = function (n) { return (n < 10 ? '0' : '') + n; };
var ALIAS = {'Asia/Calcutta':'Asia/Kolkata','Asia/Saigon':'Asia/Ho_Chi_Minh','Asia/Katmandu':'Asia/Kathmandu','Asia/Rangoon':'Asia/Yangon','Europe/Kiev':'Europe/Kyiv'};
var MAX = 12, MIN = 60000;
var POPULAR = [
  {name:'New York',country:'United States',cc:'us',tz:'America/New_York'},{name:'London',country:'United Kingdom',cc:'gb',tz:'Europe/London'},
  {name:'Tokyo',country:'Japan',cc:'jp',tz:'Asia/Tokyo'},{name:'San Francisco',country:'United States',cc:'us',tz:'America/Los_Angeles'},
  {name:'Berlin',country:'Germany',cc:'de',tz:'Europe/Berlin'},{name:'Singapore',country:'Singapore',cc:'sg',tz:'Asia/Singapore'},
  {name:'Sydney',country:'Australia',cc:'au',tz:'Australia/Sydney'},{name:'Dubai',country:'United Arab Emirates',cc:'ae',tz:'Asia/Dubai'},
  {name:'Mumbai',country:'India',cc:'in',tz:'Asia/Kolkata'},{name:'Toronto',country:'Canada',cc:'ca',tz:'America/Toronto'}];
// abbreviation search: [abbrs, label, tz, cc]
var ZONES = [
  ['PST PDT PT','Pacific Time','America/Los_Angeles','us'],['MST MDT MT','Mountain Time','America/Denver','us'],
  ['CST CDT CT','Central Time (US)','America/Chicago','us'],['EST EDT ET','Eastern Time','America/New_York','us'],
  ['AKST AKDT','Alaska Time','America/Anchorage','us'],['HST','Hawaii Time','Pacific/Honolulu','us'],
  ['BRT','Brasília Time','America/Sao_Paulo','br'],['GMT BST UK','UK Time (GMT/BST)','Europe/London','gb'],['UTC Z','Coordinated Universal Time','UTC',''],
  ['CET CEST','Central European Time','Europe/Paris','fr'],['EET EEST','Eastern European Time','Europe/Athens','gr'],
  ['MSK','Moscow Time','Europe/Moscow','ru'],['SAST','South Africa Time','Africa/Johannesburg','za'],['GST','Gulf Standard Time','Asia/Dubai','ae'],
  ['PKT','Pakistan Time','Asia/Karachi','pk'],['IST','India Standard Time','Asia/Kolkata','in'],['WIB','Western Indonesia Time','Asia/Jakarta','id'],
  ['CST','China Standard Time','Asia/Shanghai','cn'],['HKT','Hong Kong Time','Asia/Hong_Kong','hk'],['SGT','Singapore Time','Asia/Singapore','sg'],
  ['PHT','Philippine Time','Asia/Manila','ph'],['JST','Japan Standard Time','Asia/Tokyo','jp'],['KST','Korea Standard Time','Asia/Seoul','kr'],
  ['AWST','Australian Western Time','Australia/Perth','au'],['AEST AEDT','Australian Eastern Time','Australia/Sydney','au'],
  ['NZST NZDT','New Zealand Time','Pacific/Auckland','nz']];

var P = {cities: [], date: '', sel: 540, len: 60, ws: 9, we: 17, night: false};

/* ---------- time maths ---------- */
var PF = {};
function parts(ms, tz) {
  var f = PF[tz] || (PF[tz] = new Intl.DateTimeFormat('en-GB', {timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23'}));
  var o = {}; f.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
  return {y: +o.year, mo: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, wd: o.weekday, key: o.year + '-' + o.month + '-' + o.day};
}
function zoned(dateStr, minutes, tz) { // ms for local dateStr 00:00 + minutes in tz
  var a = dateStr.split('-'), g = Date.UTC(+a[0], +a[1] - 1, +a[2], 0, minutes);
  var o1 = offMin(new Date(g), tz), t = g - o1 * MIN, o2 = offMin(new Date(t), tz);
  return o2 === o1 ? t : g - o2 * MIN;
}
function todayIn(tz) { return parts(Date.now(), tz).key; }
function shiftDate(dateStr, days) { var a = dateStr.split('-'), d = new Date(Date.UTC(+a[0], +a[1] - 1, +a[2] + days)); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
function home() { return P.cities[0] ? P.cities[0].tz : 'UTC'; }
function base() { return zoned(P.date, 0, home()); }
function hm(ms, tz, short) {
  var p = parts(ms, tz), h = p.h, m = p.mi;
  if (WC.is24h) return short ? (m ? pad(h) + ':' + pad(m) : pad(h)) : pad(h) + ':' + pad(m);
  var ap = h < 12 ? 'am' : 'pm', h12 = h % 12 || 12;
  if (short === 'm') return h12 + (m ? ':' + pad(m) : '') + ap.charAt(0);
  return short ? (m ? h12 + ':' + pad(m) : h12 + ap.charAt(0)) : h12 + ':' + pad(m) + ' ' + ap.toUpperCase();
}
function dayLabel(ms, tz) { var p = parts(ms, tz); return p.wd + ' ' + p.d + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][p.mo - 1]; }
var AB = {}, ABX = {'Asia/Tokyo':'JST','Asia/Seoul':'KST','Asia/Shanghai':'CST','Asia/Hong_Kong':'HKT','Asia/Singapore':'SGT','Asia/Dubai':'GST','Asia/Karachi':'PKT','Asia/Manila':'PHT','Asia/Jakarta':'WIB','America/Sao_Paulo':'BRT','Europe/Moscow':'MSK','Asia/Riyadh':'AST','Asia/Kolkata':'IST','Africa/Johannesburg':'SAST','Asia/Bangkok':'ICT','Asia/Dhaka':'BST','Asia/Taipei':'CST','Africa/Lagos':'WAT','Africa/Nairobi':'EAT','Asia/Kathmandu':'NPT'};
function abbr(tz, ms) {
  var k = tz + (isDSTat(tz, ms) ? 1 : 0); if (AB[k]) return AB[k];
  var out = ABX[tz] || '';
  if (!out) ['en-US', 'en-GB', 'en-AU', 'en-IN', 'en-NZ'].some(function (loc) {
    try { var n = new Intl.DateTimeFormat(loc, {timeZone: tz, timeZoneName: 'short'}).formatToParts(new Date(ms)).filter(function (p) { return p.type === 'timeZoneName'; })[0].value; if (!/^(GMT|UTC)[+−-]/.test(n)) { out = n; return true; } } catch (e) {}
    return false;
  });
  if (!out || out === 'GMT' && !/London|Dublin|Lisbon|Reykjavik|Accra|Dakar|Abidjan|UTC|GMT/.test(tz)) out = offStr(offMin(new Date(ms), tz));
  return (AB[k] = out);
}
function isDSTat(tz, ms) { var y = new Date(ms).getUTCFullYear(), a = offMin(new Date(Date.UTC(y, 0, 1)), tz), b = offMin(new Date(Date.UTC(y, 6, 1)), tz); return a !== b && offMin(new Date(ms), tz) === Math.max(a, b); }
function offStr(m) { var s = m < 0 ? '−' : '+', a = Math.abs(m); return 'UTC' + s + Math.floor(a / 60) + (a % 60 ? ':' + pad(a % 60) : ''); }
function kindAt(ms, tz) {
  var p = parts(ms, tz), x = p.h + p.mi / 60;
  if (x < 7 || x >= 22) return x >= P.ws && x < P.we ? 'work' : 'sleep';
  if (x >= P.ws && x < P.we) return 'work';
  return x < P.ws ? 'morn' : 'eve';
}
var RANK = {sleep: 0, morn: 1, eve: 1, work: 3};
function slotEval(startMin, len) { // per city worst category over the slot
  var B = base(), res = {work: 0, awake: 0, sleep: 0, k: []};
  P.cities.forEach(function (c) {
    var worst = 'work';
    for (var m = 0; m < len; m += 15) { var k = kindAt(B + (startMin + m) * MIN, c.tz); if (RANK[k] < RANK[worst]) worst = k; }
    res.k.push(worst);
    if (worst === 'work') res.work++; else if (worst === 'sleep') res.sleep++; else res.awake++;
  });
  return res;
}
function bestSlots() {
  if (!P.cities.length) return [];
  var c = [];
  for (var s = 0; s + P.len <= 1440; s += 30) { var e = slotEval(s, P.len); c.push({s: s, e: e, score: e.work * 10 + e.awake * 3 - e.sleep * 50}); }
  c.sort(function (a, b) { return b.score - a.score || Math.abs(a.s - 780) - Math.abs(b.s - 780); });
  var out = [];
  for (var i = 0; i < c.length && out.length < 3; i++) if (out.every(function (o) { return Math.abs(o.s - c[i].s) >= 60; })) out.push(c[i]);
  return out;
}
function summary(e) {
  var n = P.cities.length;
  if (e.work === n) return 'Everyone in work hours';
  var t = e.work + ' of ' + n + ' in work hours';
  return t + (e.sleep ? ' · ' + e.sleep + ' outside 7:00–22:00' : ', nobody asleep');
}

/* ---------- storage + URL ---------- */
function load() {
  try { var s = JSON.parse(localStorage.getItem('wc_conv') || 'null'); if (Array.isArray(s) && s.length) P.cities = s.filter(function (c) { return c && c.tz && c.name; }).slice(0, MAX); } catch (e) {}
  try { var m = JSON.parse(localStorage.getItem('wc_mtg') || 'null'); if (m) { P.len = +m.len || 60; P.ws = +m.ws || 9; P.we = +m.we || 17; } } catch (e) {}
  if (!P.cities.length) {
    var me = 'UTC'; try { me = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) {} me = ALIAS[me] || me;
    var mine = (window.CITIES || []).filter(function (c) { return c.tz === me; }).sort(function (a, b) { return (b.pop || 0) - (a.pop || 0); })[0];
    if (mine) P.cities.push(pick(mine));
    POPULAR.slice(0, 3).forEach(function (c) { if (!P.cities.some(function (x) { return x.tz === c.tz; })) P.cities.push(c); });
    if (P.cities.length < 4) P.cities.push(POPULAR[8].tz === (P.cities[0] || {}).tz ? POPULAR[5] : POPULAR[8]);
  }
}
function pick(c) { return {name: c.name, country: c.country || '', cc: c.cc || '', tz: c.tz}; }
function save() {
  try { localStorage.setItem('wc_conv', JSON.stringify(P.cities)); localStorage.setItem('wc_mtg', JSON.stringify({len: P.len, ws: P.ws, we: P.we})); } catch (e) {}
}
function fromURL() {
  var q = new URLSearchParams(location.search), tzs = q.get('tz'), got = false;
  if (tzs) {
    var names = (q.get('c') || '').split('|'), src = window.CITIES || [];
    var list = tzs.split(',').map(function (tz, i) {
      tz = decodeURIComponent(tz); var nm = names[i] ? decodeURIComponent(names[i]) : '';
      if (!validTz(tz)) return null;
      var c = src.filter(function (x) { return x.tz === tz && (!nm || x.name === nm); })[0] || (!nm && src.filter(function (x) { return x.tz === tz; })[0]);
      if (c) return pick(c);
      var z = ZONES.filter(function (x) { return x[2] === tz; })[0];
      return {name: nm || (z ? z[1] : tz.split('/').pop().replace(/_/g, ' ')), country: z ? 'Time zone' : '', cc: z ? z[3] : '', tz: tz};
    }).filter(Boolean);
    if (list.length) { P.cities = list.slice(0, MAX); got = true; }
  }
  var d = q.get('d'); if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) P.date = d;
  var l = +q.get('len'); if ([30, 45, 60, 90, 120].indexOf(l) > -1) P.len = l;
  var t = q.get('t'); if (t && /^\d{1,2}:\d{2}$/.test(t)) { var a = t.split(':'); P.sel = Math.min(1440 - 15, (+a[0]) * 60 + (+a[1])); P._fixed = true; }
  return got;
}
function validTz(tz) { try { new Intl.DateTimeFormat('en', {timeZone: tz}); return true; } catch (e) { return false; } }
function shareURL() {
  var s = P.sel, u = location.origin + '/converter?tz=' + P.cities.map(function (c) { return encodeURIComponent(c.tz); }).join(',') +
    '&c=' + P.cities.map(function (c) { return encodeURIComponent(c.name); }).join('|') + '&d=' + P.date + '&t=' + pad(Math.floor(s / 60)) + ':' + pad(s % 60) + '&len=' + P.len;
  return u;
}

/* ---------- rendering ---------- */
function flagHTML(c, sz) { return c.cc ? flag(c.cc, sz || 22) : '<i class="ti ti-world" style="font-size:' + ((sz || 22) - 2) + 'px;color:var(--clr-text2)" aria-hidden="true"></i>'; }
function render() {
  var B = base(), n = P.cities.length, ht = home(), today = todayIn(ht) === P.date;
  var nowX = today ? (Date.now() - B) / MIN / 1440 : -1;
  $('#mpCount').textContent = n + (n === 1 ? ' city' : ' cities') + ' · ' + dayLabel(B + 720 * MIN, ht);
  $('#mpHint').innerHTML = n ? 'Hours shown in <b>' + esc(P.cities[0].name) + '</b> time (home ★). Drag ⋮⋮ to reorder, click ☆ to change home, click any hour to select it.' : '';
  // date label
  $('#mpDateTxt').textContent = dayLabel(B + 720 * MIN, ht) + ' ' + P.date.slice(0, 4);
  $('#mpDateIn').value = P.date;
  var hours = [], cols = [];
  for (var h = 0; h < 24; h++) { hours.push(B + h * 60 * MIN); }
  // axis
  $('#mpAxis').innerHTML = hours.map(function (ms, h) { return '<span' + (h % 6 === 0 ? ' class="q"' : '') + '>' + esc(hm(ms, ht, true)) + '</span>'; }).join('');
  if (!n) { $('#mpRows').innerHTML = '<div class="mp-empty">Add a city above to start planning.</div>'; $('#mpOv').innerHTML = ''; }
  else {
    var selStart = B + P.sel * MIN;
    $('#mpRows').innerHTML = P.cities.map(function (c, i) {
      var cells = hours.map(function (ms, h) {
        var k = kindAt(ms + 30 * MIN, c.tz), p = parts(ms, c.tz), nd = p.h === 0 && p.mi === 0 || (h > 0 && parts(hours[h - 1], c.tz).key !== p.key && p.h === 0);
        var lab = nd ? p.wd : hm(ms, c.tz, true);
        return '<div class="mp-c k-' + k + (nd ? ' nd' : '') + '" data-h="' + h + '" title="' + esc(c.name + ' ' + hm(ms, c.tz) + ', ' + dayLabel(ms, c.tz)) + '">' + esc(lab) + '</div>';
      }).join('');
      return '<div class="mp-row mp-gr" data-i="' + i + '"><div class="mp-ci">' +
        '<button type="button" class="mp-handle" data-drag="' + i + '" aria-label="Drag to reorder ' + esc(c.name) + '" title="Drag to reorder">⋮⋮</button>' +
        '<button type="button" class="mp-home' + (i === 0 ? ' on' : '') + '" data-home="' + i + '" aria-label="' + (i === 0 ? esc(c.name) + ' is home' : 'Make ' + esc(c.name) + ' home') + '" title="' + (i === 0 ? 'Home city' : 'Make home city') + '">' + (i === 0 ? '★' : '☆') + '</button>' +
        flagHTML(c) + '<div class="mp-cn"><b>' + esc(c.name) + '</b><span title="Now ' + esc(hm(Date.now(), c.tz)) + '">' + esc(abbr(c.tz, selStart)) + ' · ' + offStr(offMin(new Date(selStart), c.tz)) + '</span></div>' +
        '<div class="mp-ct"><b>' + esc(hm(selStart, c.tz)) + '</b><span>' + esc(dayLabel(selStart, c.tz)) + '</span></div></div>' +
        '<div class="mp-cells">' + cells + '</div>' +
        '<button type="button" class="mp-rm" data-rm="' + i + '" aria-label="Remove ' + esc(c.name) + '" title="Remove">✕</button></div>';
    }).join('') +
      '<div class="mp-overlay mp-selbox" style="--x:' + (P.sel / 1440) + ';--w:' + Math.min(P.len, 1440 - P.sel) / 1440 + '"></div>' +
      (nowX >= 0 && nowX < 1 ? '<div class="mp-overlay mp-now" style="--x:' + nowX + '"></div>' : '');
    // overlap
    var ov = hours.map(function (ms, h) {
      var ks = P.cities.map(function (c) { return kindAt(ms + 30 * MIN, c.tz); });
      var w = ks.filter(function (k) { return k === 'work'; }).length, s = ks.indexOf('sleep') > -1;
      var cls = w === n ? 'o-all' : !s && w * 2 >= n ? 'o-most' : !s ? 'o-awake' : 'o-no';
      cols.push(cls);
      return '<span class="' + cls + '" data-h="' + h + '" title="' + esc(hm(ms, ht) + ': ' + (w === n ? 'everyone working' : w + ' of ' + n + ' working' + (s ? ', someone asleep' : ''))) + '"></span>';
    }).join('');
    $('#mpOv').innerHTML = ov;
  }
  renderSlot(); renderBest(); renderV(hours, cols, nowX); renderChips();
}
function slotText() {
  var B = base(), s = B + P.sel * MIN, e = s + P.len * MIN, ht = home();
  return {s: s, e: e, title: dayLabel(s, ht) + ' · ' + hm(s, ht) + '–' + hm(e, ht) + ' ' + (P.cities[0] ? P.cities[0].name : ''),
    list: P.cities.slice(1).map(function (c) { return c.name + ' ' + hm(s, c.tz) + (parts(s, c.tz).key !== parts(s, ht).key ? ' (' + parts(s, c.tz).wd + ')' : ''); })};
}
function renderSlot() {
  if (!P.cities.length) { $('#mpSlotT').textContent = 'No cities yet'; $('#mpSlotC').textContent = ''; $('#mpSlotS').textContent = ''; $('#mpShT').textContent = 'Add a city to start'; $('#mpShC').textContent = ''; return; }
  var t = slotText(), e = slotEval(P.sel, P.len);
  $('#mpSlotT').textContent = t.title;
  $('#mpSlotC').textContent = t.list.join(' · ');
  $('#mpSlotS').textContent = summary(e);
  $('#mpShT').textContent = t.title;
  $('#mpShC').textContent = (t.list.join(' · ') || summary(e));
  // typing control
  var sel = $('#mpTypeC'), cur = sel.value;
  sel.innerHTML = P.cities.map(function (c, i) { return '<option value="' + i + '">' + esc(c.name) + '</option>'; }).join('');
  sel.value = cur && +cur < P.cities.length ? cur : '0';
  var ci = P.cities[+sel.value] || P.cities[0], p = parts(t.s, ci.tz);
  if (document.activeElement !== $('#mpTypeT')) $('#mpTypeT').value = pad(p.h) + ':' + pad(p.mi);
}
var BEST = [];
function renderBest() {
  BEST = bestSlots(); var ht = home(), B = base();
  var card = function (b, i) {
    var s = B + b.s * MIN, e = b.e, n = P.cities.length;
    var tier = e.work === n ? ['best', 'Everyone working'] : !e.sleep ? [i ? 'good' : 'best', i ? 'Good' : 'Best'] : ['ok', e.sleep + ' asleep'];
    return '<button type="button" class="mp-bc' + (b.s === P.sel ? ' on' : '') + '" data-best="' + i + '"><span class="t"><b>' + esc(hm(s, ht) + ' ' + (P.cities[0] || {}).name) + '</b><span class="mp-tier ' + tier[0] + '">' + tier[1] + '</span></span>' +
      '<span class="c">' + esc(P.cities.slice(1).map(function (c) { return c.name + ' ' + hm(s, c.tz); }).join(' · ') || 'Only one city added') + '</span>' +
      '<span class="s">' + e.work + ' working · ' + e.awake + ' early/late · ' + e.sleep + ' asleep</span></button>';
  };
  $('#mpBest').innerHTML = BEST.map(card).join('');
  var tip = '';
  if (BEST.length && P.cities.length > 1) {
    if (BEST[0].e.work < P.cities.length) tip = BEST[0].e.sleep ? 'Every slot on this day puts someone outside 7:00–22:00. Consider alternating meeting times or splitting into two calls.' : 'No hour fits everyone’s work hours on this day. The suggestions keep everyone awake; consider alternating early and late slots week to week.';
  }
  $('#mpTip').textContent = tip; $('#mpTip').hidden = !tip;
  var mb = $('#mpMBest');
  if (BEST.length) {
    mb.innerHTML = '<div class="mp-bh"><h2 style="font-size:16px;margin:0">Best time</h2><span>' + (BEST.length > 1 ? 'Tap to select · <button type="button" class="mp-link" id="mpMore" style="border:0;background:none;color:var(--clr-brand);font:600 12.5px Inter,sans-serif;padding:0;cursor:pointer">' + (P._more ? 'Hide' : (BEST.length - 1) + ' more') + '</button>' : '') + '</span></div>' +
      card(BEST[0], 0) + (P._more ? '<div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">' + BEST.slice(1).map(function (b, i) { return card(b, i + 1); }).join('') + '</div>' : '') +
      (tip ? '<p class="mp-tip">' + esc(tip) + '</p>' : '');
  } else mb.innerHTML = '';
}
function renderV(hours, cols, nowX) {
  var n = P.cities.length, v = $('#mpV'); if (!v) return;
  if (!n) { v.innerHTML = ''; return; }
  var tmpl = 'grid-template-columns:12px repeat(' + n + ',minmax(' + (n > 4 ? 70 : 0) + 'px,1fr))';
  var ht = home(), selH = Math.floor(P.sel / 60), nowH = nowX >= 0 && nowX < 1 ? Math.floor(nowX * 24) : -1;
  var head = '<div class="mp-vh"><div class="mp-vhead" style="' + tmpl + '"><span></span>' + P.cities.map(function (c, i) {
    return '<div class="mp-vhc">' + flagHTML(c, 18) + '<b>' + esc(c.name) + '</b><span>' + esc(abbr(c.tz, base() + P.sel * MIN)) + '</span><span class="mp-vtools">' +
      '<button type="button" data-home="' + i + '" class="' + (i === 0 ? 'on' : '') + '" aria-label="' + (i === 0 ? 'Home city' : 'Make ' + esc(c.name) + ' home') + '">' + (i === 0 ? '★' : '☆') + '</button>' +
      '<button type="button" data-rm="' + i + '" aria-label="Remove ' + esc(c.name) + '">✕</button></span></div>';
  }).join('') + '</div></div>';
  var rows = '';
  hours.forEach(function (ms, h) {
    if (!P.night && h < 6 && h !== selH) return;
    rows += '<div class="mp-vr' + (h === selH ? ' sel' : '') + (h === nowH ? ' now' : '') + '" data-h="' + h + '" style="' + tmpl + '" role="button" tabindex="0" aria-label="Select ' + esc(hm(ms, ht)) + '"><span class="o ' + cols[h] + '"></span>' +
      P.cities.map(function (c) { var p = parts(ms, c.tz), nd = p.h === 0 && p.mi === 0; return '<span class="c k-' + kindAt(ms + 30 * MIN, c.tz) + (nd ? ' nd' : '') + '">' + esc(nd ? p.wd + ' ' + hm(ms, c.tz, 'm') : hm(ms, c.tz, WC.is24h ? false : 'm')) + '</span>'; }).join('') + '</div>';
  });
  v.innerHTML = '<div class="mp-vscroll' + (n > 4 ? ' x' : '') + '">' + head + '<div class="mp-vrows">' + rows + '</div></div>' +
    '<button type="button" class="mp-vnight" id="mpNight">' + (P.night ? 'Hide night hours (00:00–05:59)' : 'Show night hours (00:00–05:59)') + '</button>' +
    '<div class="mp-vfoot"><span class="mp-lg"><i class="o-all"></i>All working</span><span class="mp-lg"><i class="o-most"></i>Most working</span><span class="mp-lg"><i class="o-awake"></i>All awake</span><span class="mp-lg"><i class="o-no"></i>Someone asleep</span></div>';
}
function renderChips() {
  var have = function (c) { return P.cities.some(function (x) { return x.tz === c.tz && x.name === c.name; }); };
  var saved = (WC.pinned || []).filter(function (c) { return !have(c); }).slice(0, 3);
  var pop = POPULAR.filter(function (c) { return !have(c) && !saved.some(function (s) { return s.name === c.name; }); }).slice(0, 6 - saved.length);
  CHIPS = saved.concat(pop);
  $('#mpChips').innerHTML = (saved.length ? '<span class="mp-k">Saved</span>' + saved.map(function (c, i) { return '<button type="button" class="mp-chip" data-chip="' + i + '">★ ' + esc(c.name) + '</button>'; }).join('') : '') +
    (pop.length ? '<span class="mp-k">Popular</span>' + pop.map(function (c, i) { return '<button type="button" class="mp-chip" data-chip="' + (i + saved.length) + '">+ ' + esc(c.name) + '</button>'; }).join('') : '');
}
var CHIPS = [];

/* ---------- mutations ---------- */
function addCity(c) {
  c = pick(c);
  if (P.cities.some(function (x) { return x.tz === c.tz && x.name === c.name; })) { toast(esc(c.name) + ' is already in your planner'); return false; }
  if (P.cities.length >= MAX) { toast('You can compare up to ' + MAX + ' cities'); return false; }
  var keep = base() + P.sel * MIN;
  P.cities.push(c); save();
  if (P.cities.length === 1) { P.date = todayIn(c.tz); }
  keepInstant(keep); render(); toast(flagHTML(c, 14) + ' <b>' + esc(c.name) + '</b> added');
  return true;
}
function removeCity(i) {
  var keep = base() + P.sel * MIN, c = P.cities.splice(i, 1)[0]; save();
  if (P.cities.length) keepInstant(keep);
  render(); toast(esc(c.name) + ' removed');
}
function makeHome(i) {
  if (i === 0) return; var keep = base() + P.sel * MIN;
  P.cities.unshift(P.cities.splice(i, 1)[0]); save(); keepInstant(keep); render();
}
function keepInstant(ms) { // keep the same moment selected after the home city changes
  var ht = home(), p = parts(ms, ht); P.date = p.key; P.sel = p.h * 60 + p.mi;
  if (P.sel + P.len > 1440) P.sel = 1440 - P.len;
}
function select(min) { P.sel = Math.max(0, Math.min(1440 - Math.min(P.len, 1440), min)); render(); }
function setDate(d) { P.date = d; if (!P._fixed) { var b = bestSlots()[0]; if (b) P.sel = b.s; } render(); }

/* ---------- actions ---------- */
function copy(text, msg) {
  var done = function () { toast(msg); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  function fallback() { var t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { window.prompt('Copy this:', text); } t.remove(); }
}
function meetingText() {
  var t = slotText(), lines = ['Meeting · ' + P.len + ' min'];
  P.cities.forEach(function (c) { lines.push('• ' + c.name + ': ' + hm(t.s, c.tz) + '–' + hm(t.e, c.tz) + ' ' + abbr(c.tz, t.s) + ' (' + dayLabel(t.s, c.tz) + ')'); });
  return lines.join('\n');
}
function icsDate(ms) { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function calendar(kind) {
  var t = slotText(), body = meetingText() + '\n\nPlanned with TimezoneBuddy: ' + shareURL();
  if (kind === 'google') window.open('https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Meeting') + '&dates=' + icsDate(t.s) + '/' + icsDate(t.e) + '&details=' + encodeURIComponent(body), '_blank', 'noopener');
  else if (kind === 'outlook') window.open('https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=Meeting&startdt=' + encodeURIComponent(new Date(t.s).toISOString()) + '&enddt=' + encodeURIComponent(new Date(t.e).toISOString()) + '&body=' + encodeURIComponent(body), '_blank', 'noopener');
  else {
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TimezoneBuddy//Meeting Planner//EN', 'BEGIN:VEVENT', 'UID:' + t.s + '-' + Math.random().toString(36).slice(2) + '@timezonebudy.com',
      'DTSTAMP:' + icsDate(Date.now()), 'DTSTART:' + icsDate(t.s), 'DTEND:' + icsDate(t.e), 'SUMMARY:Meeting', 'DESCRIPTION:' + body.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, '\\$&'), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], {type: 'text/calendar'})); a.download = 'meeting.ics'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Calendar file downloaded');
  }
  closeMenus();
}
function share() {
  var u = shareURL();
  if (navigator.share && window.matchMedia('(max-width:760px)').matches) navigator.share({title: 'Meeting time', text: meetingText(), url: u}).catch(function () {});
  else copy(u, 'Link copied: anyone opening it sees the same cities and time');
}
function closeMenus() { $$('.mp-menu.open').forEach(function (m) { m.classList.remove('open'); }); $$('[data-menu]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); }

/* ---------- search ---------- */
var RES = [], hi = -1, FULL = false;
function loadFull() {
  if (window.CITIES_FULL || FULL) return; FULL = true;
  var s = document.createElement('script'); s.src = '/cities-full.js'; s.async = true;
  s.onload = function () { if ($('#mpQ').value.trim()) search(); }; document.head.appendChild(s);
}
function parseOff(q) { var m = q.replace(/−/g, '-').match(/^(?:utc|gmt)?\s*([+-])\s*(\d{1,2})(?:[:.]?(\d{2}))?$/); if (!m) return null; var v = (+m[2]) * 60 + (+(m[3] || 0)); return m[1] === '-' ? -v : v; }
function search() {
  var raw = $('#mpQ').value, q = norm(raw), dd = $('#mpDrop'); RES = []; hi = -1;
  var have = function (c) { return P.cities.some(function (x) { return x.tz === c.tz && x.name === c.name; }); };
  var groups = [];
  if (!q) {
    var sv = (WC.pinned || []).slice(0, 8);
    if (sv.length) groups.push(['Your saved cities', sv.map(function (c) { return {c: c}; })]);
  } else {
    var om = parseOff(q), zs = [];
    ZONES.forEach(function (z) {
      var ab = z[0].toLowerCase().split(' ');
      if ((om === null && (ab.indexOf(q) > -1 || (q.length > 2 && norm(z[1]).indexOf(q) > -1))) || (om !== null && offMin(new Date(), z[2]) === om))
        zs.push({c: {name: z[1], country: 'Time zone', cc: z[3], tz: z[2]}, zone: z[0].split(' ')[0]});
    });
    zs.sort(function (x, y) { return (x.zone.toLowerCase().split(' ')[0] === q || x.c.name && ZONES.some(function (z) { return z[1] === x.c.name && z[0].toLowerCase().split(' ').indexOf(q) > -1; }) ? 0 : 1) - (y.zone.toLowerCase().split(' ')[0] === q || ZONES.some(function (z) { return z[1] === y.c.name && z[0].toLowerCase().split(' ').indexOf(q) > -1; }) ? 0 : 1); });
    if (om !== null && om % 60 === 0 && Math.abs(om) <= 14 * 60 && !zs.length) { var h = om / 60, tz = h === 0 ? 'UTC' : 'Etc/GMT' + (h > 0 ? '-' : '+') + Math.abs(h); zs.push({c: {name: offStr(om), country: 'Fixed offset', cc: '', tz: tz}, zone: offStr(om)}); }
    var src = window.CITIES_FULL || window.CITIES || [], seen = {}, cs = [];
    for (var i = 0; i < src.length && cs.length < 60; i++) {
      var c = src[i], n = norm(c.name), cn = norm(c.country), s = om !== null ? (offMin(new Date(), c.tz) === om ? 1 : 9) : n === q ? 0 : n.indexOf(q) === 0 ? 1 : (' ' + n).indexOf(' ' + q) > -1 ? 2 : cn.indexOf(q) === 0 ? 3 : 9;
      if (s < 9 && !seen[n + c.cc]) { seen[n + c.cc] = 1; cs.push({c: c, s: s}); }
    }
    cs.sort(function (a, b) { return a.s - b.s || (b.c.pop || 0) - (a.c.pop || 0); });
    var exact = zs.length && (om !== null || ZONES.some(function (z) { return z[0].toLowerCase().split(' ').indexOf(q) > -1; }));
    if (exact) groups.push(['Time zones', zs.slice(0, 4)]);
    if (cs.length) groups.push(['Cities', cs.slice(0, exact ? 5 : 7)]);
    if (zs.length && !exact) groups.push(['Time zones', zs.slice(0, 4)]);
  }
  var html = '';
  groups.forEach(function (g) {
    html += '<div class="mp-g">' + g[0] + '</div>';
    g[1].forEach(function (r) {
      var c = r.c, idx = RES.length, dim = have(c); RES.push(dim ? null : c);
      html += '<button type="button" class="mp-r' + (dim ? ' dim' : '') + '" role="option" data-r="' + idx + '"' + (dim ? ' aria-disabled="true"' : '') + '>' +
        (r.zone ? '<span class="mp-ab">' + esc(abbr(c.tz, Date.now())) + '</span>' : flagHTML(c, 22)) +
        '<span>' + esc(c.name) + (c.country && !r.zone ? ', ' + esc(c.country) : '') + '</span><small>' + (dim ? 'Added' : offStr(offMin(new Date(), c.tz))) + '</small><span class="mp-mono">' + esc(hm(Date.now(), c.tz)) + '</span></button>';
    });
  });
  if (!html) html = q ? '<div class="mp-x">' + (FULL && !window.CITIES_FULL ? 'Searching all cities…' : 'No matches for “' + esc(raw) + '”. Try a city, or a time zone like “PST” or “UTC+8”.') + '</div>' : '';
  dd.innerHTML = html; dd.classList.toggle('open', !!html); $('#mpQ').setAttribute('aria-expanded', html ? 'true' : 'false');
}
function closeDrop() { $('#mpDrop').classList.remove('open'); $('#mpQ').setAttribute('aria-expanded', 'false'); hi = -1; }

/* ---------- drag to reorder (desktop rows) ---------- */
function bindDrag() {
  var from = -1, over = -1;
  $('#mpRows').addEventListener('pointerdown', function (e) {
    var h = e.target.closest('[data-drag]'); if (!h) return;
    e.preventDefault(); from = +h.getAttribute('data-drag'); over = from;
    var row = h.closest('.mp-row'); row.classList.add('drag');
    var move = function (ev) {
      var rows = $$('#mpRows .mp-row'); over = rows.length - 1;
      for (var i = 0; i < rows.length; i++) { var r = rows[i].getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { over = i; break; } }
      rows.forEach(function (r, i) { r.classList.toggle('over', i === over && over !== from); });
    };
    var up = function () {
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
      if (over !== from && from > -1) { var keep = base() + P.sel * MIN, c = P.cities.splice(from, 1)[0]; P.cities.splice(over > from ? over - 1 : over, 0, c); if (over === 0 || from === 0) keepInstant(keep); save(); }
      from = -1; render();
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
  });
}

/* ---------- events ---------- */
function bind() {
  var q = $('#mpQ');
  q.addEventListener('focus', function () { loadFull(); search(); });
  q.addEventListener('input', search);
  q.addEventListener('keydown', function (e) {
    var rows = $$('#mpDrop .mp-r:not(.dim)');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (!rows.length) return; e.preventDefault(); hi = (hi + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length; rows.forEach(function (r, i) { r.classList.toggle('hl', i === hi); }); rows[hi].scrollIntoView({block: 'nearest'}); }
    else if (e.key === 'Enter') { e.preventDefault(); var r = rows[hi < 0 ? 0 : hi]; if (r) r.click(); }
    else if (e.key === 'Escape') { closeDrop(); q.blur(); }
  });
  $('#mpDrop').addEventListener('mousedown', function (e) { e.preventDefault(); });
  $('#mpDrop').addEventListener('click', function (e) {
    var r = e.target.closest('[data-r]'); if (!r) return; var c = RES[+r.getAttribute('data-r')]; if (!c) return;
    if (addCity(c)) { q.value = ''; closeDrop(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.mp-search')) closeDrop();
    if (!e.target.closest('.mp-acts')) closeMenus();
  });
  $('#mpChips').addEventListener('click', function (e) { var b = e.target.closest('[data-chip]'); if (b) addCity(CHIPS[+b.getAttribute('data-chip')]); });
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-rm]'))) return removeCity(+t.getAttribute('data-rm'));
    if ((t = e.target.closest('[data-home]'))) return makeHome(+t.getAttribute('data-home'));
    if ((t = e.target.closest('.mp-c[data-h], .mp-ovb [data-h], .mp-vr[data-h]'))) return select(+t.getAttribute('data-h') * 60);
    if ((t = e.target.closest('[data-best]'))) { var b = BEST[+t.getAttribute('data-best')]; if (b) { select(b.s); if (window.matchMedia('(max-width:760px)').matches) { var r = $('.mp-vr.sel'); if (r) r.scrollIntoView({block: 'center', behavior: 'smooth'}); } } return; }
    if (e.target.closest('#mpMore')) { P._more = !P._more; renderBest(); return; }
    if (e.target.closest('#mpNight')) { P.night = !P.night; render(); return; }
    if ((t = e.target.closest('[data-menu]'))) { var m = t.parentNode.querySelector('.mp-menu'), o = !m.classList.contains('open'); closeMenus(); m.classList.toggle('open', o); t.setAttribute('aria-expanded', o ? 'true' : 'false'); return; }
    if ((t = e.target.closest('[data-cal]'))) return calendar(t.getAttribute('data-cal'));
    if (e.target.closest('[data-copy]')) return copy(meetingText() + '\n' + shareURL(), 'Meeting times copied');
    if (e.target.closest('[data-share]')) return share();
  });
  document.addEventListener('keydown', function (e) {
    var r = e.target.closest && e.target.closest('.mp-vr[data-h]'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(+r.getAttribute('data-h') * 60); }
    if (e.key === 'Escape') closeMenus();
  });
  $('#mpPrev').addEventListener('click', function () { setDate(shiftDate(P.date, -1)); });
  $('#mpNext').addEventListener('click', function () { setDate(shiftDate(P.date, 1)); });
  $('#mpToday').addEventListener('click', function () { P._fixed = false; setDate(todayIn(home())); });
  $('#mpDateIn').addEventListener('change', function () { if (this.value) setDate(this.value); });
  $('#mpLen').addEventListener('change', function () { P.len = +this.value; save(); if (P.sel + P.len > 1440) P.sel = 1440 - P.len; render(); });
  $('#mpWork').addEventListener('change', function () { var a = this.value.split('-'); P.ws = +a[0]; P.we = +a[1]; save(); render(); });
  var applyTyped = function () {
    var v = $('#mpTypeT').value; if (!/^\d{1,2}:\d{2}$/.test(v)) return;
    var c = P.cities[+$('#mpTypeC').value] || P.cities[0]; if (!c) return;
    var a = v.split(':'), dayInCity = parts(base() + P.sel * MIN, c.tz).key;
    keepInstant(zoned(dayInCity, (+a[0]) * 60 + (+a[1]), c.tz)); P._fixed = true; render();
  };
  $('#mpTypeT').addEventListener('change', applyTyped);
  $('#mpTypeC').addEventListener('change', function () { renderSlot(); });
  bindDrag();
}
function navH() {
  var n = document.querySelector('.tzb-nav,.topnav'); if (!n) return;
  var cs = getComputedStyle(n);
  document.documentElement.style.setProperty('--mp-navh', (cs.position === 'sticky' || cs.position === 'fixed') ? n.offsetHeight + 'px' : '0px');
}

window.onFmtChange = function () { render(); };
window.onPinsChanged = function () { renderChips(); };
window.MP_BOOT = function () {
  load(); fromURL();
  if (!P.date) P.date = todayIn(home());
  $('#mpLen').value = String(P.len); $('#mpWork').value = P.ws + '-' + P.we;
  if (!$('#mpWork').value) { var o = document.createElement('option'); o.value = P.ws + '-' + P.we; o.textContent = P.ws + ':00–' + P.we + ':00'; $('#mpWork').appendChild(o); $('#mpWork').value = o.value; }
  if (!P._fixed) { var b = bestSlots()[0]; if (b) P.sel = b.s; }
  if (window.innerWidth <= 760) $('#mpQ').placeholder = 'Add a city or time zone…';
  save(); bind(); render(); navH(); setTimeout(navH, 400); window.addEventListener('resize', navH);
  setInterval(function () { if (!document.hidden) render(); }, 60000);
};
})();
