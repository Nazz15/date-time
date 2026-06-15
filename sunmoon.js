// sunmoon.js — Sun & Moon page
// Uses: suncalc (CDN, no API key), precise lat/lon per city name + timezone

// ── Precise coordinates: keyed by "CityName|timezone" then fallback by timezone ──
var CITY_COORDS = {
  // India — multiple cities share Asia/Kolkata so key by name|tz
  'Mumbai|Asia/Kolkata':      {lat:19.076,lon:72.877},
  'Delhi|Asia/Kolkata':       {lat:28.613,lon:77.209},
  'New Delhi|Asia/Kolkata':   {lat:28.613,lon:77.209},
  'Bengaluru|Asia/Kolkata':   {lat:12.972,lon:77.594},
  'Chennai|Asia/Kolkata':     {lat:13.083,lon:80.270},
  'Kolkata|Asia/Kolkata':     {lat:22.573,lon:88.364},
  'Hyderabad|Asia/Kolkata':   {lat:17.388,lon:78.474},
  'Pune|Asia/Kolkata':        {lat:18.521,lon:73.856},
  'Ahmedabad|Asia/Kolkata':   {lat:23.023,lon:72.572},
  // Japan — multiple cities share Asia/Tokyo
  'Tokyo|Asia/Tokyo':         {lat:35.689,lon:139.692},
  'Osaka|Asia/Tokyo':         {lat:34.694,lon:135.502},
  // China — multiple cities share Asia/Shanghai
  'Shanghai|Asia/Shanghai':   {lat:31.230,lon:121.473},
  'Beijing|Asia/Shanghai':    {lat:39.929,lon:116.388},
  'Shenzhen|Asia/Shanghai':   {lat:22.543,lon:114.058},
  // USA — many share timezones
  'New York|America/New_York':     {lat:40.714,lon:-74.006},
  'Miami|America/New_York':        {lat:25.762,lon:-80.191},
  'Boston|America/New_York':       {lat:42.358,lon:-71.060},
  'Atlanta|America/New_York':      {lat:33.749,lon:-84.388},
  'Philadelphia|America/New_York': {lat:39.952,lon:-75.164},
  'Washington DC|America/New_York':{lat:38.907,lon:-77.037},
  'Chicago|America/Chicago':       {lat:41.850,lon:-87.650},
  'Houston|America/Chicago':       {lat:29.760,lon:-95.369},
  'Dallas|America/Chicago':        {lat:32.783,lon:-96.797},
  'Minneapolis|America/Chicago':   {lat:44.979,lon:-93.265},
  'Austin|America/Chicago':        {lat:30.267,lon:-97.743},
  'Los Angeles|America/Los_Angeles':{lat:34.052,lon:-118.244},
  'San Francisco|America/Los_Angeles':{lat:37.774,lon:-122.419},
  'Seattle|America/Los_Angeles':   {lat:47.606,lon:-122.332},
  'Las Vegas|America/Los_Angeles': {lat:36.175,lon:-115.137},
  'Denver|America/Denver':         {lat:39.739,lon:-104.984},
  'Salt Lake City|America/Denver': {lat:40.760,lon:-111.891},
  'Phoenix|America/Phoenix':       {lat:33.448,lon:-112.074},
  'Honolulu|Pacific/Honolulu':     {lat:21.307,lon:-157.858},
  'Anchorage|America/Anchorage':   {lat:61.218,lon:-149.900},
  // Canada
  'Toronto|America/Toronto':       {lat:43.651,lon:-79.383},
  'Montreal|America/Toronto':      {lat:45.509,lon:-73.588},
  'Ottawa|America/Toronto':        {lat:45.421,lon:-75.690},
  'Vancouver|America/Vancouver':   {lat:49.246,lon:-123.116},
  'Calgary|America/Edmonton':      {lat:51.045,lon:-114.058},
  'Halifax|America/Halifax':       {lat:44.649,lon:-63.600},
  // Europe
  'London|Europe/London':          {lat:51.507,lon:-0.128},
  'Edinburgh|Europe/London':       {lat:55.953,lon:-3.189},
  'Paris|Europe/Paris':            {lat:48.857,lon:2.352},
  'Berlin|Europe/Berlin':          {lat:52.520,lon:13.405},
  'Frankfurt|Europe/Berlin':       {lat:50.111,lon:8.682},
  'Munich|Europe/Berlin':          {lat:48.135,lon:11.582},
  'Madrid|Europe/Madrid':          {lat:40.416,lon:-3.703},
  'Barcelona|Europe/Madrid':       {lat:41.387,lon:2.170},
  'Rome|Europe/Rome':              {lat:41.902,lon:12.496},
  'Milan|Europe/Rome':             {lat:45.464,lon:9.190},
  'Amsterdam|Europe/Amsterdam':    {lat:52.374,lon:4.890},
  'Brussels|Europe/Brussels':      {lat:50.846,lon:4.352},
  'Vienna|Europe/Vienna':          {lat:48.209,lon:16.373},
  'Zurich|Europe/Zurich':          {lat:47.376,lon:8.541},
  'Geneva|Europe/Zurich':          {lat:46.204,lon:6.143},
  'Stockholm|Europe/Stockholm':    {lat:59.332,lon:18.065},
  'Oslo|Europe/Oslo':              {lat:59.913,lon:10.752},
  'Copenhagen|Europe/Copenhagen':  {lat:55.676,lon:12.568},
  'Helsinki|Europe/Helsinki':      {lat:60.169,lon:24.935},
  'Prague|Europe/Prague':          {lat:50.088,lon:14.421},
  'Warsaw|Europe/Warsaw':          {lat:52.229,lon:21.012},
  'Budapest|Europe/Budapest':      {lat:47.498,lon:19.040},
  'Bucharest|Europe/Bucharest':    {lat:44.432,lon:26.104},
  'Athens|Europe/Athens':          {lat:37.984,lon:23.728},
  'Lisbon|Europe/Lisbon':          {lat:38.717,lon:-9.143},
  'Dublin|Europe/Dublin':          {lat:53.330,lon:-6.249},
  'Moscow|Europe/Moscow':          {lat:55.752,lon:37.616},
  'Kyiv|Europe/Kyiv':              {lat:50.450,lon:30.524},
  'Minsk|Europe/Minsk':            {lat:53.906,lon:27.555},
  'Belgrade|Europe/Belgrade':      {lat:44.787,lon:20.457},
  'Sofia|Europe/Sofia':            {lat:42.698,lon:23.322},
  'Zagreb|Europe/Zagreb':          {lat:45.815,lon:15.982},
  'Tallinn|Europe/Tallinn':        {lat:59.437,lon:24.745},
  'Riga|Europe/Riga':              {lat:56.946,lon:24.106},
  'Vilnius|Europe/Vilnius':        {lat:54.687,lon:25.280},
  'Reykjavik|Atlantic/Reykjavik':  {lat:64.135,lon:-21.895},
  // Middle East / Asia
  'Dubai|Asia/Dubai':              {lat:25.204,lon:55.270},
  'Abu Dhabi|Asia/Dubai':          {lat:24.466,lon:54.367},
  'Singapore|Asia/Singapore':      {lat:1.352,lon:103.820},
  'Bangkok|Asia/Bangkok':          {lat:13.754,lon:100.502},
  'Jakarta|Asia/Jakarta':          {lat:-6.211,lon:106.845},
  'Manila|Asia/Manila':            {lat:14.597,lon:120.984},
  'Taipei|Asia/Taipei':            {lat:25.048,lon:121.514},
  'Seoul|Asia/Seoul':              {lat:37.566,lon:126.978},
  'Hong Kong|Asia/Hong_Kong':      {lat:22.320,lon:114.185},
  'Kuala Lumpur|Asia/Kuala_Lumpur':{lat:3.149,lon:101.698},
  'Karachi|Asia/Karachi':          {lat:24.861,lon:67.010},
  'Lahore|Asia/Karachi':           {lat:31.558,lon:74.357},
  'Islamabad|Asia/Karachi':        {lat:33.729,lon:73.094},
  'Dhaka|Asia/Dhaka':              {lat:23.724,lon:90.409},
  'Colombo|Asia/Colombo':          {lat:6.927,lon:79.861},
  'Kathmandu|Asia/Kathmandu':      {lat:27.717,lon:85.314},
  'Riyadh|Asia/Riyadh':            {lat:24.686,lon:46.724},
  'Tehran|Asia/Tehran':            {lat:35.694,lon:51.421},
  'Baghdad|Asia/Baghdad':          {lat:33.341,lon:44.401},
  'Istanbul|Europe/Istanbul':      {lat:41.013,lon:28.948},
  'Ankara|Europe/Istanbul':        {lat:39.921,lon:32.854},
  'Jerusalem|Asia/Jerusalem':      {lat:31.779,lon:35.224},
  'Tel Aviv|Asia/Jerusalem':       {lat:32.085,lon:34.781},
  'Amman|Asia/Amman':              {lat:31.957,lon:35.945},
  'Beirut|Asia/Beirut':            {lat:33.889,lon:35.501},
  'Doha|Asia/Qatar':               {lat:25.286,lon:51.533},
  'Kuwait City|Asia/Kuwait':       {lat:29.375,lon:47.977},
  'Muscat|Asia/Muscat':            {lat:23.614,lon:58.593},
  'Kabul|Asia/Kabul':              {lat:34.529,lon:69.176},
  'Tashkent|Asia/Tashkent':        {lat:41.299,lon:69.240},
  'Tbilisi|Asia/Tbilisi':          {lat:41.694,lon:44.834},
  'Yerevan|Asia/Yerevan':          {lat:40.181,lon:44.514},
  'Baku|Asia/Baku':                {lat:40.409,lon:49.867},
  'Almaty|Asia/Almaty':            {lat:43.250,lon:76.943},
  'Ulaanbaatar|Asia/Ulaanbaatar':  {lat:47.921,lon:106.918},
  'Yangon|Asia/Rangoon':           {lat:16.855,lon:96.139},
  'Phnom Penh|Asia/Phnom_Penh':    {lat:11.562,lon:104.916},
  'Vientiane|Asia/Vientiane':      {lat:17.966,lon:102.600},
  'Vladivostok|Asia/Vladivostok':  {lat:43.115,lon:131.885},
  'Novosibirsk|Asia/Novosibirsk':  {lat:54.989,lon:82.905},
  'Yekaterinburg|Asia/Yekaterinburg':{lat:56.838,lon:60.597},
  // Africa
  'Cairo|Africa/Cairo':            {lat:30.060,lon:31.229},
  'Lagos|Africa/Lagos':            {lat:6.455,lon:3.384},
  'Nairobi|Africa/Nairobi':        {lat:-1.286,lon:36.820},
  'Johannesburg|Africa/Johannesburg':{lat:-26.204,lon:28.046},
  'Cape Town|Africa/Johannesburg': {lat:-33.926,lon:18.424},
  'Casablanca|Africa/Casablanca':  {lat:33.589,lon:-7.603},
  'Algiers|Africa/Algiers':        {lat:36.737,lon:3.086},
  'Accra|Africa/Accra':            {lat:5.603,lon:-0.187},
  'Addis Ababa|Africa/Addis_Ababa':{lat:9.020,lon:38.747},
  'Dar es Salaam|Africa/Dar_es_Salaam':{lat:-6.792,lon:39.208},
  'Khartoum|Africa/Khartoum':     {lat:15.552,lon:32.532},
  'Kinshasa|Africa/Kinshasa':      {lat:-4.322,lon:15.322},
  'Luanda|Africa/Luanda':          {lat:-8.836,lon:13.234},
  'Dakar|Africa/Dakar':            {lat:14.693,lon:-17.447},
  'Tunis|Africa/Tunis':            {lat:36.818,lon:10.166},
  'Tripoli|Africa/Tripoli':        {lat:32.902,lon:13.180},
  'Harare|Africa/Harare':          {lat:-17.830,lon:31.052},
  // Oceania
  'Sydney|Australia/Sydney':       {lat:-33.869,lon:151.209},
  'Canberra|Australia/Sydney':     {lat:-35.282,lon:149.129},
  'Melbourne|Australia/Melbourne': {lat:-37.814,lon:144.963},
  'Brisbane|Australia/Brisbane':   {lat:-27.468,lon:153.028},
  'Perth|Australia/Perth':         {lat:-31.952,lon:115.861},
  'Adelaide|Australia/Adelaide':   {lat:-34.929,lon:138.601},
  'Darwin|Australia/Darwin':       {lat:-12.462,lon:130.842},
  'Auckland|Pacific/Auckland':     {lat:-36.867,lon:174.770},
  'Wellington|Pacific/Auckland':   {lat:-41.286,lon:174.776},
  // Latin America
  'São Paulo|America/Sao_Paulo':   {lat:-23.550,lon:-46.633},
  'Rio de Janeiro|America/Sao_Paulo':{lat:-22.907,lon:-43.173},
  'Buenos Aires|America/Argentina/Buenos_Aires':{lat:-34.603,lon:-58.381},
  'Santiago|America/Santiago':     {lat:-33.457,lon:-70.648},
  'Lima|America/Lima':             {lat:-12.046,lon:-77.043},
  'Bogota|America/Bogota':         {lat:4.711,lon:-74.073},
  'Mexico City|America/Mexico_City':{lat:19.433,lon:-99.133},
  'Caracas|America/Caracas':       {lat:10.480,lon:-66.879},
  'Havana|America/Havana':         {lat:23.136,lon:-82.359},
  'Panama City|America/Panama':    {lat:8.994,lon:-79.519},
  'Asuncion|America/Asuncion':     {lat:-25.286,lon:-57.647},
  'Montevideo|America/Montevideo': {lat:-34.901,lon:-56.164},
  'La Paz|America/La_Paz':         {lat:-16.500,lon:-68.150}
};

// Fallback by timezone (for cities not in name table)
var TZ_COORDS = {
  'Asia/Kolkata':{lat:20.5,lon:78.9},'Europe/London':{lat:51.5,lon:-0.1},
  'America/New_York':{lat:40.7,lon:-74.0},'Asia/Tokyo':{lat:35.7,lon:139.7},
  'Asia/Dubai':{lat:25.2,lon:55.3},'Asia/Singapore':{lat:1.35,lon:103.8},
  'America/Los_Angeles':{lat:34.1,lon:-118.2},'Europe/Paris':{lat:48.9,lon:2.3},
  'Europe/Berlin':{lat:52.5,lon:13.4},'Europe/Moscow':{lat:55.8,lon:37.6},
  'Asia/Shanghai':{lat:31.2,lon:121.5},'Asia/Seoul':{lat:37.6,lon:127.0},
  'Australia/Sydney':{lat:-33.9,lon:151.2},'America/Sao_Paulo':{lat:-23.5,lon:-46.6},
  'America/Chicago':{lat:41.9,lon:-87.6},'America/Denver':{lat:39.7,lon:-105.0},
  'Africa/Nairobi':{lat:-1.3,lon:36.8},'Africa/Cairo':{lat:30.1,lon:31.2},
  'Asia/Bangkok':{lat:13.8,lon:100.5},'Asia/Karachi':{lat:24.9,lon:67.0},
  'America/Toronto':{lat:43.7,lon:-79.4},'America/Vancouver':{lat:49.2,lon:-123.1},
  'Pacific/Auckland':{lat:-36.9,lon:174.8},'Europe/Istanbul':{lat:41.0,lon:28.9},
  'Asia/Riyadh':{lat:24.7,lon:46.7},'Asia/Dhaka':{lat:23.7,lon:90.4},
  'Africa/Lagos':{lat:6.5,lon:3.4},'America/Mexico_City':{lat:19.4,lon:-99.1},
  'Africa/Johannesburg':{lat:-26.2,lon:28.0},'Africa/Algiers':{lat:36.7,lon:3.1},
  'Africa/Casablanca':{lat:33.6,lon:-7.6},'Europe/Warsaw':{lat:52.2,lon:21.0},
  'Europe/Rome':{lat:41.9,lon:12.5},'Europe/Madrid':{lat:40.4,lon:-3.7},
  'Europe/Amsterdam':{lat:52.4,lon:4.9},'Europe/Stockholm':{lat:59.3,lon:18.1},
  'Atlantic/Reykjavik':{lat:64.1,lon:-21.9},'America/Santiago':{lat:-33.5,lon:-70.6},
  'America/Bogota':{lat:4.7,lon:-74.1},'America/Lima':{lat:-12.0,lon:-77.0},
  'America/Argentina/Buenos_Aires':{lat:-34.6,lon:-58.4}
};

function getCoords(city) {
  // 1. Custom lat/lon from geolocation
  if (city._lat != null) return {lat: city._lat, lon: city._lon};
  // 2. Precise lookup by "CityName|timezone" — handles cities sharing a timezone
  var nameKey = city.name + '|' + city.tz;
  if (CITY_COORDS[nameKey]) return CITY_COORDS[nameKey];
  // 3. Fallback by timezone
  if (TZ_COORDS[city.tz]) return TZ_COORDS[city.tz];
  // 4. Continental fallback
  var tz = city.tz;
  if (tz.startsWith('Asia/'))      return {lat:25, lon:80};
  if (tz.startsWith('Europe/'))    return {lat:50, lon:15};
  if (tz.startsWith('America/'))   return {lat:40, lon:-80};
  if (tz.startsWith('Africa/'))    return {lat:5,  lon:20};
  if (tz.startsWith('Australia/')) return {lat:-25,lon:135};
  if (tz.startsWith('Pacific/'))   return {lat:-15,lon:170};
  return {lat:40.7, lon:-74.0};
}

var SM = {cities: []};

function fmtT(date, tz) {
  if (!date || isNaN(date.getTime())) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour:'2-digit', minute:'2-digit', hour12:!WC.is24h
    }).format(date);
  } catch(e) { return 'N/A'; }
}

function minsBetween(a, b) { return Math.round((b - a) / 60000); }
function minsToHM(m) {
  m = Math.abs(m);
  return Math.floor(m/60) + 'h ' + (m%60) + 'm';
}

function pct(val, min, max) {
  if (max <= min) return 0;
  return Math.max(0, Math.min(100, (val-min)/(max-min)*100));
}

// Sun arc SVG — quadratic bezier from sunrise to sunset with current position
function sunArcSVG(sr, ss, now) {
  var W = 600, H = 80, pad = 48;
  var inner = W - pad*2;
  var toFrac = function(d) {
    return (d&&!isNaN(d.getTime())) ? (d.getHours()*60+d.getMinutes())/1440 : 0;
  };
  var srF = toFrac(sr), ssF = toFrac(ss), nowF = toFrac(now);
  var x = function(f) { return pad + f * inner; };
  var rX = x(srF), sX = x(ssF), nX = x(nowF), midX = (rX+sX)/2;
  var arcH = 58;

  // Current sun position along bezier
  var inArc = nowF >= srF && nowF <= ssF && srF < ssF;
  var t = inArc ? (nowF-srF)/(ssF-srF) : 0;
  var nBX = (1-t)*(1-t)*rX + 2*(1-t)*t*midX + t*t*sX;
  var nBY = (1-t)*(1-t)*H  + 2*(1-t)*t*(H-arcH) + t*t*H;

  return '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" style="width:100%;height:80px">'
    + '<line x1="'+pad+'" y1="'+H+'" x2="'+(W-pad)+'" y2="'+H+'" stroke="var(--clr-border2)" stroke-width="1.5"/>'
    + '<path d="M'+rX+','+H+' Q'+midX+','+(H-arcH)+' '+sX+','+H+'" fill="none" stroke="#fed7aa" stroke-width="2.5" stroke-dasharray="5 3" opacity=".5"/>'
    + (inArc ? '<path d="M'+rX+','+H+' Q'+midX+','+(H-arcH)+' '+nBX.toFixed(1)+','+nBY.toFixed(1)+'" fill="none" stroke="#f59e0b" stroke-width="3"/>' : '')
    + '<circle cx="'+rX+'" cy="'+H+'" r="5" fill="#f59e0b" opacity=".7"/>'
    + '<circle cx="'+sX+'" cy="'+H+'" r="5" fill="#f59e0b" opacity=".7"/>'
    + (inArc ? '<circle cx="'+nBX.toFixed(1)+'" cy="'+nBY.toFixed(1)+'" r="8" fill="#fbbf24" stroke="#fff" stroke-width="2"/>' : '')
    + '</svg>';
}

function moonArcSVG(mr, ms, now) {
  var W = 600, H = 70, pad = 48;
  var inner = W - pad*2;
  var toFrac = function(d) {
    return (d&&!isNaN(d.getTime())) ? (d.getHours()*60+d.getMinutes())/1440 : 0;
  };
  var mrF = toFrac(mr), msF = toFrac(ms), nowF = toFrac(now);
  if (!mr || !ms || isNaN(mr.getTime()) || isNaN(ms.getTime())) {
    return '<div style="color:var(--clr-text3);font-size:12px;padding:20px 0;text-align:center">Moon data unavailable tonight</div>';
  }
  var x = function(f) { return pad + f * inner; };
  var rX = x(mrF), sX = x(msF), midX = (rX+sX)/2, arcH = 48;
  var inArc = nowF >= mrF && nowF <= msF;
  var t = inArc ? (nowF-mrF)/(msF-mrF) : 0;
  var nBX = (1-t)*(1-t)*rX + 2*(1-t)*t*midX + t*t*sX;
  var nBY = (1-t)*(1-t)*H  + 2*(1-t)*t*(H-arcH) + t*t*H;
  return '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" style="width:100%;height:70px">'
    + '<line x1="'+pad+'" y1="'+H+'" x2="'+(W-pad)+'" y2="'+H+'" stroke="var(--clr-border2)" stroke-width="1.5"/>'
    + '<path d="M'+rX+','+H+' Q'+midX+','+(H-arcH)+' '+sX+','+H+'" fill="none" stroke="#c4b5fd" stroke-width="2.5" stroke-dasharray="5 3" opacity=".5"/>'
    + (inArc ? '<path d="M'+rX+','+H+' Q'+midX+','+(H-arcH)+' '+nBX.toFixed(1)+','+nBY.toFixed(1)+'" fill="none" stroke="#818cf8" stroke-width="3"/>' : '')
    + '<circle cx="'+rX+'" cy="'+H+'" r="5" fill="#818cf8" opacity=".7"/>'
    + '<circle cx="'+sX+'" cy="'+H+'" r="5" fill="#818cf8" opacity=".7"/>'
    + (inArc ? '<circle cx="'+nBX.toFixed(1)+'" cy="'+nBY.toFixed(1)+'" r="7" fill="#a78bfa" stroke="#fff" stroke-width="2"/>' : '')
    + '</svg>';
}

function moonPhase(p) {
  var icons = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
  var names = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
  var i = Math.floor(p*8) % 8;
  return {icon:icons[i], name:names[i]};
}

function nextMoonEvent(phase) {
  var now = new Date();
  for (var d = 1; d <= 45; d++) {
    var t = new Date(now.getTime() + d*86400000);
    var p = SunCalc.getMoonIllumination(t).phase;
    if (p < 0.03 || p > 0.97) return {type:'New Moon', date:t, icon:'🌑'};
    if (Math.abs(p-0.5) < 0.02) return {type:'Full Moon', date:t, icon:'🌕'};
  }
  return null;
}

function renderCard(city, i) {
  if (typeof SunCalc === 'undefined') return '<div class="sm-empty">Loading suncalc…</div>';

  var now = new Date();
  var c = getCoords(city);
  var times = SunCalc.getTimes(now, c.lat, c.lon);
  var moon = SunCalc.getMoonIllumination(now);
  var moonTimes = SunCalc.getMoonTimes(now, c.lat, c.lon);
  var sr = times.sunrise, ss = times.sunset, sn = times.solarNoon;
  var dayLen = (sr&&ss&&!isNaN(sr)&&!isNaN(ss)) ? minsBetween(sr, ss) : null;
  var remaining = (ss&&!isNaN(ss)&&now<ss) ? minsBetween(now, ss) : null;
  var ph = moonPhase(moon.phase);
  var nxt = nextMoonEvent(moon.phase);

  // Debug info (coords used)
  var coordStr = c.lat.toFixed(3)+', '+c.lon.toFixed(3);

  return '<div class="sm-city-card">'
    + '<div class="sm-card-hdr">'
    + flag(city.cc, 22)
    + '<div><div class="city-name">'+city.name+'</div>'
    + '<div class="country-name">'+city.country+' <span style="font-size:10px;color:var(--clr-text3)">· '+coordStr+'</span></div></div>'
    + '<button class="sm-rm" onclick="removeSmCity('+i+')" title="Remove">&#10005;</button>'
    + '</div>'
    // Sun
    + '<div class="sun-section">'
    + '<h3><span style="font-size:16px">☀️</span> Sun Journey</h3>'
    + '<div class="sun-arc-wrap">' + sunArcSVG(sr, ss, now) + '</div>'
    + '<div class="tl-labels"><span>'+fmtT(sr,city.tz)+'<br>Sunrise</span><span style="text-align:center">'+fmtT(sn,city.tz)+'<br>Solar noon</span><span style="text-align:right">'+fmtT(ss,city.tz)+'<br>Sunset</span></div>'
    + '<div class="sun-facts">'
    + '<div class="fact"><div class="fact-icon">🌅</div><div class="fact-val">'+fmtT(sr,city.tz)+'</div><div class="fact-lbl">Sunrise</div></div>'
    + '<div class="fact"><div class="fact-icon">🌇</div><div class="fact-val">'+fmtT(ss,city.tz)+'</div><div class="fact-lbl">Sunset</div></div>'
    + '<div class="fact"><div class="fact-icon">☀️</div><div class="fact-val">'+fmtT(sn,city.tz)+'</div><div class="fact-lbl">Solar Noon</div></div>'
    + '<div class="fact"><div class="fact-icon">🌄</div><div class="fact-val">'+fmtT(times.dawn,city.tz)+'</div><div class="fact-lbl">Dawn</div></div>'
    + '<div class="fact"><div class="fact-icon">🌆</div><div class="fact-val">'+fmtT(times.dusk,city.tz)+'</div><div class="fact-lbl">Dusk</div></div>'
    + '<div class="fact"><div class="fact-icon">⏱️</div><div class="fact-val">'+(dayLen?minsToHM(dayLen):'N/A')+'</div><div class="fact-lbl">Day Length</div></div>'
    + (remaining!=null ? '<div class="fact"><div class="fact-icon">🕐</div><div class="fact-val">'+minsToHM(remaining)+'</div><div class="fact-lbl">Until Sunset</div></div>' : '')
    + '</div></div>'
    + '<div class="sm-divider"></div>'
    // Moon
    + '<div class="moon-section">'
    + '<h3><span style="font-size:16px">🌙</span> Moon Journey</h3>'
    + '<div class="moon-arc-wrap">' + moonArcSVG(moonTimes.rise, moonTimes.set, now) + '</div>'
    + (moonTimes.rise&&moonTimes.set ? '<div class="tl-labels"><span>'+fmtT(moonTimes.rise,city.tz)+'<br>Moonrise</span><span style="text-align:right">'+fmtT(moonTimes.set,city.tz)+'<br>Moonset</span></div>' : '')
    + '<div class="moon-facts">'
    + '<div class="fact"><div class="fact-icon">'+ph.icon+'</div><div class="fact-val" style="font-size:12px">'+ph.name+'</div><div class="fact-lbl">Phase</div></div>'
    + '<div class="fact"><div class="fact-icon">💫</div><div class="fact-val">'+Math.round(moon.fraction*100)+'%</div><div class="fact-lbl">Illumination</div></div>'
    + '<div class="fact"><div class="fact-icon">🌑</div><div class="fact-val">'+fmtT(moonTimes.rise,city.tz)+'</div><div class="fact-lbl">Moonrise</div></div>'
    + '<div class="fact"><div class="fact-icon">🌒</div><div class="fact-val">'+fmtT(moonTimes.set,city.tz)+'</div><div class="fact-lbl">Moonset</div></div>'
    + (nxt ? '<div class="fact"><div class="fact-icon">'+nxt.icon+'</div><div class="fact-val" style="font-size:11px">'+nxt.date.toLocaleDateString('en-US',{month:'short',day:'numeric'})+'</div><div class="fact-lbl">Next '+nxt.type+'</div></div>' : '')
    + '</div></div></div>';
}

function renderAll() {
  var el = document.getElementById('sm-list');
  if (typeof SunCalc === 'undefined') {
    el.innerHTML = '<div class="sm-empty"><p>Loading suncalc library…</p></div>';
    setTimeout(renderAll, 300); return;
  }
  if (!SM.cities.length) {
    el.innerHTML = '<div class="sm-empty"><i class="ti ti-sun"></i><p>Search above to add cities.</p></div>';
    return;
  }
  el.innerHTML = SM.cities.map(renderCard).join('');
}

function addSmCity(city) {
  if (SM.cities.some(function(c){ return c.tz===city.tz && c.name===city.name; })) {
    toast(city.name+' already added'); return;
  }
  SM.cities.push(city);
  document.getElementById('sm-srch').value = '';
  document.getElementById('sm-dd').hidden = true;
  renderAll();
  toast(flag(city.cc,14)+' '+city.name+' added');
}

function removeSmCity(i) { SM.cities.splice(i,1); renderAll(); }

function autoLocateSM() {
  if (!navigator.geolocation) { toast('Geolocation not supported'); return; }
  navigator.geolocation.getCurrentPosition(function(pos) {
    var lat = pos.coords.latitude, lon = pos.coords.longitude;
    fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+lat+'&longitude='+lon+'&localityLanguage=en')
      .then(function(r){ return r.json(); })
      .then(function(d) {
        var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        CITY_COORDS[(d.city||'My Location')+'|'+tz] = {lat:lat, lon:lon};
        addSmCity({name:d.city||d.locality||'My Location', country:d.countryName||'', cc:(d.countryCode||'un').toLowerCase(), tz:tz, _lat:lat, _lon:lon});
      }).catch(function() {
        var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        addSmCity({name:'My Location', country:'', cc:'un', tz:tz, _lat:lat, _lon:lon});
      });
  }, function(){ toast('Location access denied'); });
}

// Callbacks
function onPinsChanged() { renderStrip(); }
function onFmtChange()   { renderStrip(); renderAll(); }

// Boot
boot(); loadPins(); renderStrip();

// Pre-load with pinned cities (deduplicated)
var _seen = {};
SM.cities = WC.pinned.filter(function(c) {
  var k = c.name+'|'+c.tz;
  if (_seen[k]) return false; _seen[k]=true; return true;
}).slice(0, 6);

renderAll();
setInterval(renderAll, 60000);

initSearch('sm-srch', 'sm-dd', function(city) {
  addSmCity(city);
  document.getElementById('sm-srch').value = '';
  document.getElementById('sm-dd').hidden = true;
}, {showPinned:false});
