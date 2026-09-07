// sunmoon.js — Sun & Moon page (Weather V1 redesign)
// Uses: SunCalc (CDN, no API key). Single primary location + date selector,
// popular-cities table, upcoming moon phases. All calculations reused/extended
// from the original page — no functionality removed.

// ── Precise coordinates: keyed by "CityName|timezone" then fallback by tz ──
var CITY_COORDS = {
  'Mumbai|Asia/Kolkata':{lat:19.076,lon:72.877},'Delhi|Asia/Kolkata':{lat:28.613,lon:77.209},
  'New Delhi|Asia/Kolkata':{lat:28.613,lon:77.209},'Bengaluru|Asia/Kolkata':{lat:12.972,lon:77.594},
  'Chennai|Asia/Kolkata':{lat:13.083,lon:80.270},'Kolkata|Asia/Kolkata':{lat:22.573,lon:88.364},
  'Hyderabad|Asia/Kolkata':{lat:17.388,lon:78.474},'Pune|Asia/Kolkata':{lat:18.521,lon:73.856},
  'Ahmedabad|Asia/Kolkata':{lat:23.023,lon:72.572},
  'Tokyo|Asia/Tokyo':{lat:35.689,lon:139.692},'Osaka|Asia/Tokyo':{lat:34.694,lon:135.502},
  'Shanghai|Asia/Shanghai':{lat:31.230,lon:121.473},'Beijing|Asia/Shanghai':{lat:39.929,lon:116.388},
  'Shenzhen|Asia/Shanghai':{lat:22.543,lon:114.058},
  'New York|America/New_York':{lat:40.714,lon:-74.006},'Miami|America/New_York':{lat:25.762,lon:-80.191},
  'Boston|America/New_York':{lat:42.358,lon:-71.060},'Atlanta|America/New_York':{lat:33.749,lon:-84.388},
  'Philadelphia|America/New_York':{lat:39.952,lon:-75.164},'Washington DC|America/New_York':{lat:38.907,lon:-77.037},
  'Chicago|America/Chicago':{lat:41.850,lon:-87.650},'Houston|America/Chicago':{lat:29.760,lon:-95.369},
  'Dallas|America/Chicago':{lat:32.783,lon:-96.797},'Minneapolis|America/Chicago':{lat:44.979,lon:-93.265},
  'Austin|America/Chicago':{lat:30.267,lon:-97.743},
  'Los Angeles|America/Los_Angeles':{lat:34.052,lon:-118.244},'San Francisco|America/Los_Angeles':{lat:37.774,lon:-122.419},
  'Seattle|America/Los_Angeles':{lat:47.606,lon:-122.332},'Las Vegas|America/Los_Angeles':{lat:36.175,lon:-115.137},
  'Denver|America/Denver':{lat:39.739,lon:-104.984},'Salt Lake City|America/Denver':{lat:40.760,lon:-111.891},
  'Phoenix|America/Phoenix':{lat:33.448,lon:-112.074},'Honolulu|Pacific/Honolulu':{lat:21.307,lon:-157.858},
  'Anchorage|America/Anchorage':{lat:61.218,lon:-149.900},
  'Toronto|America/Toronto':{lat:43.651,lon:-79.383},'Montreal|America/Toronto':{lat:45.509,lon:-73.588},
  'Ottawa|America/Toronto':{lat:45.421,lon:-75.690},'Vancouver|America/Vancouver':{lat:49.246,lon:-123.116},
  'Calgary|America/Edmonton':{lat:51.045,lon:-114.058},'Halifax|America/Halifax':{lat:44.649,lon:-63.600},
  'London|Europe/London':{lat:51.507,lon:-0.128},'Edinburgh|Europe/London':{lat:55.953,lon:-3.189},
  'Paris|Europe/Paris':{lat:48.857,lon:2.352},'Berlin|Europe/Berlin':{lat:52.520,lon:13.405},
  'Frankfurt|Europe/Berlin':{lat:50.111,lon:8.682},'Munich|Europe/Berlin':{lat:48.135,lon:11.582},
  'Madrid|Europe/Madrid':{lat:40.416,lon:-3.703},'Barcelona|Europe/Madrid':{lat:41.387,lon:2.170},
  'Rome|Europe/Rome':{lat:41.902,lon:12.496},'Milan|Europe/Rome':{lat:45.464,lon:9.190},
  'Amsterdam|Europe/Amsterdam':{lat:52.374,lon:4.890},'Brussels|Europe/Brussels':{lat:50.846,lon:4.352},
  'Vienna|Europe/Vienna':{lat:48.209,lon:16.373},'Zurich|Europe/Zurich':{lat:47.376,lon:8.541},
  'Geneva|Europe/Zurich':{lat:46.204,lon:6.143},'Stockholm|Europe/Stockholm':{lat:59.332,lon:18.065},
  'Oslo|Europe/Oslo':{lat:59.913,lon:10.752},'Copenhagen|Europe/Copenhagen':{lat:55.676,lon:12.568},
  'Helsinki|Europe/Helsinki':{lat:60.169,lon:24.935},'Prague|Europe/Prague':{lat:50.088,lon:14.421},
  'Warsaw|Europe/Warsaw':{lat:52.229,lon:21.012},'Budapest|Europe/Budapest':{lat:47.498,lon:19.040},
  'Bucharest|Europe/Bucharest':{lat:44.432,lon:26.104},'Athens|Europe/Athens':{lat:37.984,lon:23.728},
  'Lisbon|Europe/Lisbon':{lat:38.717,lon:-9.143},'Dublin|Europe/Dublin':{lat:53.330,lon:-6.249},
  'Moscow|Europe/Moscow':{lat:55.752,lon:37.616},'Kyiv|Europe/Kyiv':{lat:50.450,lon:30.524},
  'Istanbul|Europe/Istanbul':{lat:41.013,lon:28.948},'Reykjavik|Atlantic/Reykjavik':{lat:64.135,lon:-21.895},
  'Dubai|Asia/Dubai':{lat:25.204,lon:55.270},'Abu Dhabi|Asia/Dubai':{lat:24.466,lon:54.367},
  'Singapore|Asia/Singapore':{lat:1.352,lon:103.820},'Bangkok|Asia/Bangkok':{lat:13.754,lon:100.502},
  'Jakarta|Asia/Jakarta':{lat:-6.211,lon:106.845},'Manila|Asia/Manila':{lat:14.597,lon:120.984},
  'Taipei|Asia/Taipei':{lat:25.048,lon:121.514},'Seoul|Asia/Seoul':{lat:37.566,lon:126.978},
  'Hong Kong|Asia/Hong_Kong':{lat:22.320,lon:114.185},'Kuala Lumpur|Asia/Kuala_Lumpur':{lat:3.149,lon:101.698},
  'Karachi|Asia/Karachi':{lat:24.861,lon:67.010},'Lahore|Asia/Karachi':{lat:31.558,lon:74.357},
  'Dhaka|Asia/Dhaka':{lat:23.724,lon:90.409},'Colombo|Asia/Colombo':{lat:6.927,lon:79.861},
  'Kathmandu|Asia/Kathmandu':{lat:27.717,lon:85.314},'Riyadh|Asia/Riyadh':{lat:24.686,lon:46.724},
  'Tehran|Asia/Tehran':{lat:35.694,lon:51.421},'Jerusalem|Asia/Jerusalem':{lat:31.779,lon:35.224},
  'Doha|Asia/Qatar':{lat:25.286,lon:51.533},
  'Cairo|Africa/Cairo':{lat:30.060,lon:31.229},'Lagos|Africa/Lagos':{lat:6.455,lon:3.384},
  'Nairobi|Africa/Nairobi':{lat:-1.286,lon:36.820},'Johannesburg|Africa/Johannesburg':{lat:-26.204,lon:28.046},
  'Cape Town|Africa/Johannesburg':{lat:-33.926,lon:18.424},'Casablanca|Africa/Casablanca':{lat:33.589,lon:-7.603},
  'Accra|Africa/Accra':{lat:5.603,lon:-0.187},'Addis Ababa|Africa/Addis_Ababa':{lat:9.020,lon:38.747},
  'Sydney|Australia/Sydney':{lat:-33.869,lon:151.209},'Melbourne|Australia/Melbourne':{lat:-37.814,lon:144.963},
  'Brisbane|Australia/Brisbane':{lat:-27.468,lon:153.028},'Perth|Australia/Perth':{lat:-31.952,lon:115.861},
  'Auckland|Pacific/Auckland':{lat:-36.867,lon:174.770},
  'São Paulo|America/Sao_Paulo':{lat:-23.550,lon:-46.633},'Rio de Janeiro|America/Sao_Paulo':{lat:-22.907,lon:-43.173},
  'Buenos Aires|America/Argentina/Buenos_Aires':{lat:-34.603,lon:-58.381},'Santiago|America/Santiago':{lat:-33.457,lon:-70.648},
  'Lima|America/Lima':{lat:-12.046,lon:-77.043},'Bogota|America/Bogota':{lat:4.711,lon:-74.073},
  'Mexico City|America/Mexico_City':{lat:19.433,lon:-99.133}
};

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
  'Africa/Johannesburg':{lat:-26.2,lon:28.0}
};

function getCoords(city) {
  if (city._lat != null) return {lat: city._lat, lon: city._lon};
  var nameKey = city.name + '|' + city.tz;
  if (CITY_COORDS[nameKey]) return CITY_COORDS[nameKey];
  if (TZ_COORDS[city.tz]) return TZ_COORDS[city.tz];
  var tz = city.tz || '';
  if (tz.indexOf('Asia/') === 0)      return {lat:25, lon:80};
  if (tz.indexOf('Europe/') === 0)    return {lat:50, lon:15};
  if (tz.indexOf('America/') === 0)   return {lat:40, lon:-80};
  if (tz.indexOf('Africa/') === 0)    return {lat:5,  lon:20};
  if (tz.indexOf('Australia/') === 0) return {lat:-25,lon:135};
  if (tz.indexOf('Pacific/') === 0)   return {lat:-15,lon:170};
  return {lat:40.7, lon:-74.0};
}

// ── Time / duration helpers (reused) ──────────────────────────────────
function fmtT(date, tz) {
  if (!date || isNaN(date.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour:'2-digit', minute:'2-digit',
      hour12: (typeof WC !== 'undefined' ? !WC.is24h : true)
    }).format(date);
  } catch(e) { return '—'; }
}
function minsBetween(a, b) { return Math.round((b - a) / 60000); }
function minsToHM(m) { m = Math.abs(m); return Math.floor(m/60) + 'h ' + (m%60) + 'm'; }

// ── Arc visuals (reused; marker only when a "now" moment is supplied) ──
function sunArcSVG(sr, ss, now) {
  var W=600,H=90,pad=48,inner=W-pad*2;
  var toFrac=function(d){return (d&&!isNaN(d.getTime()))?(d.getHours()*60+d.getMinutes())/1440:-1;};
  var srF=toFrac(sr),ssF=toFrac(ss),nowF=toFrac(now);
  var x=function(f){return pad+f*inner;};
  var rX=x(srF<0?0.25:srF),sX=x(ssF<0?0.75:ssF),midX=(rX+sX)/2,arcH=60;
  var inArc=now&&nowF>=srF&&nowF<=ssF&&srF<ssF;
  var t=inArc?(nowF-srF)/(ssF-srF):0;
  var nBX=(1-t)*(1-t)*rX+2*(1-t)*t*midX+t*t*sX;
  var nBY=(1-t)*(1-t)*H+2*(1-t)*t*(H-arcH)+t*t*H;
  return '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" style="width:100%;height:90px">'
    +'<line x1="'+pad+'" y1="'+H+'" x2="'+(W-pad)+'" y2="'+H+'" stroke="var(--wx-border)" stroke-width="1.5"/>'
    +'<path d="M'+rX+','+H+' Q'+midX+','+(H-arcH)+' '+sX+','+H+'" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="5 4" opacity=".55"/>'
    +(inArc?'<path d="M'+rX+','+H+' Q'+midX+','+(H-arcH)+' '+nBX.toFixed(1)+','+nBY.toFixed(1)+'" fill="none" stroke="#f59e0b" stroke-width="3"/>':'')
    +'<circle cx="'+rX+'" cy="'+H+'" r="6" fill="#f59e0b"/>'
    +'<circle cx="'+sX+'" cy="'+H+'" r="6" fill="#f59e0b"/>'
    +(inArc?'<circle cx="'+nBX.toFixed(1)+'" cy="'+nBY.toFixed(1)+'" r="9" fill="#fbbf24" stroke="#fff" stroke-width="2.5"/>':'')
    +'</svg>';
}
function moonArcSVG(mr, ms, now) {
  var W=600,H=70,pad=48,inner=W-pad*2;
  if (!mr||!ms||isNaN(mr.getTime())||isNaN(ms.getTime()))
    return '<div class="sm-arc-na">Moon does not rise & set on this date here</div>';
  var toFrac=function(d){return (d.getHours()*60+d.getMinutes())/1440;};
  var mrF=toFrac(mr),msF=toFrac(ms),nowF=now?toFrac(now):-1;
  var x=function(f){return pad+f*inner;};
  var rX=x(mrF),sX=x(msF),midX=(rX+sX)/2,arcH=48;
  var inArc=now&&nowF>=Math.min(mrF,msF)&&nowF<=Math.max(mrF,msF);
  var lo=Math.min(mrF,msF),hi=Math.max(mrF,msF);
  var t=inArc?(nowF-lo)/(hi-lo):0;
  var aX=x(lo),bX=x(hi),mX=(aX+bX)/2;
  var nBX=(1-t)*(1-t)*aX+2*(1-t)*t*mX+t*t*bX;
  var nBY=(1-t)*(1-t)*H+2*(1-t)*t*(H-arcH)+t*t*H;
  return '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" style="width:100%;height:70px">'
    +'<line x1="'+pad+'" y1="'+H+'" x2="'+(W-pad)+'" y2="'+H+'" stroke="var(--wx-border)" stroke-width="1.5"/>'
    +'<path d="M'+aX+','+H+' Q'+mX+','+(H-arcH)+' '+bX+','+H+'" fill="none" stroke="#a5b4fc" stroke-width="2.5" stroke-dasharray="5 4" opacity=".55"/>'
    +(inArc?'<path d="M'+aX+','+H+' Q'+mX+','+(H-arcH)+' '+nBX.toFixed(1)+','+nBY.toFixed(1)+'" fill="none" stroke="#818cf8" stroke-width="3"/>':'')
    +'<circle cx="'+aX+'" cy="'+H+'" r="5.5" fill="#818cf8"/>'
    +'<circle cx="'+bX+'" cy="'+H+'" r="5.5" fill="#818cf8"/>'
    +(inArc?'<circle cx="'+nBX.toFixed(1)+'" cy="'+nBY.toFixed(1)+'" r="8" fill="#a78bfa" stroke="#fff" stroke-width="2.5"/>':'')
    +'</svg>';
}

// ── Moon phase helpers (reused + extended) ────────────────────────────
function moonPhase(p) {
  var icons=['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
  var names=['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
  var i=Math.round(p*8)%8;
  return {icon:icons[i], name:names[i]};
}

// Upcoming principal phases (New / First Qtr / Full / Last Qtr) with dates
function moonPhaseEvents(from, count) {
  var targets=[
    {p:0,   name:'New Moon',     icon:'🌑'},
    {p:0.25,name:'First Quarter',icon:'🌓'},
    {p:0.5, name:'Full Moon',    icon:'🌕'},
    {p:0.75,name:'Last Quarter', icon:'🌗'}
  ];
  var out=[], prev=SunCalc.getMoonIllumination(from).phase;
  for (var i=1; i<=420 && out.length<count; i++) {
    var t=new Date(from.getTime()+i*86400000);
    var cur=SunCalc.getMoonIllumination(t).phase;
    for (var j=0;j<targets.length;j++) {
      var tg=targets[j], crossed;
      if (tg.p===0) crossed = cur < prev;                 // wrap 0.97→0.03 = new moon
      else          crossed = prev < tg.p && cur >= tg.p; // upward crossing
      if (crossed) out.push({name:tg.name, icon:tg.icon, date:new Date(t)});
    }
    prev=cur;
  }
  out.sort(function(a,b){return a.date-b.date;});
  return out.slice(0,count);
}

// ── App state ─────────────────────────────────────────────────────────
var SM = {
  loc: {name:'Mumbai', country:'India', cc:'in', tz:'Asia/Kolkata'},
  date: new Date(),
  popAll: false,
  phaseAll: false
};

function smIsToday(){ var t=new Date(); return SM.date.getFullYear()===t.getFullYear() && SM.date.getMonth()===t.getMonth() && SM.date.getDate()===t.getDate(); }
function smMarker(){ return smIsToday() ? new Date() : null; }
function fmtLongDate(d){ return d.toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short',year:'numeric'}); }
function fmtShortDate(d){ return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }

// ── Live Location: Sun Journey + Moon Today ───────────────────────────
function renderLive() {
  var el=document.getElementById('sm-live');
  if (!el) return;
  if (typeof SunCalc==='undefined'){ el.innerHTML='<div class="sm-empty">Loading…</div>'; setTimeout(renderLive,300); return; }

  var c=getCoords(SM.loc), d=SM.date, tz=SM.loc.tz, mk=smMarker();
  var s=SunCalc.getTimes(d, c.lat, c.lon);
  var moon=SunCalc.getMoonIllumination(d);
  var mt=SunCalc.getMoonTimes(d, c.lat, c.lon);
  var ph=moonPhase(moon.phase);
  var dayLen=(s.sunrise&&s.sunset&&!isNaN(s.sunrise)&&!isNaN(s.sunset))?minsToHM(minsBetween(s.sunrise,s.sunset)):'—';

  var remain='—';
  if (smIsToday() && s.sunrise && s.sunset && !isNaN(s.sunrise) && !isNaN(s.sunset)) {
    var now=new Date();
    if (now < s.sunrise) remain=dayLen;
    else if (now > s.sunset) remain='0h 0m';
    else remain=minsToHM(minsBetween(now, s.sunset));
  }

  var ev=moonPhaseEvents(d, 8);
  var nf=null, nn=null;
  for (var k=0;k<ev.length;k++){ if(!nf&&ev[k].name==='Full Moon')nf=ev[k]; if(!nn&&ev[k].name==='New Moon')nn=ev[k]; }

  // Sun card
  var sun='<div class="sm-card sm-sun-card">'
    +'<div class="sm-card-head"><span class="sm-card-ico">☀️</span>'
      +'<div><div class="sm-card-title">Sun Journey</div><div class="sm-card-sub">The sun\u2019s path across the sky</div></div></div>'
    +'<div class="sm-arc">'+sunArcSVG(s.sunrise,s.sunset,mk)+'</div>'
    +'<div class="sm-arc-ends">'
      +'<div class="sm-arc-end"><span class="sm-ae-ico">🌅</span><div class="sm-ae-val">'+fmtT(s.sunrise,tz)+'</div><div class="sm-ae-lbl">Sunrise</div></div>'
      +'<div class="sm-arc-end"><span class="sm-ae-ico">🌇</span><div class="sm-ae-val">'+fmtT(s.sunset,tz)+'</div><div class="sm-ae-lbl">Sunset</div></div>'
    +'</div>'
    +'<div class="sm-stat-grid">'
      +stat('Dawn',fmtT(s.dawn,tz))
      +stat('Solar Noon',fmtT(s.solarNoon,tz))
      +stat('Dusk',fmtT(s.dusk,tz))
      +stat('Day Length',dayLen)
      +stat('Remaining Daylight',remain)
    +'</div></div>';

  // Moon card
  var moon2='<div class="sm-card sm-moon-card">'
    +'<div class="sm-card-head"><span class="sm-card-ico">🌙</span>'
      +'<div><div class="sm-card-title">Moon Today</div><div class="sm-card-sub">Current moon phase and lunar times</div></div></div>'
    +'<div class="sm-moon-hero">'
      +'<div class="sm-moon-disc" aria-hidden="true">'+ph.icon+'</div>'
      +'<div><div class="sm-moon-phase">'+ph.name+'</div>'
      +'<div class="sm-moon-illum">'+Math.round(moon.fraction*100)+'% illuminated</div></div>'
    +'</div>'
    +'<div class="sm-arc">'+moonArcSVG(mt.rise,mt.set,mk)+'</div>'
    +'<div class="sm-stat-grid">'
      +stat('Moonrise',fmtT(mt.rise,tz))
      +stat('Moonset',fmtT(mt.set,tz))
      +stat('Next Full Moon',nf?fmtShortDate(nf.date):'—')
      +stat('Next New Moon',nn?fmtShortDate(nn.date):'—')
    +'</div></div>';

  el.innerHTML=sun+moon2;

  var lbl=document.getElementById('sm-loc-label');
  if (lbl) lbl.textContent=SM.loc.name+(SM.loc.country?', '+SM.loc.country:'');
}
function stat(lbl,val){ return '<div class="sm-stat"><div class="sm-stat-val">'+val+'</div><div class="sm-stat-lbl">'+lbl+'</div></div>'; }

// ── Moon Phases section ───────────────────────────────────────────────
function renderPhases() {
  var el=document.getElementById('sm-phases');
  if (!el||typeof SunCalc==='undefined') return;
  var n=SM.phaseAll?8:4;
  var ev=moonPhaseEvents(SM.date, n);
  el.innerHTML=ev.map(function(e){
    return '<div class="sm-phase-card">'
      +'<div class="sm-phase-disc">'+e.icon+'</div>'
      +'<div class="sm-phase-name">'+e.name+'</div>'
      +'<div class="sm-phase-date">'+fmtShortDate(e.date)+'</div>'
    +'</div>';
  }).join('');
  var btn=document.getElementById('sm-phase-more');
  if (btn) btn.textContent=SM.phaseAll?'Show less':'View full calendar →';
}
function smPhaseMore(){ SM.phaseAll=!SM.phaseAll; renderPhases(); }

// ── Popular Cities table ──────────────────────────────────────────────
var TC_SM = { region:'all', sort:'city' };
var TC_SM_CITIES = [];
(function() {
  if (typeof CITIES==='undefined') return;
  var perRegion={asia:8,europe:8,americas:7,africa:4,oceania:3}, counts={};
  CITIES.forEach(function(c){
    if (!c.pop||c.pop<1) return;
    var r=c.region; if(!counts[r])counts[r]=0;
    if (counts[r]<(perRegion[r]||4)){ TC_SM_CITIES.push(c); counts[r]++; }
  });
})();

function smPopFilter(){
  TC_SM.region=document.getElementById('sm-pop-region').value;
  TC_SM.sort=document.getElementById('sm-pop-sort').value;
  renderPopular();
}
function smPopMore(){ SM.popAll=!SM.popAll; renderPopular(); }

function renderPopular() {
  var el=document.getElementById('sm-pop-body');
  if (!el) return;
  if (typeof SunCalc==='undefined'){ el.innerHTML='<div class="sm-loading">Calculating…</div>'; setTimeout(renderPopular,300); return; }

  var d=SM.date;
  var rows=TC_SM_CITIES.map(function(city){
    var c=getCoords(city);
    var s=SunCalc.getTimes(d,c.lat,c.lon);
    var mt=SunCalc.getMoonTimes(d,c.lat,c.lon);
    var moon=SunCalc.getMoonIllumination(d);
    var dl=(s.sunrise&&s.sunset&&!isNaN(s.sunrise)&&!isNaN(s.sunset))?minsToHM(minsBetween(s.sunrise,s.sunset)):'—';
    return {city:city, sr:fmtT(s.sunrise,city.tz), ss:fmtT(s.sunset,city.tz),
            dl:dl, mr:fmtT(mt.rise,city.tz), ms:fmtT(mt.set,city.tz),
            srRaw:s.sunrise?s.sunrise.getTime():0, ph:moonPhase(moon.phase)};
  });

  if (TC_SM.region!=='all') rows=rows.filter(function(r){return r.city.region===TC_SM.region;});
  if (TC_SM.sort==='sunrise') rows.sort(function(a,b){return a.srRaw-b.srRaw;});
  else rows.sort(function(a,b){return a.city.name.localeCompare(b.city.name);});

  if (!rows.length){ el.innerHTML='<div class="sm-loading">No cities for this filter.</div>'; return; }

  var total=rows.length;
  var shown=SM.popAll?rows:rows.slice(0,8);

  var body='<div class="sm-table-wrap"><table class="sm-table"><thead><tr>'
    +'<th>City</th><th class="sm-hide-mob">Country</th><th>Sunrise</th><th>Sunset</th>'
    +'<th class="sm-hide-mob">Day Length</th><th class="sm-hide-mob">Moonrise</th>'
    +'<th class="sm-hide-mob">Moonset</th><th>Moon Phase</th></tr></thead><tbody>'
    +shown.map(function(r){
      return '<tr>'
        +'<td><div class="sm-city-cell">'+flag(r.city.cc,16)+'<span class="sm-city-nm">'+r.city.name+'</span></div></td>'
        +'<td class="sm-hide-mob sm-muted">'+r.city.country+'</td>'
        +'<td class="sm-hl">'+r.sr+'</td>'
        +'<td class="sm-hl">'+r.ss+'</td>'
        +'<td class="sm-hide-mob">'+r.dl+'</td>'
        +'<td class="sm-hide-mob">'+r.mr+'</td>'
        +'<td class="sm-hide-mob">'+r.ms+'</td>'
        +'<td class="sm-phase-cell">'+r.ph.icon+' <span class="sm-muted">'+r.ph.name+'</span></td>'
      +'</tr>';
    }).join('')
    +'</tbody></table></div>';

  el.innerHTML=body;

  var btn=document.getElementById('sm-pop-more');
  if (btn) {
    if (total<=8) btn.style.display='none';
    else { btn.style.display=''; btn.textContent=SM.popAll?'Show less':('View More ('+(total-8)+' more) ↓'); }
  }
}

// ── Controls ──────────────────────────────────────────────────────────
function smUseMyLocation() {
  if (!navigator.geolocation){ if(typeof toast==='function')toast('Geolocation not supported'); return; }
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat=pos.coords.latitude, lon=pos.coords.longitude;
    var tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+lat+'&longitude='+lon+'&localityLanguage=en')
      .then(function(r){return r.json();})
      .then(function(x){
        SM.loc={name:x.city||x.locality||'My Location', country:x.countryName||'', cc:(x.countryCode||'un').toLowerCase(), tz:tz, _lat:lat, _lon:lon};
        smRerender();
      }).catch(function(){
        SM.loc={name:'My Location', country:'', cc:'un', tz:tz, _lat:lat, _lon:lon};
        smRerender();
      });
  }, function(){ if(typeof toast==='function')toast('Location access denied'); });
}

function smRerender(){ renderLive(); renderPopular(); renderPhases(); }

// Callbacks fired by util.js
function onPinsChanged(){ /* single-location model; no-op */ }
function onFmtChange(){ smRerender(); }

// ── Boot ──────────────────────────────────────────────────────────────
if (typeof boot==='function') boot();

// Date input default = today (local)
(function(){
  var di=document.getElementById('sm-date');
  if (di){
    var t=new Date(), mm=String(t.getMonth()+1).padStart(2,'0'), dd=String(t.getDate()).padStart(2,'0');
    di.value=t.getFullYear()+'-'+mm+'-'+dd;
    di.addEventListener('change', function(){
      var v=this.value; if(!v){ return; }
      var p=v.split('-');
      SM.date=new Date(+p[0], +p[1]-1, +p[2], 12, 0, 0);
      smRerender();
    });
  }
})();

// Location search (reuses initSearch from util.js)
if (typeof initSearch==='function') {
  initSearch('sm-loc-input','sm-loc-dd', function(city){
    SM.loc={name:city.name, country:city.country, cc:city.cc, tz:city.tz};
    var i=document.getElementById('sm-loc-input'); if(i){ i.value=''; i.blur(); }
    var dd=document.getElementById('sm-loc-dd'); if(dd) dd.hidden=true;
    smRerender();
  }, {showPinned:false});
}

function smBoot(){
  if (typeof SunCalc!=='undefined'){ smRerender(); }
  else setTimeout(smBoot,200);
}
if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', smBoot);
else smBoot();

// Refresh live "current position" each minute (only meaningful for today)
setInterval(function(){ if (smIsToday()) { renderLive(); } }, 60000);
