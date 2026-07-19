// location.js — enhances static city pages with live weather
// Loaded on every /location/country/city/ page
// Depends on: util.js (already loaded), Open-Meteo API (free, no key)

(function () {

// ── Coordinate table (city name → lat/lon) ──────────────────────────────────
var COORDS = {
  'mumbai':{lat:19.076,lon:72.877},'delhi':{lat:28.611,lon:77.209},
  'new-delhi':{lat:28.611,lon:77.209},'kolkata':{lat:22.572,lon:88.363},
  'chennai':{lat:13.083,lon:80.270},'bengaluru':{lat:12.972,lon:77.594},
  'hyderabad':{lat:17.388,lon:78.474},'ahmedabad':{lat:23.023,lon:72.572},
  'pune':{lat:18.520,lon:73.857},'jaipur':{lat:26.912,lon:75.787},
  'lucknow':{lat:26.847,lon:80.947},'surat':{lat:21.195,lon:72.820},
  'new-york':{lat:40.714,lon:-74.006},'los-angeles':{lat:34.052,lon:-118.244},
  'chicago':{lat:41.850,lon:-87.650},'houston':{lat:29.760,lon:-95.369},
  'phoenix':{lat:33.448,lon:-112.074},'philadelphia':{lat:39.953,lon:-75.165},
  'san-antonio':{lat:29.425,lon:-98.494},'san-diego':{lat:32.715,lon:-117.157},
  'dallas':{lat:32.783,lon:-96.797},'seattle':{lat:47.606,lon:-122.332},
  'denver':{lat:39.739,lon:-104.984},'boston':{lat:42.360,lon:-71.059},
  'atlanta':{lat:33.749,lon:-84.388},'miami':{lat:25.775,lon:-80.208},
  'honolulu':{lat:21.307,lon:-157.858},'anchorage':{lat:61.218,lon:-149.900},
  'london':{lat:51.507,lon:-0.128},'birmingham':{lat:52.486,lon:-1.890},
  'manchester':{lat:53.481,lon:-2.244},'glasgow':{lat:55.860,lon:-4.251},
  'edinburgh':{lat:55.953,lon:-3.189},
  'sydney':{lat:-33.869,lon:151.209},'melbourne':{lat:-37.814,lon:144.963},
  'brisbane':{lat:-27.468,lon:153.028},'perth':{lat:-31.952,lon:115.861},
  'adelaide':{lat:-34.929,lon:138.601},
  'toronto':{lat:43.651,lon:-79.383},'montreal':{lat:45.509,lon:-73.554},
  'vancouver':{lat:49.246,lon:-123.116},'calgary':{lat:51.045,lon:-114.058},
  'moscow':{lat:55.752,lon:37.616},'saint-petersburg':{lat:59.939,lon:30.316},
  'sao-paulo':{lat:-23.550,lon:-46.633},'rio-de-janeiro':{lat:-22.908,lon:-43.173},
  'paris':{lat:48.857,lon:2.352},'berlin':{lat:52.520,lon:13.405},
  'madrid':{lat:40.416,lon:-3.703},'rome':{lat:41.902,lon:12.496},
  'amsterdam':{lat:52.374,lon:4.890},'vienna':{lat:48.209,lon:16.373},
  'stockholm':{lat:59.332,lon:18.065},'warsaw':{lat:52.229,lon:21.012},
  'prague':{lat:50.088,lon:14.421},'budapest':{lat:47.498,lon:19.040},
  'athens':{lat:37.984,lon:23.728},'lisbon':{lat:38.717,lon:-9.143},
  'helsinki':{lat:60.169,lon:24.935},'oslo':{lat:59.913,lon:10.752},
  'copenhagen':{lat:55.676,lon:12.568},'zurich':{lat:47.376,lon:8.541},
  'dublin':{lat:53.330,lon:-6.249},'kyiv':{lat:50.450,lon:30.524},
  'dubai':{lat:25.204,lon:55.270},'abu-dhabi':{lat:24.466,lon:54.367},
  'riyadh':{lat:24.686,lon:46.724},'istanbul':{lat:41.013,lon:28.948},
  'tehran':{lat:35.694,lon:51.421},'baghdad':{lat:33.341,lon:44.401},
  'beirut':{lat:33.889,lon:35.501},'doha':{lat:25.286,lon:51.533},
  'muscat':{lat:23.614,lon:58.593},'kuwait-city':{lat:29.375,lon:47.977},
  'dhaka':{lat:23.724,lon:90.409},'karachi':{lat:24.861,lon:67.010},
  'lahore':{lat:31.558,lon:74.357},'islamabad':{lat:33.729,lon:73.094},
  'colombo':{lat:6.927,lon:79.861},'kathmandu':{lat:27.717,lon:85.314},
  'bangkok':{lat:13.754,lon:100.502},'singapore':{lat:1.352,lon:103.820},
  'kuala-lumpur':{lat:3.149,lon:101.698},'jakarta':{lat:-6.211,lon:106.845},
  'manila':{lat:14.597,lon:120.984},'ho-chi-minh-city':{lat:10.823,lon:106.629},
  'hanoi':{lat:21.028,lon:105.854},'seoul':{lat:37.566,lon:126.978},
  'tokyo':{lat:35.689,lon:139.692},'osaka':{lat:34.694,lon:135.502},
  'taipei':{lat:25.048,lon:121.514},'hong-kong':{lat:22.320,lon:114.185},
  'shanghai':{lat:31.230,lon:121.473},'beijing':{lat:39.906,lon:116.391},
  'guangzhou':{lat:23.130,lon:113.260},'shenzhen':{lat:22.543,lon:114.058},
  'cairo':{lat:30.060,lon:31.229},'lagos':{lat:6.455,lon:3.384},
  'nairobi':{lat:-1.286,lon:36.820},'johannesburg':{lat:-26.204,lon:28.046},
  'cape-town':{lat:-33.924,lon:18.424},'casablanca':{lat:33.589,lon:-7.603},
  'accra':{lat:5.603,lon:-0.187},'addis-ababa':{lat:9.025,lon:38.747},
  'mexico-city':{lat:19.433,lon:-99.133},'buenos-aires':{lat:-34.603,lon:-58.381},
  'lima':{lat:-12.046,lon:-77.043},'bogota':{lat:4.711,lon:-74.073},
  'santiago':{lat:-33.457,lon:-70.648},'caracas':{lat:10.480,lon:-66.879},
  'auckland':{lat:-36.867,lon:174.770}
};

var WX_ICONS = {0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',65:'🌧',71:'🌨',73:'❄️',75:'❄️',77:'❄️',80:'🌦',81:'🌧',82:'⛈',85:'🌨',86:'❄️',95:'⛈',96:'⛈',99:'⛈'};
var WX_DESC  = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Slight rain',63:'Moderate rain',65:'Heavy rain',71:'Slight snow',73:'Moderate snow',75:'Heavy snow',77:'Snow grains',80:'Slight showers',81:'Showers',82:'Violent showers',95:'Thunderstorm',96:'Thunderstorm + hail',99:'Thunderstorm + heavy hail'};

// Extract city slug from URL path segment
function slugFromHref(href) {
  // href like "/location/india/mumbai/" → "mumbai"
  var parts = href.replace(/\/$/, '').split('/');
  return parts[parts.length - 1].toLowerCase();
}

// Get coords by slug
function getCoords(slug) {
  return COORDS[slug] || null;
}

// Fetch Open-Meteo weather for a lat/lon
function fetchWx(lat, lon, cb) {
  var url = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=' + lat + '&longitude=' + lon
    + '&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m,uv_index,visibility'
    + '&daily=sunrise,sunset'
    + '&temperature_unit=celsius&timezone=auto&forecast_days=1';
  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(d) { cb(null, d); })
    .catch(function(e) { cb(e, null); });
}

// ── 1. Enhance the hero section ────────────────────────────────────────────
function enhanceHero() {
  // Get current page city slug from URL
  var pathParts = location.pathname.replace(/\/$/, '').split('/');
  var citySlug = pathParts[pathParts.length - 1];
  var coords = getCoords(citySlug);
  if (!coords) return; // city not in our table — skip silently

  // Find the clock card to augment
  var card = document.querySelector('.loc-clock-card');
  if (!card) return;

  // Insert weather placeholder beside the time
  var wxDiv = document.createElement('div');
  wxDiv.id = 'loc-hero-wx';
  wxDiv.className = 'loc-hero-wx';
  wxDiv.innerHTML = '<div class="loc-hero-wx-inner"><span class="loc-hero-wx-spin">Loading weather…</span></div>';
  card.appendChild(wxDiv);

  fetchWx(coords.lat, coords.lon, function(err, data) {
    var el = document.getElementById('loc-hero-wx');
    if (!el) return;
    if (err || !data || !data.current) {
      el.innerHTML = '';
      return;
    }
    var cw   = data.current;
    var code = cw.weather_code || 0;
    var temp = Math.round(cw.temperature_2m);
    var feel = Math.round(cw.apparent_temperature);
    var hum  = cw.relative_humidity_2m;
    var wind = cw.wind_speed_10m;
    var uv   = cw.uv_index;
    var vis  = cw.visibility != null ? (cw.visibility/1000).toFixed(1) : null;

    // Sunrise / sunset
    var rise = '', set = '';
    if (data.daily && data.daily.sunrise && data.daily.sunrise[0]) {
      rise = data.daily.sunrise[0].slice(11,16);
      set  = data.daily.sunset  && data.daily.sunset[0] ? data.daily.sunset[0].slice(11,16) : '';
    }

    el.innerHTML =
      '<div class="loc-hero-wx-inner">'
      + '<div class="loc-hero-wx-main">'
      +   '<span class="loc-hero-wx-icon">' + (WX_ICONS[code]||'🌡') + '</span>'
      +   '<span class="loc-hero-wx-temp">' + temp + '°C</span>'
      + '</div>'
      + '<div class="loc-hero-wx-desc">' + (WX_DESC[code]||'') + '</div>'
      + '<div class="loc-hero-wx-feels">Feels like ' + feel + '°C</div>'
      + '<div class="loc-hero-wx-stats">'
      +   stat('💧', hum + '%')
      +   stat('💨', wind + ' km/h')
      +   stat('☀️', 'UV ' + uv)
      +   (vis  ? stat('👁', vis + ' km') : '')
      +   (rise ? stat('🌅', rise + (set ? ' / ' + set : '')) : '')
      + '</div>'
      + '</div>';
  });
}

function stat(ico, val) {
  return '<span class="loc-hero-wx-stat">' + ico + ' ' + val + '</span>';
}

// ── 2. Enhance related city cards ──────────────────────────────────────────
function enhanceCityCards() {
  var cards = document.querySelectorAll('.loc-city-card');
  cards.forEach(function(card) {
    var href = card.getAttribute('href') || '';
    var slug = slugFromHref(href);
    var coords = getCoords(slug);
    if (!coords) return;

    // Add weather placeholder
    var wxEl = document.createElement('div');
    wxEl.className = 'loc-card-wx';
    wxEl.innerHTML = '<span class="loc-card-wx-spin">…</span>';
    card.appendChild(wxEl);

    fetchWx(coords.lat, coords.lon, function(err, data) {
      if (err || !data || !data.current) { wxEl.innerHTML = ''; return; }
      var cw   = data.current;
      var code = cw.weather_code || 0;
      var temp = Math.round(cw.temperature_2m);
      wxEl.innerHTML =
        '<span class="loc-card-wx-icon">' + (WX_ICONS[code]||'🌡') + '</span>'
        + '<span class="loc-card-wx-temp">' + temp + '°C</span>'
        + '<span class="loc-card-wx-desc">' + (WX_DESC[code]||'') + '</span>';
    });
  });
}

// ── Boot ───────────────────────────────────────────────────────────────────
// Wait for DOM to be ready (util.js already loaded before us)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    enhanceHero();
    enhanceCityCards();
  });
} else {
  enhanceHero();
  enhanceCityCards();
}

})();
