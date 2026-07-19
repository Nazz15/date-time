// weather.js — Weather page, uses WC.pinned (from util.js) as city source
// No separate WXP.cities — pinned cities ARE the weather cities.

var WXP = { unit: localStorage.getItem('wx_unit')||'celsius', cache: {} };

var WX_ICONS = {0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',65:'🌧',71:'🌨',73:'❄️',75:'❄️',77:'❄️',80:'🌦',81:'🌧',82:'⛈',85:'🌨',86:'❄️',95:'⛈',96:'⛈',99:'⛈'};
var WX_DESC  = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Slight rain',63:'Moderate rain',65:'Heavy rain',71:'Slight snow',73:'Moderate snow',75:'Heavy snow',77:'Snow grains',80:'Slight showers',81:'Showers',82:'Violent showers',85:'Slight snow shower',86:'Heavy snow shower',95:'Thunderstorm',96:'Thunderstorm + hail',99:'Thunderstorm + heavy hail'};

// ── City-name based coordinate lookup ────────────────────────────────────────
var CITY_COORDS = {
  'Mumbai':{lat:19.076,lon:72.877},'Delhi':{lat:28.611,lon:77.209},
  'New Delhi':{lat:28.611,lon:77.209},'Kolkata':{lat:22.572,lon:88.363},
  'Chennai':{lat:13.083,lon:80.270},'Bangalore':{lat:12.972,lon:77.594},
  'Bengaluru':{lat:12.972,lon:77.594},'Hyderabad':{lat:17.388,lon:78.474},
  'Ahmedabad':{lat:23.023,lon:72.572},'Pune':{lat:18.520,lon:73.857},
  'Jaipur':{lat:26.912,lon:75.787},'Lucknow':{lat:26.847,lon:80.947},
  'New York':{lat:40.714,lon:-74.006},'Los Angeles':{lat:34.052,lon:-118.244},
  'Chicago':{lat:41.850,lon:-87.650},'Houston':{lat:29.760,lon:-95.369},
  'Phoenix':{lat:33.448,lon:-112.074},'Philadelphia':{lat:39.953,lon:-75.165},
  'San Antonio':{lat:29.425,lon:-98.494},'San Diego':{lat:32.715,lon:-117.157},
  'Dallas':{lat:32.783,lon:-96.797},'Seattle':{lat:47.606,lon:-122.332},
  'Denver':{lat:39.739,lon:-104.984},'Boston':{lat:42.360,lon:-71.059},
  'Atlanta':{lat:33.749,lon:-84.388},'Miami':{lat:25.775,lon:-80.208},
  'Honolulu':{lat:21.307,lon:-157.858},'Anchorage':{lat:61.218,lon:-149.900},
  'London':{lat:51.507,lon:-0.128},'Birmingham':{lat:52.486,lon:-1.890},
  'Manchester':{lat:53.481,lon:-2.244},'Glasgow':{lat:55.860,lon:-4.251},
  'Edinburgh':{lat:55.953,lon:-3.189},
  'Sydney':{lat:-33.869,lon:151.209},'Melbourne':{lat:-37.814,lon:144.963},
  'Brisbane':{lat:-27.468,lon:153.028},'Perth':{lat:-31.952,lon:115.861},
  'Adelaide':{lat:-34.929,lon:138.601},
  'Toronto':{lat:43.651,lon:-79.383},'Montreal':{lat:45.509,lon:-73.554},
  'Vancouver':{lat:49.246,lon:-123.116},'Calgary':{lat:51.045,lon:-114.058},
  'Moscow':{lat:55.752,lon:37.616},'Saint Petersburg':{lat:59.939,lon:30.316},
  'São Paulo':{lat:-23.550,lon:-46.633},'Sao Paulo':{lat:-23.550,lon:-46.633},
  'Rio de Janeiro':{lat:-22.908,lon:-43.173},
  'Paris':{lat:48.857,lon:2.352},'Berlin':{lat:52.520,lon:13.405},
  'Madrid':{lat:40.416,lon:-3.703},'Rome':{lat:41.902,lon:12.496},
  'Amsterdam':{lat:52.374,lon:4.890},'Vienna':{lat:48.209,lon:16.373},
  'Stockholm':{lat:59.332,lon:18.065},'Warsaw':{lat:52.229,lon:21.012},
  'Prague':{lat:50.088,lon:14.421},'Budapest':{lat:47.498,lon:19.040},
  'Athens':{lat:37.984,lon:23.728},'Lisbon':{lat:38.717,lon:-9.143},
  'Helsinki':{lat:60.169,lon:24.935},'Oslo':{lat:59.913,lon:10.752},
  'Copenhagen':{lat:55.676,lon:12.568},'Zurich':{lat:47.376,lon:8.541},
  'Dublin':{lat:53.330,lon:-6.249},'Kyiv':{lat:50.450,lon:30.524},
  'Dubai':{lat:25.204,lon:55.270},'Abu Dhabi':{lat:24.466,lon:54.367},
  'Riyadh':{lat:24.686,lon:46.724},'Istanbul':{lat:41.013,lon:28.948},
  'Tehran':{lat:35.694,lon:51.421},'Baghdad':{lat:33.341,lon:44.401},
  'Beirut':{lat:33.889,lon:35.501},'Doha':{lat:25.286,lon:51.533},
  'Muscat':{lat:23.614,lon:58.593},'Kuwait City':{lat:29.375,lon:47.977},
  'Dhaka':{lat:23.724,lon:90.409},'Karachi':{lat:24.861,lon:67.010},
  'Lahore':{lat:31.558,lon:74.357},'Islamabad':{lat:33.729,lon:73.094},
  'Colombo':{lat:6.927,lon:79.861},'Kathmandu':{lat:27.717,lon:85.314},
  'Bangkok':{lat:13.754,lon:100.502},'Singapore':{lat:1.352,lon:103.820},
  'Kuala Lumpur':{lat:3.149,lon:101.698},'Jakarta':{lat:-6.211,lon:106.845},
  'Manila':{lat:14.597,lon:120.984},'Ho Chi Minh City':{lat:10.823,lon:106.629},
  'Hanoi':{lat:21.028,lon:105.854},'Seoul':{lat:37.566,lon:126.978},
  'Tokyo':{lat:35.689,lon:139.692},'Osaka':{lat:34.694,lon:135.502},
  'Taipei':{lat:25.048,lon:121.514},'Hong Kong':{lat:22.320,lon:114.185},
  'Shanghai':{lat:31.230,lon:121.473},'Beijing':{lat:39.906,lon:116.391},
  'Guangzhou':{lat:23.130,lon:113.260},'Shenzhen':{lat:22.543,lon:114.058},
  'Cairo':{lat:30.060,lon:31.229},'Lagos':{lat:6.455,lon:3.384},
  'Nairobi':{lat:-1.286,lon:36.820},'Johannesburg':{lat:-26.204,lon:28.046},
  'Cape Town':{lat:-33.924,lon:18.424},'Casablanca':{lat:33.589,lon:-7.603},
  'Accra':{lat:5.603,lon:-0.187},'Addis Ababa':{lat:9.025,lon:38.747},
  'Mexico City':{lat:19.433,lon:-99.133},'Buenos Aires':{lat:-34.603,lon:-58.381},
  'Lima':{lat:-12.046,lon:-77.043},'Bogota':{lat:4.711,lon:-74.073},
  'Santiago':{lat:-33.457,lon:-70.648},'Caracas':{lat:10.480,lon:-66.879},
  'Auckland':{lat:-36.867,lon:174.770}
};

var TZ_COORDS = {
  'Europe/London':{lat:51.507,lon:-0.128},'America/New_York':{lat:40.714,lon:-74.006},
  'Asia/Tokyo':{lat:35.689,lon:139.692},'Asia/Dubai':{lat:25.204,lon:55.270},
  'Asia/Singapore':{lat:1.352,lon:103.820},'America/Los_Angeles':{lat:34.052,lon:-118.244},
  'Europe/Paris':{lat:48.857,lon:2.352},'Europe/Berlin':{lat:52.520,lon:13.405},
  'Europe/Moscow':{lat:55.752,lon:37.616},'Asia/Shanghai':{lat:31.230,lon:121.473},
  'Asia/Seoul':{lat:37.566,lon:126.978},'Australia/Sydney':{lat:-33.869,lon:151.209},
  'America/Sao_Paulo':{lat:-23.550,lon:-46.633},'America/Chicago':{lat:41.850,lon:-87.650},
  'Africa/Nairobi':{lat:-1.286,lon:36.820},'Africa/Cairo':{lat:30.060,lon:31.229},
  'Asia/Bangkok':{lat:13.754,lon:100.502},'Asia/Karachi':{lat:24.861,lon:67.010},
  'America/Toronto':{lat:43.651,lon:-79.383},'Asia/Kolkata':{lat:19.076,lon:72.877},
  'Asia/Hong_Kong':{lat:22.320,lon:114.185},'Asia/Jakarta':{lat:-6.211,lon:106.845},
  'Asia/Riyadh':{lat:24.686,lon:46.724},'Asia/Dhaka':{lat:23.724,lon:90.409},
  'Africa/Lagos':{lat:6.455,lon:3.384},'America/Mexico_City':{lat:19.433,lon:-99.133},
  'America/Argentina/Buenos_Aires':{lat:-34.603,lon:-58.381},
  'Europe/Istanbul':{lat:41.013,lon:28.948},'Europe/Warsaw':{lat:52.229,lon:21.012},
  'Pacific/Auckland':{lat:-36.867,lon:174.770}
};

function getCoords(city) {
  if (city._lat != null) return {lat: city._lat, lon: city._lon};
  var n = city.name;
  if (CITY_COORDS[n]) return CITY_COORDS[n];
  var t = n.replace(/\s*[\(\[].*/, '').trim();
  if (CITY_COORDS[t]) return CITY_COORDS[t];
  if (TZ_COORDS[city.tz]) return TZ_COORDS[city.tz];
  if (city.tz.startsWith('Asia/'))      return {lat:25,  lon:85};
  if (city.tz.startsWith('Europe/'))    return {lat:50,  lon:15};
  if (city.tz.startsWith('America/'))   return {lat:40,  lon:-80};
  if (city.tz.startsWith('Africa/'))    return {lat:5,   lon:20};
  if (city.tz.startsWith('Australia/')) return {lat:-25, lon:135};
  return {lat:40.714, lon:-74.006};
}

var unitSym = function(){ return WXP.unit === 'celsius' ? '°C' : '°F'; };

function setUnit(u) {
  WXP.unit = u;
  localStorage.setItem('wx_unit', u);
  document.querySelectorAll('.unit-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.u === u);
  });
  WXP.cache = {};
  renderAllWx();
}

// ── Fetch ────────────────────────────────────────────────────────────────────
function fetchWx(city, cb) {
  var c = getCoords(city);
  var key = c.lat + ',' + c.lon + '_' + WXP.unit;
  if (WXP.cache[key]) { cb(null, WXP.cache[key]); return; }
  var url = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude='  + c.lat + '&longitude=' + c.lon
    + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index,visibility'
    + '&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset'
    + '&temperature_unit=' + WXP.unit
    + '&windspeed_unit=kmh&precipitation_unit=mm&timezone=auto&forecast_days=14';
  fetch(url)
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(d){
      if(!d.current) throw new Error('No data');
      WXP.cache[key] = d; cb(null, d);
    })
    .catch(function(e){ cb(e, null); });
}

// ── Compact summary strip (overrides renderStrip from util.js) ───────────────
// Called by onPinsChanged and on load
function renderStrip() {
  var el = document.getElementById('my-strip');
  if (!el) return;
  if (!WC.pinned.length) {
    el.innerHTML = '<span class="strip-empty">Search above to add cities</span>';
    return;
  }
  // Render placeholder chips first, then fill with live weather
  el.innerHTML = WC.pinned.map(function(c, i) {
    return '<div class="wx-chip wx-chip-loading" id="chip-' + i + '" onclick="scrollToCard(' + i + ')" role="button" tabindex="0">'
      + '<div class="wx-chip-flag">' + flag(c.cc, 22) + '</div>'
      + '<div class="wx-chip-info">'
      +   '<div class="wx-chip-city">' + c.name + '</div>'
      +   '<div class="wx-chip-country">' + c.country + '</div>'
      + '</div>'
      + '<div class="wx-chip-wx" id="chip-wx-' + i + '"><span class="wx-chip-spinner">…</span></div>'
      + '<button class="wx-chip-rm" onclick="event.stopPropagation();removePin(' + i + ')" title="Remove ' + c.name + '">✕</button>'
      + '</div>';
  }).join('');

  // Fetch weather for each chip
  WC.pinned.forEach(function(c, i) {
    fetchWx(c, function(err, data) {
      var chipWx = document.getElementById('chip-wx-' + i);
      var chip   = document.getElementById('chip-' + i);
      if (!chipWx) return;
      if (err || !data || !data.current) {
        chipWx.innerHTML = '<span class="wx-chip-err">N/A</span>';
        return;
      }
      var code = data.current.weather_code || 0;
      var temp = Math.round(data.current.temperature_2m);
      chipWx.innerHTML = '<div class="wx-chip-icon">' + (WX_ICONS[code]||'🌡') + '</div>'
        + '<div class="wx-chip-temp">' + temp + unitSym() + '</div>'
        + '<div class="wx-chip-desc">' + (WX_DESC[code]||'') + '</div>';
      if (chip) chip.classList.remove('wx-chip-loading');
    });
  });
}

function scrollToCard(i) {
  // Highlight and scroll to the matching detail card
  document.querySelectorAll('.wx-city-card').forEach(function(el){ el.classList.remove('wx-card-active'); });
  document.querySelectorAll('.wx-chip').forEach(function(el){ el.classList.remove('active'); });
  var card = document.getElementById('wx-card-' + i);
  var chip = document.getElementById('chip-' + i);
  if (card) { card.classList.add('wx-card-active'); card.scrollIntoView({behavior:'smooth',block:'start'}); }
  if (chip) chip.classList.add('active');
}

// ── Detail card builder ──────────────────────────────────────────────────────
function wxStat(ico, val, lbl) {
  return '<div class="wx-stat"><div class="wx-stat-ico">' + ico + '</div>'
    + '<div class="wx-stat-val">' + val + '</div>'
    + '<div class="wx-stat-lbl">' + lbl + '</div></div>';
}

function buildCard(city, i, data) {
  var cw = data.current, h = data.hourly, daily = data.daily;
  var code = cw.weather_code || 0;
  var U    = unitSym();

  // Correct local hour index (BUG FIX: use city tz, not UTC)
  var baseH = 0;
  if (h && h.time) {
    var localNow = new Date().toLocaleString('sv', {timeZone: city.tz});
    var nowLocal = localNow.slice(0,10) + 'T' + localNow.slice(11,13);
    var idx = h.time.findIndex(function(t){ return t.slice(0,13) === nowLocal; });
    if (idx >= 0) baseH = idx;
  }

  var hum   = cw.relative_humidity_2m   != null ? cw.relative_humidity_2m + '%'          : 'N/A';
  var wind  = cw.wind_speed_10m         != null ? cw.wind_speed_10m + ' km/h'             : 'N/A';
  var feels = cw.apparent_temperature   != null ? Math.round(cw.apparent_temperature) + U : 'N/A';
  var uv    = cw.uv_index               != null ? cw.uv_index                             : 'N/A';
  var vis   = cw.visibility             != null ? (cw.visibility/1000).toFixed(1) + ' km' : 'N/A';
  var rain  = cw.precipitation          != null ? cw.precipitation + ' mm'                : 'N/A';
  var windDir = '';
  if (cw.wind_direction_10m != null) {
    var dirs = ['N','NE','E','SE','S','SW','W','NW'];
    windDir = ' ' + dirs[Math.round(cw.wind_direction_10m/45)%8];
  }

  // Sunrise / sunset from daily[0]
  var sunRise = '', sunSet = '';
  if (daily && daily.sunrise && daily.sunrise[0]) {
    sunRise = daily.sunrise[0].slice(11,16);
    sunSet  = daily.sunset  && daily.sunset[0] ? daily.sunset[0].slice(11,16) : '';
  }

  // Hourly — next 12 hours
  var hourlyHtml = '';
  if (h && h.time) {
    hourlyHtml = h.time.slice(baseH, baseH+12).map(function(t, k) {
      var idx = baseH + k;
      var hr  = parseInt(t.slice(11,13));
      var lbl = WC.is24h ? String(hr).padStart(2,'0')+':00' : (hr%12||12)+(hr<12?'AM':'PM');
      return '<div class="hourly-item">'
        + '<div class="hourly-time">'  + lbl + '</div>'
        + '<div class="hourly-icon">'  + (WX_ICONS[h.weather_code[idx]]||'🌡') + '</div>'
        + '<div class="hourly-temp">'  + Math.round(h.temperature_2m[idx]) + U + '</div>'
        + '<div class="hourly-rain">'  + (h.precipitation_probability ? h.precipitation_probability[idx]+'%' : '') + '</div>'
        + '</div>';
    }).join('');
  }

  // Daily 14-day
  var dailyHtml = '';
  if (daily && daily.time) {
    var allMax = daily.temperature_2m_max, allMin = daily.temperature_2m_min;
    var gMin = Math.min.apply(null,allMin), gMax = Math.max.apply(null,allMax);
    dailyHtml = daily.time.map(function(t, k) {
      var dt  = new Date(t + 'T12:00');
      var day = k===0?'Today':k===1?'Tomorrow':dt.toLocaleDateString('en-US',{weekday:'short'});
      var hi  = Math.round(allMax[k]), lo = Math.round(allMin[k]);
      var bp  = gMax>gMin ? Math.round((hi-gMin)/(gMax-gMin)*100) : 50;
      return '<div class="daily-row">'
        + '<span class="daily-day">'  + day + '</span>'
        + '<span class="daily-icon">' + (WX_ICONS[daily.weather_code[k]]||'🌡') + '</span>'
        + '<span class="daily-desc">' + (WX_DESC[daily.weather_code[k]]||'') + '</span>'
        + '<div class="daily-bar"><div class="daily-bar-fill" style="width:'+bp+'%"></div></div>'
        + '<span class="daily-temps">' + hi + U + ' <span class="daily-low">' + lo + U + '</span></span>'
        + '</div>';
    }).join('');
  }

  return '<div class="wx-city-card" id="wx-card-' + i + '">'
    + '<div class="wx-card-hdr">'
    +   '<div class="wx-card-hdr-left">' + flag(city.cc, 22)
    +     '<div><div class="wx-city-name">' + city.name + '</div>'
    +          '<div class="wx-country-name">' + city.country + '</div></div>'
    +   '</div>'
    +   '<button class="wx-rm" onclick="removePin(' + i + ')" title="Remove">✕</button>'
    + '</div>'
    + '<div class="wx-current">'
    +   '<div class="wx-current-left">'
    +     '<div class="wx-main-icon">' + (WX_ICONS[code]||'🌡') + '</div>'
    +     '<div>'
    +       '<div class="wx-main-temp">' + Math.round(cw.temperature_2m) + U + '</div>'
    +       '<div class="wx-main-desc">' + (WX_DESC[code]||'') + '</div>'
    +       '<div class="wx-feels">Feels like ' + feels + ' · ' + wind + windDir + '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div class="wx-stats-grid">'
    +     wxStat('💧', hum,  'Humidity')
    +     wxStat('💨', wind, 'Wind')
    +     wxStat('🌧', rain, 'Rain')
    +     wxStat('☀️', uv,   'UV Index')
    +     wxStat('👁', vis,  'Visibility')
    +     (sunRise ? wxStat('🌅', sunRise + (sunSet ? ' / ' + sunSet : ''), 'Rise / Set') : '')
    +   '</div>'
    + '</div>'
    + (hourlyHtml ? '<div class="wx-section"><div class="wx-section-label">Next 12 Hours</div><div class="hourly-scroll">' + hourlyHtml + '</div></div>' : '')
    + (dailyHtml  ? '<div class="wx-section"><div class="wx-section-label">14-Day Forecast</div>' + dailyHtml + '</div>' : '')
    + '</div>';
}

function loadCard(city, i) {
  fetchWx(city, function(err, data) {
    var target = document.getElementById('wx-card-' + i);
    if (!target) return;
    if (err || !data) {
      target.innerHTML = '<div class="wx-error">'
        + '<i class="ti ti-cloud-off" style="font-size:28px;opacity:.4"></i>'
        + '<div>Weather unavailable for <strong>' + city.name + '</strong></div>'
        + '<small>' + (err ? err.message : 'No data') + '</small>'
        + '<button onclick="WXP.cache={};renderAllWx()">↻ Retry</button></div>';
      return;
    }
    var wrapper = document.createElement('div');
    wrapper.innerHTML = buildCard(city, i, data);
    var newCard = wrapper.firstElementChild;
    if (newCard) target.replaceWith(newCard);
  });
}

function renderAllWx() {
  var el = document.getElementById('wx-list');
  if (!el) return;
  if (!WC.pinned.length) {
    el.innerHTML = '<div class="wx-empty"><i class="ti ti-cloud" style="font-size:40px;opacity:.25"></i>'
      + '<p>Search above to add cities and compare weather.</p></div>';
    return;
  }
  el.innerHTML = WC.pinned.map(function(c, i) {
    return '<div class="wx-city-card wx-skeleton" id="wx-card-' + i + '">'
      + '<div class="wx-skeleton-inner">'
      + '<div class="wx-skeleton-flag"></div>'
      + '<div><div class="wx-skeleton-title">' + c.name + '</div>'
      + '<div class="wx-skeleton-sub">Loading weather…</div></div></div></div>';
  }).join('');
  WC.pinned.forEach(function(c, i) { loadCard(c, i); });
}

// ── Auto-locate ──────────────────────────────────────────────────────────────
function autoLocateWx() {
  if (!navigator.geolocation) { toast('Geolocation not supported'); return; }
  toast('Detecting location…');
  navigator.geolocation.getCurrentPosition(function(pos) {
    var lat = pos.coords.latitude, lon = pos.coords.longitude;
    fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+lat+'&longitude='+lon+'&localityLanguage=en')
      .then(function(r){ return r.json(); })
      .then(function(d) {
        var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        var city = {
          name: d.city || d.locality || 'My Location',
          country: d.countryName || '',
          cc: (d.countryCode || 'un').toLowerCase(),
          tz: tz, _lat: lat, _lon: lon
        };
        CITY_COORDS[city.name] = {lat:lat, lon:lon};
        addPin(city);
      })
      .catch(function() {
        var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        addPin({name:'My Location', country:'', cc:'un', tz:tz, _lat:lat, _lon:lon});
      });
  }, function() { toast('Location access denied'); });
}

// ── Callbacks triggered by util.js ──────────────────────────────────────────
function onPinsChanged() {
  WXP.cache = {}; // clear cache so removed/added cities always fetch fresh
  renderStrip();
  renderAllWx();
}
function onFmtChange() { renderStrip(); }

// ── Boot ─────────────────────────────────────────────────────────────────────
boot();
loadPins();
renderStrip();

document.querySelectorAll('.unit-btn').forEach(function(b) {
  b.classList.toggle('active', b.dataset.u === WXP.unit);
});

renderAllWx();

initSearch('wx-srch', 'wx-dd', function(city) {
  addPin(city);
  document.getElementById('wx-srch').value = '';
  document.getElementById('wx-dd').hidden = true;
}, {showPinned: false});
