// weather.js — Open-Meteo (free, no key), accurate per lat/lon
var WXP = { cities:[], unit:localStorage.getItem('wx_unit')||'celsius', cache:{} };

var WX_ICONS={0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',65:'🌧',71:'🌨',73:'❄️',75:'❄️',77:'❄️',80:'🌦',81:'🌧',82:'⛈',85:'🌨',86:'❄️',95:'⛈',96:'⛈',99:'⛈'};
var WX_DESC={0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Slight rain',63:'Moderate rain',65:'Heavy rain',71:'Slight snow',73:'Moderate snow',75:'Heavy snow',77:'Snow grains',80:'Slight showers',81:'Showers',82:'Violent showers',85:'Slight snow shower',86:'Heavy snow shower',95:'Thunderstorm',96:'Thunderstorm + hail',99:'Thunderstorm + heavy hail'};

// ── Coordinate lookup ─────────────────────────────────────────────────────
// PRIMARY: city name → exact coords. This is the critical table —
// the old code used timezone as the key which caused cities sharing a
// timezone (e.g. Mumbai + Delhi both on Asia/Kolkata) to get identical
// weather. City-name lookup is always checked first.
var CITY_COORDS = {
  // India (all Asia/Kolkata — must be by name)
  'Mumbai':{lat:19.076,lon:72.877},'Delhi':{lat:28.611,lon:77.209},
  'New Delhi':{lat:28.611,lon:77.209},'Kolkata':{lat:22.572,lon:88.363},
  'Calcutta':{lat:22.572,lon:88.363},'Chennai':{lat:13.083,lon:80.270},
  'Madras':{lat:13.083,lon:80.270},'Bangalore':{lat:12.972,lon:77.594},
  'Bengaluru':{lat:12.972,lon:77.594},'Hyderabad':{lat:17.388,lon:78.474},
  'Ahmedabad':{lat:23.023,lon:72.572},'Pune':{lat:18.520,lon:73.857},
  'Jaipur':{lat:26.912,lon:75.787},'Surat':{lat:21.195,lon:72.820},
  'Lucknow':{lat:26.847,lon:80.947},'Kanpur':{lat:26.460,lon:80.330},
  'Nagpur':{lat:21.146,lon:79.089},'Indore':{lat:22.719,lon:75.857},
  'Bhopal':{lat:23.259,lon:77.413},'Patna':{lat:25.594,lon:85.138},
  'Agra':{lat:27.177,lon:78.008},'Varanasi':{lat:25.320,lon:82.974},
  // USA (multiple timezones)
  'New York':{lat:40.714,lon:-74.006},'Los Angeles':{lat:34.052,lon:-118.244},
  'Chicago':{lat:41.850,lon:-87.650},'Houston':{lat:29.760,lon:-95.369},
  'Phoenix':{lat:33.448,lon:-112.074},'Philadelphia':{lat:39.953,lon:-75.165},
  'San Antonio':{lat:29.425,lon:-98.494},'San Diego':{lat:32.715,lon:-117.157},
  'Dallas':{lat:32.783,lon:-96.797},'San Jose':{lat:37.339,lon:-121.894},
  'Austin':{lat:30.267,lon:-97.743},'Jacksonville':{lat:30.332,lon:-81.656},
  'Fort Worth':{lat:32.725,lon:-97.321},'Columbus':{lat:39.961,lon:-82.999},
  'Charlotte':{lat:35.227,lon:-80.843},'Seattle':{lat:47.606,lon:-122.332},
  'Denver':{lat:39.739,lon:-104.984},'Boston':{lat:42.360,lon:-71.059},
  'Detroit':{lat:42.331,lon:-83.046},'Nashville':{lat:36.165,lon:-86.784},
  'Portland':{lat:45.523,lon:-122.676},'Las Vegas':{lat:36.175,lon:-115.137},
  'Memphis':{lat:35.149,lon:-90.048},'Louisville':{lat:38.253,lon:-85.759},
  'Baltimore':{lat:39.290,lon:-76.612},'Milwaukee':{lat:43.039,lon:-87.907},
  'Albuquerque':{lat:35.085,lon:-106.651},'Tucson':{lat:32.222,lon:-110.925},
  'Atlanta':{lat:33.749,lon:-84.388},'Miami':{lat:25.775,lon:-80.208},
  'Minneapolis':{lat:44.980,lon:-93.270},'Cleveland':{lat:41.500,lon:-81.695},
  'Honolulu':{lat:21.307,lon:-157.858},'Anchorage':{lat:61.218,lon:-149.900},
  // China (all Asia/Shanghai)
  'Shanghai':{lat:31.230,lon:121.473},'Beijing':{lat:39.906,lon:116.391},
  'Shenzhen':{lat:22.543,lon:114.058},'Guangzhou':{lat:23.130,lon:113.260},
  'Tianjin':{lat:39.143,lon:117.177},'Wuhan':{lat:30.593,lon:114.305},
  'Chengdu':{lat:30.659,lon:104.065},'Chongqing':{lat:29.563,lon:106.551},
  'Nanjing':{lat:32.060,lon:118.797},'Xian':{lat:34.341,lon:108.940},
  "Xi'an":{lat:34.341,lon:108.940},'Hangzhou':{lat:30.274,lon:120.155},
  'Harbin':{lat:45.803,lon:126.536},'Shenyang':{lat:41.805,lon:123.432},
  'Kunming':{lat:25.047,lon:102.682},'Qingdao':{lat:36.066,lon:120.383},
  // UK
  'London':{lat:51.507,lon:-0.128},'Birmingham':{lat:52.486,lon:-1.890},
  'Manchester':{lat:53.481,lon:-2.244},'Glasgow':{lat:55.860,lon:-4.251},
  'Leeds':{lat:53.800,lon:-1.549},'Edinburgh':{lat:55.953,lon:-3.189},
  'Liverpool':{lat:53.408,lon:-2.991},'Bristol':{lat:51.455,lon:-2.595},
  // Australia (multiple timezones)
  'Sydney':{lat:-33.869,lon:151.209},'Melbourne':{lat:-37.814,lon:144.963},
  'Brisbane':{lat:-27.468,lon:153.028},'Perth':{lat:-31.952,lon:115.861},
  'Adelaide':{lat:-34.929,lon:138.601},'Canberra':{lat:-35.282,lon:149.129},
  'Darwin':{lat:-12.462,lon:130.841},'Hobart':{lat:-42.880,lon:147.324},
  // Canada (multiple timezones)
  'Toronto':{lat:43.651,lon:-79.383},'Montreal':{lat:45.509,lon:-73.554},
  'Vancouver':{lat:49.246,lon:-123.116},'Calgary':{lat:51.045,lon:-114.058},
  'Edmonton':{lat:53.546,lon:-113.491},'Ottawa':{lat:45.422,lon:-75.697},
  'Winnipeg':{lat:49.899,lon:-97.139},'Quebec City':{lat:46.813,lon:-71.208},
  'Halifax':{lat:44.649,lon:-63.600},
  // Russia (11 timezones)
  'Moscow':{lat:55.752,lon:37.616},'Saint Petersburg':{lat:59.939,lon:30.316},
  'St. Petersburg':{lat:59.939,lon:30.316},'Novosibirsk':{lat:54.990,lon:82.905},
  'Yekaterinburg':{lat:56.838,lon:60.597},'Kazan':{lat:55.796,lon:49.106},
  'Vladivostok':{lat:43.115,lon:131.885},'Omsk':{lat:54.990,lon:73.368},
  'Samara':{lat:53.196,lon:50.151},'Rostov-on-Don':{lat:47.222,lon:39.720},
  // Brazil (multiple timezones)
  'São Paulo':{lat:-23.550,lon:-46.633},'Sao Paulo':{lat:-23.550,lon:-46.633},
  'Rio de Janeiro':{lat:-22.908,lon:-43.173},'Brasília':{lat:-15.780,lon:-47.930},
  'Brasilia':{lat:-15.780,lon:-47.930},'Salvador':{lat:-12.971,lon:-38.511},
  'Fortaleza':{lat:-3.717,lon:-38.543},'Manaus':{lat:-3.102,lon:-60.025},
  'Curitiba':{lat:-25.430,lon:-49.271},'Recife':{lat:-8.054,lon:-34.881},
  'Porto Alegre':{lat:-30.033,lon:-51.230},'Belém':{lat:-1.456,lon:-48.503},
  // Europe
  'Paris':{lat:48.857,lon:2.352},'Berlin':{lat:52.520,lon:13.405},
  'Madrid':{lat:40.416,lon:-3.703},'Rome':{lat:41.902,lon:12.496},
  'Amsterdam':{lat:52.374,lon:4.890},'Brussels':{lat:50.850,lon:4.352},
  'Vienna':{lat:48.209,lon:16.373},'Stockholm':{lat:59.332,lon:18.065},
  'Warsaw':{lat:52.229,lon:21.012},'Prague':{lat:50.088,lon:14.421},
  'Budapest':{lat:47.498,lon:19.040},'Bucharest':{lat:44.432,lon:26.104},
  'Athens':{lat:37.984,lon:23.728},'Lisbon':{lat:38.717,lon:-9.143},
  'Helsinki':{lat:60.169,lon:24.935},'Oslo':{lat:59.913,lon:10.752},
  'Copenhagen':{lat:55.676,lon:12.568},'Zurich':{lat:47.376,lon:8.541},
  'Dublin':{lat:53.330,lon:-6.249},'Kyiv':{lat:50.450,lon:30.524},
  'Kiev':{lat:50.450,lon:30.524},'Minsk':{lat:53.906,lon:27.555},
  'Sofia':{lat:42.698,lon:23.322},'Vilnius':{lat:54.687,lon:25.280},
  'Riga':{lat:56.946,lon:24.106},'Tallinn':{lat:59.437,lon:24.745},
  'Ljubljana':{lat:46.056,lon:14.505},'Zagreb':{lat:45.815,lon:15.982},
  'Sarajevo':{lat:43.852,lon:18.383},'Belgrade':{lat:44.787,lon:20.457},
  'Skopje':{lat:41.997,lon:21.428},'Tirana':{lat:41.328,lon:19.819},
  'Reykjavik':{lat:64.135,lon:-21.895},'Geneva':{lat:46.198,lon:6.142},
  'Barcelona':{lat:41.389,lon:2.159},'Milan':{lat:45.464,lon:9.190},
  'Naples':{lat:40.851,lon:14.268},'Lyon':{lat:45.764,lon:4.836},
  'Marseille':{lat:43.297,lon:5.381},'Hamburg':{lat:53.551,lon:9.994},
  'Munich':{lat:48.137,lon:11.576},'Frankfurt':{lat:50.111,lon:8.682},
  'Cologne':{lat:50.938,lon:6.960},
  // Middle East & Central Asia
  'Dubai':{lat:25.204,lon:55.270},'Abu Dhabi':{lat:24.466,lon:54.367},
  'Riyadh':{lat:24.686,lon:46.724},'Jeddah':{lat:21.543,lon:39.173},
  'Kuwait City':{lat:29.375,lon:47.977},'Doha':{lat:25.286,lon:51.533},
  'Muscat':{lat:23.614,lon:58.593},'Manama':{lat:26.225,lon:50.585},
  'Amman':{lat:31.957,lon:35.945},'Beirut':{lat:33.889,lon:35.501},
  'Baghdad':{lat:33.341,lon:44.401},'Tehran':{lat:35.694,lon:51.421},
  'Kabul':{lat:34.529,lon:69.176},'Tashkent':{lat:41.299,lon:69.240},
  'Almaty':{lat:43.250,lon:76.943},'Tbilisi':{lat:41.694,lon:44.834},
  'Yerevan':{lat:40.181,lon:44.514},'Baku':{lat:40.409,lon:49.867},
  'Nicosia':{lat:35.166,lon:33.361},'Ankara':{lat:39.920,lon:32.854},
  'Istanbul':{lat:41.013,lon:28.948},'Izmir':{lat:38.414,lon:27.137},
  // South & Southeast Asia
  'Dhaka':{lat:23.724,lon:90.409},'Karachi':{lat:24.861,lon:67.010},
  'Lahore':{lat:31.558,lon:74.357},'Islamabad':{lat:33.729,lon:73.094},
  'Colombo':{lat:6.927,lon:79.861},'Kathmandu':{lat:27.717,lon:85.314},
  'Bangkok':{lat:13.754,lon:100.502},'Singapore':{lat:1.352,lon:103.820},
  'Kuala Lumpur':{lat:3.149,lon:101.698},'Jakarta':{lat:-6.211,lon:106.845},
  'Manila':{lat:14.597,lon:120.984},'Ho Chi Minh City':{lat:10.823,lon:106.629},
  'Hanoi':{lat:21.028,lon:105.854},'Phnom Penh':{lat:11.562,lon:104.916},
  'Yangon':{lat:16.855,lon:96.139},'Rangoon':{lat:16.855,lon:96.139},
  'Vientiane':{lat:17.967,lon:102.600},'Naypyidaw':{lat:19.745,lon:96.115},
  'Seoul':{lat:37.566,lon:126.978},'Busan':{lat:35.180,lon:129.076},
  'Tokyo':{lat:35.689,lon:139.692},'Osaka':{lat:34.694,lon:135.502},
  'Kyoto':{lat:35.021,lon:135.756},'Sapporo':{lat:43.062,lon:141.354},
  'Taipei':{lat:25.048,lon:121.514},'Hong Kong':{lat:22.320,lon:114.185},
  'Macau':{lat:22.199,lon:113.547},'Ulaanbaatar':{lat:47.921,lon:106.918},
  // Africa
  'Cairo':{lat:30.060,lon:31.229},'Alexandria':{lat:31.200,lon:29.919},
  'Lagos':{lat:6.455,lon:3.384},'Kinshasa':{lat:-4.322,lon:15.322},
  'Luanda':{lat:-8.836,lon:13.234},'Nairobi':{lat:-1.286,lon:36.820},
  'Addis Ababa':{lat:9.025,lon:38.747},'Dar es Salaam':{lat:-6.792,lon:39.208},
  'Johannesburg':{lat:-26.204,lon:28.046},'Cape Town':{lat:-33.924,lon:18.424},
  'Durban':{lat:-29.858,lon:31.029},'Casablanca':{lat:33.589,lon:-7.603},
  'Algiers':{lat:36.737,lon:3.086},'Khartoum':{lat:15.552,lon:32.532},
  'Accra':{lat:5.603,lon:-0.187},'Abidjan':{lat:5.354,lon:-4.001},
  'Dakar':{lat:14.693,lon:-17.447},'Kampala':{lat:0.316,lon:32.582},
  'Lusaka':{lat:-15.417,lon:28.283},'Harare':{lat:-17.829,lon:31.052},
  'Maputo':{lat:-25.966,lon:32.593},'Tunis':{lat:36.818,lon:10.165},
  // Americas
  'Mexico City':{lat:19.433,lon:-99.133},'Guadalajara':{lat:20.667,lon:-103.350},
  'Monterrey':{lat:25.667,lon:-100.317},'Buenos Aires':{lat:-34.603,lon:-58.381},
  'Lima':{lat:-12.046,lon:-77.043},'Bogota':{lat:4.711,lon:-74.073},
  'Bogotá':{lat:4.711,lon:-74.073},'Santiago':{lat:-33.457,lon:-70.648},
  'Caracas':{lat:10.480,lon:-66.879},'Quito':{lat:-0.229,lon:-78.524},
  'La Paz':{lat:-16.500,lon:-68.150},'Asuncion':{lat:-25.286,lon:-57.647},
  'Montevideo':{lat:-34.901,lon:-56.164},'Panama City':{lat:8.994,lon:-79.519},
  'San Jose':{lat:9.934,lon:-84.088},'Guatemala City':{lat:14.641,lon:-90.513},
  'Havana':{lat:23.136,lon:-82.359},'Santo Domingo':{lat:18.475,lon:-69.912},
  'San Juan':{lat:18.467,lon:-66.108},'Nassau':{lat:25.048,lon:-77.355},
  'Kingston':{lat:17.998,lon:-76.794},'Tegucigalpa':{lat:14.093,lon:-87.207},
  'Managua':{lat:12.132,lon:-86.278},
  // Pacific
  'Auckland':{lat:-36.867,lon:174.770},'Wellington':{lat:-41.286,lon:174.776},
  'Suva':{lat:-18.141,lon:178.441},'Port Moresby':{lat:-9.479,lon:147.150},
  'Honolulu':{lat:21.307,lon:-157.858},
};

// FALLBACK: timezone → representative city (only used when city name not found above)
var TZ_COORDS={
  'Europe/London':{lat:51.507,lon:-0.128},'America/New_York':{lat:40.714,lon:-74.006},
  'Asia/Tokyo':{lat:35.689,lon:139.692},'Asia/Dubai':{lat:25.204,lon:55.270},
  'Asia/Singapore':{lat:1.352,lon:103.820},'America/Los_Angeles':{lat:34.052,lon:-118.244},
  'Europe/Paris':{lat:48.857,lon:2.352},'Europe/Berlin':{lat:52.520,lon:13.405},
  'Europe/Moscow':{lat:55.752,lon:37.616},'Asia/Shanghai':{lat:31.230,lon:121.473},
  'Asia/Seoul':{lat:37.566,lon:126.978},'Australia/Sydney':{lat:-33.869,lon:151.209},
  'America/Sao_Paulo':{lat:-23.550,lon:-46.633},'America/Chicago':{lat:41.850,lon:-87.650},
  'America/Denver':{lat:39.739,lon:-104.984},'Africa/Nairobi':{lat:-1.286,lon:36.820},
  'Africa/Cairo':{lat:30.060,lon:31.229},'Asia/Bangkok':{lat:13.754,lon:100.502},
  'Asia/Karachi':{lat:24.861,lon:67.010},'America/Toronto':{lat:43.651,lon:-79.383},
  'America/Vancouver':{lat:49.246,lon:-123.116},'Pacific/Auckland':{lat:-36.867,lon:174.770},
  'Europe/Istanbul':{lat:41.013,lon:28.948},'Asia/Riyadh':{lat:24.686,lon:46.724},
  'Asia/Dhaka':{lat:23.724,lon:90.409},'Africa/Lagos':{lat:6.455,lon:3.384},
  'America/Mexico_City':{lat:19.433,lon:-99.133},
  'America/Argentina/Buenos_Aires':{lat:-34.603,lon:-58.381},
  'America/Lima':{lat:-12.046,lon:-77.043},'Europe/Warsaw':{lat:52.229,lon:21.012},
  'Europe/Rome':{lat:41.902,lon:12.496},'Europe/Madrid':{lat:40.416,lon:-3.703},
  'Europe/Amsterdam':{lat:52.374,lon:4.890},'Africa/Johannesburg':{lat:-26.204,lon:28.046},
  'Asia/Kolkata':{lat:19.076,lon:72.877},'Asia/Hong_Kong':{lat:22.320,lon:114.185},
  'Asia/Jakarta':{lat:-6.211,lon:106.845},'Asia/Manila':{lat:14.597,lon:120.984},
  'Asia/Taipei':{lat:25.048,lon:121.514},'Asia/Kuala_Lumpur':{lat:3.149,lon:101.698},
  'Asia/Colombo':{lat:6.927,lon:79.861},'Asia/Kathmandu':{lat:27.717,lon:85.314},
  'Asia/Kabul':{lat:34.529,lon:69.176},'Asia/Tashkent':{lat:41.299,lon:69.240},
  'Asia/Tehran':{lat:35.694,lon:51.421},'Asia/Baghdad':{lat:33.341,lon:44.401},
  'Asia/Beirut':{lat:33.889,lon:35.501},'Asia/Kuwait':{lat:29.375,lon:47.977},
  'Asia/Muscat':{lat:23.614,lon:58.593},'Asia/Almaty':{lat:43.250,lon:76.943},
  'Asia/Tbilisi':{lat:41.694,lon:44.834},'Asia/Yerevan':{lat:40.181,lon:44.514},
  'Asia/Ulaanbaatar':{lat:47.921,lon:106.918},'Asia/Vladivostok':{lat:43.115,lon:131.885},
  'Asia/Yangon':{lat:16.855,lon:96.139},'Asia/Yekaterinburg':{lat:56.838,lon:60.597},
  'Atlantic/Reykjavik':{lat:64.135,lon:-21.895},'Australia/Adelaide':{lat:-34.929,lon:138.601},
  'Australia/Brisbane':{lat:-27.468,lon:153.028},'Australia/Melbourne':{lat:-37.814,lon:144.963},
  'Australia/Perth':{lat:-31.952,lon:115.861},'Europe/Athens':{lat:37.984,lon:23.728},
  'Europe/Belgrade':{lat:44.787,lon:20.457},'Europe/Bucharest':{lat:44.432,lon:26.104},
  'Europe/Budapest':{lat:47.498,lon:19.040},'Europe/Copenhagen':{lat:55.676,lon:12.568},
  'Europe/Dublin':{lat:53.330,lon:-6.249},'Europe/Helsinki':{lat:60.169,lon:24.935},
  'Europe/Kyiv':{lat:50.450,lon:30.524},'Europe/Lisbon':{lat:38.717,lon:-9.143},
  'Europe/Oslo':{lat:59.913,lon:10.752},'Europe/Prague':{lat:50.088,lon:14.421},
  'Europe/Sofia':{lat:42.698,lon:23.322},'Europe/Stockholm':{lat:59.332,lon:18.065},
  'Europe/Vienna':{lat:48.209,lon:16.373},'Europe/Zurich':{lat:47.376,lon:8.541},
  'Pacific/Honolulu':{lat:21.307,lon:-157.858},'Pacific/Port_Moresby':{lat:-9.479,lon:147.150},
  'America/Anchorage':{lat:61.218,lon:-149.900},'America/Bogota':{lat:4.711,lon:-74.073},
  'America/Caracas':{lat:10.480,lon:-66.879},'America/Halifax':{lat:44.649,lon:-63.600},
  'America/Havana':{lat:23.136,lon:-82.359},'America/La_Paz':{lat:-16.500,lon:-68.150},
  'America/Montevideo':{lat:-34.901,lon:-56.164},'America/Panama':{lat:8.994,lon:-79.519},
  'America/Phoenix':{lat:33.448,lon:-112.074},'America/Santiago':{lat:-33.457,lon:-70.648},
  'America/Winnipeg':{lat:49.899,lon:-97.139},'Africa/Casablanca':{lat:33.589,lon:-7.603},
  'Africa/Accra':{lat:5.603,lon:-0.187},'Africa/Khartoum':{lat:15.552,lon:32.532},
  'Africa/Kinshasa':{lat:-4.322,lon:15.322}
};

function getCoords(city) {
  // 1. Precise coords from geolocation (highest priority)
  if (city._lat != null) return {lat: city._lat, lon: city._lon};
  // 2. City name lookup — handles cities sharing the same timezone correctly
  var nameKey = city.name;
  if (CITY_COORDS[nameKey]) return CITY_COORDS[nameKey];
  // Try trimming parenthetical suffixes e.g. "Delhi (NCT)" → "Delhi"
  var trimmed = nameKey.replace(/\s*[\(\[].*/, '').trim();
  if (CITY_COORDS[trimmed]) return CITY_COORDS[trimmed];
  // 3. Timezone fallback — only for cities not found by name
  if (TZ_COORDS[city.tz]) return TZ_COORDS[city.tz];
  // 4. Continental rough fallback
  if (city.tz.startsWith('Asia/'))      return {lat:25,  lon:85};
  if (city.tz.startsWith('Europe/'))    return {lat:50,  lon:15};
  if (city.tz.startsWith('America/'))   return {lat:40,  lon:-80};
  if (city.tz.startsWith('Africa/'))    return {lat:5,   lon:20};
  if (city.tz.startsWith('Australia/')) return {lat:-25, lon:135};
  return {lat:40.714, lon:-74.006};
}

var unitSym = function(){ return WXP.unit==='celsius'?'°C':'°F'; };

function setUnit(u) {
  WXP.unit = u;
  localStorage.setItem('wx_unit', u);
  document.querySelectorAll('.unit-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.u===u);
  });
  WXP.cache = {};
  renderAllWx();
}

function fetchWx(city, cb) {
  var c = getCoords(city);
  var key = c.lat+','+c.lon+'_'+WXP.unit;
  if (WXP.cache[key]) { cb(null, WXP.cache[key]); return; }
  var url = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude='  + c.lat + '&longitude=' + c.lon
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
      if (!d.current) throw new Error('No current data');
      WXP.cache[key] = d;
      cb(null, d);
    })
    .catch(function(e) { cb(e, null); });
}

function buildCard(city, i, data) {
  var cw = data.current, h = data.hourly, daily = data.daily;
  var code = cw.weather_code || 0;
  var icon = WX_ICONS[code] || '🌡';
  var desc = WX_DESC[code]  || 'Unknown';
  var U    = unitSym();

  // ── BUG FIX: Open-Meteo returns hourly times in the city's LOCAL timezone
  // (because we pass timezone=auto). The old code used toISOString() which is
  // always UTC, so cities with a UTC offset always started at the wrong hour.
  // Fix: compare against the city's local time string, which uses the same
  // wall-clock format as the API response ("YYYY-MM-DDTHH").
  var baseH = 0;
  if (h && h.time) {
    var localNow = new Date().toLocaleString('sv', { timeZone: city.tz });
    // 'sv' locale gives "YYYY-MM-DD HH:MM:SS" — slice to "YYYY-MM-DDTHH"
    var nowLocal = localNow.slice(0, 10) + 'T' + localNow.slice(11, 13);
    var idx = h.time.findIndex(function(t){ return t.slice(0,13) === nowLocal; });
    if (idx >= 0) baseH = idx;
  }

  var hum   = cw.relative_humidity_2m   != null ? cw.relative_humidity_2m + '%' : 'N/A';
  var wind  = cw.wind_speed_10m         != null ? cw.wind_speed_10m + ' km/h'   : 'N/A';
  var feels = cw.apparent_temperature   != null ? Math.round(cw.apparent_temperature) + U : 'N/A';
  var uv    = cw.uv_index               != null ? cw.uv_index                    : 'N/A';
  var vis   = cw.visibility             != null ? (cw.visibility/1000).toFixed(1) + ' km' : 'N/A';
  var rain  = cw.precipitation          != null ? cw.precipitation + ' mm'       : 'N/A';

  var windDir = '';
  if (cw.wind_direction_10m != null) {
    var dirs = ['N','NE','E','SE','S','SW','W','NW'];
    windDir = ' ' + dirs[Math.round(cw.wind_direction_10m / 45) % 8];
  }

  // Hourly — next 12 hours from current local hour
  var hourlyHtml = '';
  if (h && h.time) {
    hourlyHtml = h.time.slice(baseH, baseH+12).map(function(t, k) {
      var idx = baseH + k;
      var hr  = parseInt(t.slice(11,13));
      var lbl = (typeof WC !== 'undefined' && WC.is24h)
        ? String(hr).padStart(2,'0') + ':00'
        : (hr%12||12) + (hr<12?'AM':'PM');
      return '<div class="hourly-item">'
        + '<div class="hourly-time">' + lbl + '</div>'
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
    var gMin = Math.min.apply(null, allMin), gMax = Math.max.apply(null, allMax);
    dailyHtml = daily.time.map(function(t, k) {
      var dt   = new Date(t + 'T12:00');
      var day  = k===0 ? 'Today' : k===1 ? 'Tomorrow' : dt.toLocaleDateString('en-US',{weekday:'short'});
      var hi   = Math.round(allMax[k]), lo = Math.round(allMin[k]);
      var pct  = daily.precipitation_probability_max ? daily.precipitation_probability_max[k] : 0;
      var bp   = gMax > gMin ? Math.round((hi-gMin)/(gMax-gMin)*100) : 50;
      return '<div class="daily-row">'
        + '<span class="daily-day">'  + day + '</span>'
        + '<span class="daily-icon">' + (WX_ICONS[daily.weather_code[k]]||'🌡') + '</span>'
        + '<span class="daily-desc">' + (WX_DESC[daily.weather_code[k]]||'') + '</span>'
        + '<div class="daily-bar"><div class="daily-bar-fill" style="width:'+bp+'%"></div></div>'
        + '<span class="daily-temps">' + hi + U + ' <span class="daily-low">' + lo + U + '</span></span>'
        + '</div>';
    }).join('');
  }

  // ── Card HTML ────────────────────────────────────────────────────────────
  return '<div class="wx-city-card" id="wx-card-'+i+'">'
    // Header: flag + city + remove btn
    + '<div class="wx-card-hdr">'
    +   '<div class="wx-card-hdr-left">' + flag(city.cc, 22)
    +     '<div><div class="wx-city-name">'    + city.name    + '</div>'
    +          '<div class="wx-country-name">' + city.country + '</div></div>'
    +   '</div>'
    +   '<button class="wx-rm" onclick="removeWxCity('+i+')" title="Remove">✕</button>'
    + '</div>'
    // Current weather
    + '<div class="wx-current">'
    +   '<div class="wx-current-left">'
    +     '<div class="wx-main-icon">' + icon + '</div>'
    +     '<div>'
    +       '<div class="wx-main-temp">' + Math.round(cw.temperature_2m) + U + '</div>'
    +       '<div class="wx-main-desc">' + desc + '</div>'
    +       '<div class="wx-feels">Feels like ' + feels + ' · ' + wind + windDir + '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div class="wx-stats-grid">'
    +     wxStat('💧', hum,  'Humidity')
    +     wxStat('💨', wind, 'Wind')
    +     wxStat('🌧', rain, 'Rain')
    +     wxStat('☀️', uv,   'UV Index')
    +     wxStat('👁', vis,  'Visibility')
    +   '</div>'
    + '</div>'
    // Hourly strip
    + (hourlyHtml
        ? '<div class="wx-section"><div class="wx-section-label">Next 12 Hours</div>'
        +   '<div class="hourly-scroll">' + hourlyHtml + '</div></div>'
        : '')
    // Daily forecast
    + (dailyHtml
        ? '<div class="wx-section"><div class="wx-section-label">14-Day Forecast</div>'
        +   dailyHtml + '</div>'
        : '')
    + '</div>';
}

function wxStat(ico, val, lbl) {
  return '<div class="wx-stat">'
    + '<div class="wx-stat-ico">' + ico + '</div>'
    + '<div class="wx-stat-val">' + val + '</div>'
    + '<div class="wx-stat-lbl">' + lbl + '</div>'
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
        + '<button onclick="WXP.cache={};renderAllWx()">↻ Retry</button>'
        + '</div>';
      return;
    }
    // Build and replace — single call, no duplicate
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
    el.innerHTML = '<div class="wx-empty">'
      + '<i class="ti ti-cloud" style="font-size:40px;opacity:.25"></i>'
      + '<p>Search above to add cities and compare weather.</p>'
      + '</div>';
    return;
  }
  // Render skeleton placeholders first
  el.innerHTML = WXP.cities.map(function(c, i) {
    return '<div class="wx-city-card wx-skeleton" id="wx-card-' + i + '">'
      + '<div class="wx-skeleton-inner">'
      + '<div class="wx-skeleton-flag"></div>'
      + '<div><div class="wx-skeleton-title">' + c.name + '</div>'
      + '<div class="wx-skeleton-sub">Loading weather…</div></div>'
      + '</div></div>';
  }).join('');
  // Fetch each city independently
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
          tz: tz, _lat: lat, _lon: lon
        };
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

function onPinsChanged() { renderStrip(); }
function onFmtChange()   { renderStrip(); }

// Boot
boot();
loadPins();
renderStrip();

// Load pinned cities into weather (deduplicated, max 6)
var _seen = {};
WXP.cities = WC.pinned.filter(function(c) {
  var k = c.tz + '_' + c.name;
  if (_seen[k]) return false;
  _seen[k] = true;
  return true;
}).slice(0, 6);

// Sync unit buttons
document.querySelectorAll('.unit-btn').forEach(function(b) {
  b.classList.toggle('active', b.dataset.u === WXP.unit);
});

renderAllWx();

initSearch('wx-srch', 'wx-dd', function(city) {
  addWxCity(city);
}, {showPinned: false});
