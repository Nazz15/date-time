// weather.js — Open-Meteo (free, no key), accurate per lat/lon
var WXP = { cities:[], unit:localStorage.getItem('wx_unit')||'celsius', cache:{} };

var WX_ICONS={0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',65:'🌧',71:'🌨',73:'❄️',75:'❄️',77:'❄️',80:'🌦',81:'🌧',82:'⛈',85:'🌨',86:'❄️',95:'⛈',96:'⛈',99:'⛈'};
var WX_DESC={0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Slight rain',63:'Moderate rain',65:'Heavy rain',71:'Slight snow',73:'Moderate snow',75:'Heavy snow',77:'Snow grains',80:'Slight showers',81:'Showers',82:'Violent showers',85:'Slight snow shower',86:'Heavy snow shower',95:'Thunderstorm',96:'Thunderstorm + hail',99:'Thunderstorm + heavy hail'};

// Precise lat/lon per timezone — critical for India accuracy
var COORDS={
  'Asia/Kolkata':{lat:19.076,lon:72.877},  // Mumbai (default for IST)
  'Europe/London':{lat:51.507,lon:-0.128},
  'America/New_York':{lat:40.714,lon:-74.006},
  'Asia/Tokyo':{lat:35.689,lon:139.692},
  'Asia/Dubai':{lat:25.204,lon:55.270},
  'Asia/Singapore':{lat:1.352,lon:103.820},
  'America/Los_Angeles':{lat:34.052,lon:-118.244},
  'Europe/Paris':{lat:48.857,lon:2.352},
  'Europe/Berlin':{lat:52.520,lon:13.405},
  'Europe/Moscow':{lat:55.752,lon:37.616},
  'Asia/Shanghai':{lat:31.230,lon:121.473},
  'Asia/Seoul':{lat:37.566,lon:126.978},
  'Australia/Sydney':{lat:-33.869,lon:151.209},
  'America/Sao_Paulo':{lat:-23.550,lon:-46.633},
  'America/Chicago':{lat:41.850,lon:-87.650},
  'America/Denver':{lat:39.739,lon:-104.984},
  'Africa/Nairobi':{lat:-1.286,lon:36.820},
  'Africa/Cairo':{lat:30.060,lon:31.229},
  'Asia/Bangkok':{lat:13.754,lon:100.502},
  'Asia/Karachi':{lat:24.861,lon:67.010},
  'America/Toronto':{lat:43.651,lon:-79.383},
  'America/Vancouver':{lat:49.246,lon:-123.116},
  'Pacific/Auckland':{lat:-36.867,lon:174.770},
  'Europe/Istanbul':{lat:41.013,lon:28.948},
  'Asia/Riyadh':{lat:24.686,lon:46.724},
  'Asia/Dhaka':{lat:23.724,lon:90.409},
  'Africa/Lagos':{lat:6.455,lon:3.384},
  'America/Mexico_City':{lat:19.433,lon:-99.133},
  'America/Argentina/Buenos_Aires':{lat:-34.603,lon:-58.381},
  'America/Lima':{lat:-12.046,lon:-77.043},
  'Europe/Warsaw':{lat:52.229,lon:21.012},
  'Europe/Rome':{lat:41.902,lon:12.496},
  'Europe/Madrid':{lat:40.416,lon:-3.703},
  'Europe/Amsterdam':{lat:52.374,lon:4.890},
  'Africa/Johannesburg':{lat:-26.204,lon:28.046},
  'Africa/Casablanca':{lat:33.589,lon:-7.603},
  'Africa/Algiers':{lat:36.737,lon:3.086},
  'Africa/Accra':{lat:5.603,lon:-0.187},
  'Africa/Dar_es_Salaam':{lat:-6.792,lon:39.208},
  'Africa/Khartoum':{lat:15.552,lon:32.532},
  'Africa/Kinshasa':{lat:-4.322,lon:15.322},
  'Asia/Almaty':{lat:43.250,lon:76.943},
  'Asia/Baghdad':{lat:33.341,lon:44.401},
  'Asia/Beirut':{lat:33.889,lon:35.501},
  'Asia/Colombo':{lat:6.927,lon:79.861},
  'Asia/Hong_Kong':{lat:22.320,lon:114.185},
  'Asia/Jakarta':{lat:-6.211,lon:106.845},
  'Asia/Kabul':{lat:34.529,lon:69.176},
  'Asia/Kathmandu':{lat:27.717,lon:85.314},
  'Asia/Kuala_Lumpur':{lat:3.149,lon:101.698},
  'Asia/Kuwait':{lat:29.375,lon:47.977},
  'Asia/Lahore':{lat:31.558,lon:74.357},
  'Asia/Manila':{lat:14.597,lon:120.984},
  'Asia/Muscat':{lat:23.614,lon:58.593},
  'Asia/Nicosia':{lat:35.166,lon:33.361},
  'Asia/Phnom_Penh':{lat:11.562,lon:104.916},
  'Asia/Taipei':{lat:25.048,lon:121.514},
  'Asia/Tashkent':{lat:41.299,lon:69.240},
  'Asia/Tbilisi':{lat:41.694,lon:44.834},
  'Asia/Tehran':{lat:35.694,lon:51.421},
  'Asia/Ulaanbaatar':{lat:47.921,lon:106.918},
  'Asia/Vladivostok':{lat:43.115,lon:131.885},
  'Asia/Yangon':{lat:16.855,lon:96.139},
  'Asia/Yekaterinburg':{lat:56.838,lon:60.597},
  'Asia/Yerevan':{lat:40.181,lon:44.514},
  'Atlantic/Reykjavik':{lat:64.135,lon:-21.895},
  'Australia/Adelaide':{lat:-34.929,lon:138.601},
  'Australia/Brisbane':{lat:-27.468,lon:153.028},
  'Australia/Melbourne':{lat:-37.814,lon:144.963},
  'Australia/Perth':{lat:-31.952,lon:115.861},
  'Europe/Athens':{lat:37.984,lon:23.728},
  'Europe/Belgrade':{lat:44.787,lon:20.457},
  'Europe/Bucharest':{lat:44.432,lon:26.104},
  'Europe/Budapest':{lat:47.498,lon:19.040},
  'Europe/Copenhagen':{lat:55.676,lon:12.568},
  'Europe/Dublin':{lat:53.330,lon:-6.249},
  'Europe/Helsinki':{lat:60.169,lon:24.935},
  'Europe/Kyiv':{lat:50.450,lon:30.524},
  'Europe/Lisbon':{lat:38.717,lon:-9.143},
  'Europe/Minsk':{lat:53.906,lon:27.555},
  'Europe/Oslo':{lat:59.913,lon:10.752},
  'Europe/Prague':{lat:50.088,lon:14.421},
  'Europe/Sofia':{lat:42.698,lon:23.322},
  'Europe/Stockholm':{lat:59.332,lon:18.065},
  'Europe/Tallinn':{lat:59.437,lon:24.745},
  'Europe/Vienna':{lat:48.209,lon:16.373},
  'Europe/Vilnius':{lat:54.687,lon:25.280},
  'Europe/Zurich':{lat:47.376,lon:8.541},
  'Pacific/Auckland':{lat:-36.867,lon:174.770},
  'Pacific/Fiji':{lat:-18.141,lon:178.441},
  'Pacific/Honolulu':{lat:21.307,lon:-157.858},
  'Pacific/Port_Moresby':{lat:-9.479,lon:147.150},
  'America/Anchorage':{lat:61.218,lon:-149.900},
  'America/Bogota':{lat:4.711,lon:-74.073},
  'America/Caracas':{lat:10.480,lon:-66.879},
  'America/Guayaquil':{lat:-2.170,lon:-79.922},
  'America/Halifax':{lat:44.649,lon:-63.600},
  'America/Havana':{lat:23.136,lon:-82.359},
  'America/Jamaica':{lat:17.998,lon:-76.794},
  'America/La_Paz':{lat:-16.500,lon:-68.150},
  'America/Managua':{lat:12.132,lon:-86.278},
  'America/Montevideo':{lat:-34.901,lon:-56.164},
  'America/Nassau':{lat:25.048,lon:-77.355},
  'America/Panama':{lat:8.994,lon:-79.519},
  'America/Phoenix':{lat:33.448,lon:-112.074},
  'America/Puerto_Rico':{lat:18.467,lon:-66.108},
  'America/Santiago':{lat:-33.457,lon:-70.648},
  'America/Santo_Domingo':{lat:18.475,lon:-69.912},
  'America/St_Johns':{lat:47.561,lon:-52.713},
  'America/Tegucigalpa':{lat:14.093,lon:-87.207},
  'America/Winnipeg':{lat:49.899,lon:-97.139}
};

function getCoords(city) {
  // If we have a custom lat/lon (from geolocation), use it
  if (city._lat != null) return {lat: city._lat, lon: city._lon};
  // Use precise coords table
  if (COORDS[city.tz]) return COORDS[city.tz];
  // Fallback by continent
  if (city.tz.startsWith('Asia/'))     return {lat:25,lon:85};
  if (city.tz.startsWith('Europe/'))   return {lat:50,lon:15};
  if (city.tz.startsWith('America/'))  return {lat:40,lon:-80};
  if (city.tz.startsWith('Africa/'))   return {lat:5,lon:20};
  if (city.tz.startsWith('Australia/'))return {lat:-25,lon:135};
  return {lat:40.714,lon:-74.006};
}

var unitSym = function(){ return WXP.unit==='celsius'?'°C':'°F'; };

function setUnit(u) {
  WXP.unit = u;
  localStorage.setItem('wx_unit', u);
  document.querySelectorAll('.unit-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.u===u); });
  WXP.cache = {};
  renderAllWx();
}

function fetchWx(city, cb) {
  var c = getCoords(city);
  var key = c.lat+','+c.lon+'_'+WXP.unit;
  if (WXP.cache[key]) { cb(null, WXP.cache[key]); return; }
  var url = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=' + c.lat + '&longitude=' + c.lon
    + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index,visibility'
    + '&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max'
    + '&temperature_unit=' + WXP.unit
    + '&windspeed_unit=kmh&precipitation_unit=mm&timezone=auto&forecast_days=14';

  fetch(url)
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(d) {
      if (!d.current) throw new Error('No current data in response');
      WXP.cache[key] = d;
      cb(null, d);
    })
    .catch(function(e) { cb(e, null); });
}

function buildCard(city, i, data) {
  var cw = data.current, h = data.hourly, daily = data.daily;
  var code = cw.weather_code || 0;
  var icon = WX_ICONS[code] || '🌡';
  var desc = WX_DESC[code] || 'Unknown';
  var U = unitSym();

  // Find current hour index in hourly array
  var baseH = 0;
  if (h && h.time) {
    var nowISO = new Date().toISOString().slice(0,13); // "2024-06-15T12"
    var idx = h.time.findIndex(function(t){ return t.slice(0,13) === nowISO; });
    if (idx >= 0) baseH = idx;
  }

  var hum  = cw.relative_humidity_2m != null ? cw.relative_humidity_2m + '%' : 'N/A';
  var wind = cw.wind_speed_10m != null ? cw.wind_speed_10m + ' km/h' : 'N/A';
  var feels= cw.apparent_temperature != null ? Math.round(cw.apparent_temperature) + U : 'N/A';
  var uv   = cw.uv_index != null ? cw.uv_index : 'N/A';
  var vis  = cw.visibility != null ? (cw.visibility/1000).toFixed(1) + ' km' : 'N/A';
  var rain = cw.precipitation != null ? cw.precipitation + ' mm' : 'N/A';

  // Wind direction arrow
  var windDir = '';
  if (cw.wind_direction_10m != null) {
    var dirs = ['N','NE','E','SE','S','SW','W','NW'];
    windDir = ' ' + dirs[Math.round(cw.wind_direction_10m/45)%8];
  }

  // Hourly — next 12 hours
  var hourlyHtml = '';
  if (h && h.time) {
    hourlyHtml = h.time.slice(baseH, baseH+12).map(function(t, k) {
      var idx = baseH + k;
      var hr = parseInt(t.slice(11,13));
      var lbl = WC.is24h ? String(hr).padStart(2,'0')+':00' : (hr%12||12)+(hr<12?'AM':'PM');
      return '<div class="hourly-item">'
        + '<div class="hourly-time">' + lbl + '</div>'
        + '<div class="hourly-icon">' + (WX_ICONS[h.weather_code[idx]]||'🌡') + '</div>'
        + '<div class="hourly-temp">' + Math.round(h.temperature_2m[idx]) + U + '</div>'
        + '<div style="font-size:9px;color:var(--clr-text3)">' + (h.precipitation_probability?h.precipitation_probability[idx]+'%':'') + '</div>'
        + '</div>';
    }).join('');
  }

  // Daily 14-day
  var dailyHtml = '';
  if (daily && daily.time) {
    var allMax = daily.temperature_2m_max, allMin = daily.temperature_2m_min;
    var gMin = Math.min.apply(null,allMin), gMax = Math.max.apply(null,allMax);
    dailyHtml = daily.time.map(function(t, k) {
      var dt = new Date(t + 'T12:00');
      var dayStr = k===0 ? 'Today' : k===1 ? 'Tomorrow' : dt.toLocaleDateString('en-US',{weekday:'short'});
      var hi = Math.round(allMax[k]), lo = Math.round(allMin[k]);
      var bp = gMax>gMin ? Math.round((hi-gMin)/(gMax-gMin)*100) : 50;
      return '<div class="daily-row">'
        + '<span class="daily-day">' + dayStr + '</span>'
        + '<span class="daily-icon">' + (WX_ICONS[daily.weather_code[k]]||'🌡') + '</span>'
        + '<span class="daily-desc">' + (WX_DESC[daily.weather_code[k]]||'') + '</span>'
        + '<div class="daily-bar"><div class="daily-bar-fill" style="width:'+bp+'%"></div></div>'
        + '<span class="daily-temps">' + hi + U + ' <span class="daily-low">' + lo + U + '</span></span>'
        + '</div>';
    }).join('');
  }

  return '<div class="wx-city-card" id="wx-card-'+i+'">'
    + '<div class="wx-card-hdr">' + flag(city.cc,22)
    + '<div><div class="city-name">' + city.name + '</div><div class="country-name">' + city.country + '</div></div>'
    + '<button class="wx-rm" onclick="removeWxCity('+i+')" title="Remove">&#10005;</button></div>'
    // Current
    + '<div class="wx-current-block">'
    + '<div class="wx-main-icon">' + icon + '</div>'
    + '<div class="wx-main-info">'
    + '<div class="wx-main-temp">' + Math.round(cw.temperature_2m) + U + '</div>'
    + '<div class="wx-main-desc">' + desc + '</div>'
    + '<div class="wx-main-meta">Feels like ' + feels + ' · ' + wind + windDir + '</div>'
    + '</div>'
    + '<div class="wx-stats">'
    + '<div class="wx-stat"><div class="wx-stat-val">' + hum + '</div><div class="wx-stat-lbl">Humidity</div></div>'
    + '<div class="wx-stat"><div class="wx-stat-val">' + wind + '</div><div class="wx-stat-lbl">Wind</div></div>'
    + '<div class="wx-stat"><div class="wx-stat-val">' + rain + '</div><div class="wx-stat-lbl">Rain</div></div>'
    + '<div class="wx-stat"><div class="wx-stat-val">' + uv + '</div><div class="wx-stat-lbl">UV Index</div></div>'
    + '<div class="wx-stat"><div class="wx-stat-val">' + vis + '</div><div class="wx-stat-lbl">Visibility</div></div>'
    + '</div></div>'
    // Hourly
    + (hourlyHtml ? '<div class="wx-hourly"><h4>Next 12 Hours</h4><div class="hourly-scroll">' + hourlyHtml + '</div></div>' : '')
    // Daily
    + (dailyHtml ? '<div class="wx-daily"><h4>14-Day Forecast</h4>' + dailyHtml + '</div>' : '')
    + '</div>';
}

function loadCard(city, i) {
  // Set loading state
  var el = document.getElementById('wx-card-' + i);
  if (el) el.innerHTML = '<div class="wx-loading-block">Loading weather for ' + city.name + '…</div>';

  fetchWx(city, function(err, data) {
    var target = document.getElementById('wx-card-' + i);
    if (!target) return;
    if (err || !data) {
      target.innerHTML = '<div class="wx-error">'
        + 'Weather unavailable for ' + city.name + '.'
        + '<br><small style="color:var(--clr-text3)">' + (err ? err.message : 'No data') + '</small>'
        + '<br><button onclick="WXP.cache={};renderAllWx()" style="margin-top:8px;padding:6px 14px;border:1px solid var(--clr-brand);border-radius:20px;background:none;color:var(--clr-brand);cursor:pointer;font-size:12px">↻ Retry</button>'
        + '</div>';
      return;
    }
    // Build the card HTML and inject INTO the existing container (preserves id)
    target.innerHTML = buildCard(city, i, data);
    // buildCard wraps in a div with the same id — so swap outer
    var wrapper = document.createElement('div');
    wrapper.innerHTML = buildCard(city, i, data);
    var newCard = wrapper.firstElementChild;
    if (newCard) target.replaceWith(newCard);
  });
}

function renderAllWx() {
  var el = document.getElementById('wx-list');
  if (!el) return;
  if (!WXP.cities.length) {
    el.innerHTML = '<div class="sm-empty"><i class="ti ti-cloud"></i><p>Search above to add cities and compare weather.</p></div>';
    return;
  }
  // Render placeholder cards first
  el.innerHTML = WXP.cities.map(function(c, i) {
    return '<div class="wx-city-card" id="wx-card-' + i + '">'
      + '<div class="wx-loading-block">Loading weather for ' + c.name + '…</div></div>';
  }).join('');
  // Fetch each one
  WXP.cities.forEach(function(c, i) { loadCard(c, i); });
}

function addWxCity(city) {
  if (WXP.cities.some(function(c){ return c.tz===city.tz && c.name===city.name; })) {
    toast(city.name + ' already added'); return;
  }
  WXP.cities.push(city);
  document.getElementById('wx-srch').value = '';
  document.getElementById('wx-dd').hidden = true;
  renderAllWx();
  toast(flag(city.cc,14) + ' ' + city.name + ' added');
}

function removeWxCity(i) {
  WXP.cities.splice(i, 1);
  WXP.cache = {};
  renderAllWx();
}

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
          tz: tz,
          _lat: lat, _lon: lon  // store precise coords
        };
        // Update COORDS so other pages benefit
        COORDS[tz] = {lat: lat, lon: lon};
        addWxCity(city);
      })
      .catch(function() {
        var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        COORDS[tz] = {lat: lat, lon: lon};
        addWxCity({name:'My Location', country:'', cc:'un', tz:tz, _lat:lat, _lon:lon});
      });
  }, function() { toast('Location access denied'); });
}

// Callbacks
function onPinsChanged() { renderStrip(); }
function onFmtChange()   { renderStrip(); }

// Boot
boot();
loadPins();
renderStrip();

// Deduplicate pinned cities for weather
var _seen = {};
WXP.cities = WC.pinned.filter(function(c) {
  var k = c.tz + '_' + c.name;
  if (_seen[k]) return false;
  _seen[k] = true;
  return true;
}).slice(0, 6);

// Set unit buttons
document.querySelectorAll('.unit-btn').forEach(function(b) {
  b.classList.toggle('active', b.dataset.u === WXP.unit);
});

renderAllWx();

initSearch('wx-srch', 'wx-dd', function(city) {
  addWxCity(city);
}, {showPinned: false});
