// tools.js — Timer, Stopwatch, Date Calc, Sun/Moon, Weather, Holidays
// APIs: Open-Meteo (free,no key), Nager.Date (free,no key), BigDataCloud (free,no key), suncalc (CDN)

// ── Nav ────────────────────────────────────────────────────────────────────────
function showTool(id){
  document.querySelectorAll('.tnav-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tool===id);});
  document.querySelectorAll('.tool-section').forEach(function(s){s.classList.toggle('active',s.id===id);});
}

// ── STOPWATCH ──────────────────────────────────────────────────────────────────
var SW={running:false,start:0,elapsed:0,lapStart:0,laps:[],t:null};
function swTick(){
  var tot=SW.elapsed+(Date.now()-SW.start);
  document.getElementById('sw-display').textContent=msToStr(tot);
}
function swToggle(){
  if(SW.running){
    clearInterval(SW.t); SW.elapsed+=Date.now()-SW.start; SW.running=false;
    document.getElementById('sw-start').textContent='Resume';
  } else {
    SW.start=Date.now(); SW.running=true;
    SW.t=setInterval(swTick,50);
    document.getElementById('sw-start').textContent='Pause';
  }
}
function swLap(){
  if(!SW.running) return;
  var tot=SW.elapsed+(Date.now()-SW.start);
  SW.laps.push(tot);
  var el=document.getElementById('sw-laps');
  el.innerHTML=SW.laps.slice().reverse().map(function(t,i){
    var n=SW.laps.length-i;
    return '<div class="lap-row"><span>Lap '+n+'</span><span>'+msToStr(t)+'</span></div>';
  }).join('');
}
function swReset(){ clearInterval(SW.t);SW.running=false;SW.elapsed=0;SW.laps=[];document.getElementById('sw-display').textContent='00:00.00';document.getElementById('sw-laps').innerHTML='';document.getElementById('sw-start').textContent='Start'; }
function msToStr(ms){
  var h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000),cs=Math.floor(ms%1000/10);
  return (h>0?pad2(h)+':':'')+pad2(m)+':'+pad2(s)+'.'+pad2(cs);
}

// ── COUNTDOWN ──────────────────────────────────────────────────────────────────
var CD={remaining:0,running:false,t:null};
function cdStart(){
  if(CD.running){clearInterval(CD.t);CD.running=false;document.getElementById('cd-start').textContent='Resume';return;}
  if(CD.remaining<=0){
    var h=parseInt(document.getElementById('cd-h').value)||0;
    var m=parseInt(document.getElementById('cd-m').value)||0;
    var s=parseInt(document.getElementById('cd-s').value)||0;
    CD.remaining=(h*3600+m*60+s)*1000;
  }
  if(CD.remaining<=0) return;
  CD.running=true; document.getElementById('cd-start').textContent='Pause';
  var last=Date.now();
  CD.t=setInterval(function(){
    var now=Date.now(); CD.remaining-=(now-last); last=now;
    if(CD.remaining<=0){CD.remaining=0;clearInterval(CD.t);CD.running=false;document.getElementById('cd-start').textContent='Start';cdAlert();}
    cdRender();
  },100);
}
function cdReset(){clearInterval(CD.t);CD.running=false;CD.remaining=0;cdRender();document.getElementById('cd-start').textContent='Start';}
function cdRender(){
  var ms=Math.max(0,CD.remaining);
  var h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.ceil(ms%60000/1000);
  if(s===60){s=0;m++;} if(m===60){m=0;h++;}
  document.getElementById('cd-display').textContent=pad2(h)+':'+pad2(m)+':'+pad2(s);
}
function cdAlert(){
  var audio=new AudioContext(),osc=audio.createOscillator(),gain=audio.createGain();
  osc.connect(gain);gain.connect(audio.destination);osc.frequency.setValueAtTime(880,audio.currentTime);
  gain.gain.setValueAtTime(0.3,audio.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,audio.currentTime+1);
  osc.start();osc.stop(audio.currentTime+1);
  toast('&#9200; Timer finished!');
}
function pad2(n){return String(Math.max(0,n)).padStart(2,'0');}

// ── DATE CALCULATOR ────────────────────────────────────────────────────────────
function calcDateDiff(){
  var d1=new Date(document.getElementById('dc-d1').value);
  var d2=new Date(document.getElementById('dc-d2').value);
  if(isNaN(d1)||isNaN(d2)){document.getElementById('dc-result').innerHTML='<p style="color:var(--clr-text3)">Select two valid dates.</p>';return;}
  var diff=Math.abs(d2-d1);
  var days=Math.floor(diff/86400000);
  var yrs=Math.floor(days/365.25),rem=Math.round(days%365.25);
  var months=Math.floor(rem/30.44),remDays=Math.round(rem%30.44);
  document.getElementById('dc-result').innerHTML=
    '<div class="big">'+days+' days</div>'
    +'<div class="sub">'+(yrs>0?yrs+' year'+(yrs>1?'s':'')+', ':'')+months+' month'+(months!==1?'s':'')+', '+remDays+' day'+(remDays!==1?'s':'')+'</div>'
    +'<div class="sub" style="margin-top:4px">'+Math.floor(diff/3600000)+' hours · '+(days*24*60)+' minutes</div>';
}
function calcAddDate(){
  var base=new Date(document.getElementById('dc-base').value);
  if(isNaN(base)){document.getElementById('dc-add-result').textContent='Select a start date.';return;}
  var d=parseInt(document.getElementById('add-days').value)||0;
  var m=parseInt(document.getElementById('add-months').value)||0;
  var y=parseInt(document.getElementById('add-years').value)||0;
  var res=new Date(base);
  res.setFullYear(res.getFullYear()+y);
  res.setMonth(res.getMonth()+m);
  res.setDate(res.getDate()+d);
  document.getElementById('dc-add-result').textContent=res.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}

// ── SUN & MOON (suncalc) ───────────────────────────────────────────────────────
var sunLat=40.7128,sunLon=-74.006,sunCity='New York';
function loadSunCalc(){
  if(typeof SunCalc==='undefined'){setTimeout(loadSunCalc,200);return;}
  renderSun();
}
function autoLocateSun(){
  navigator.geolocation.getCurrentPosition(function(pos){
    sunLat=pos.coords.latitude; sunLon=pos.coords.longitude;
    reverseGeocode(sunLat,sunLon,function(name){sunCity=name;document.getElementById('sun-city-name').textContent=sunCity;renderSun();});
  },function(){renderSun();});
}
function renderSun(){
  if(typeof SunCalc==='undefined') return;
  var now=new Date();
  var times=SunCalc.getTimes(now,sunLat,sunLon);
  var moon=SunCalc.getMoonIllumination(now);
  var moonPos=SunCalc.getMoonTimes(now,sunLat,sunLon);
  var fmtT=function(d){return isNaN(d)?'N/A':d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:!WC.is24h});};
  var phaseIcon=['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
  var phaseNames=['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
  var pi=Math.floor(moon.phase*8)%8;
  document.getElementById('sun-info').innerHTML=
    '<div class="sun-grid">'
    +'<div class="sun-card"><div class="sun-icon">🌅</div><div class="sun-val">'+fmtT(times.sunrise)+'</div><div class="sun-lbl">Sunrise</div></div>'
    +'<div class="sun-card"><div class="sun-icon">🌇</div><div class="sun-val">'+fmtT(times.sunset)+'</div><div class="sun-lbl">Sunset</div></div>'
    +'<div class="sun-card"><div class="sun-icon">☀️</div><div class="sun-val">'+fmtT(times.solarNoon)+'</div><div class="sun-lbl">Solar Noon</div></div>'
    +'<div class="sun-card"><div class="sun-icon">🌆</div><div class="sun-val">'+fmtT(times.dusk)+'</div><div class="sun-lbl">Dusk</div></div>'
    +'<div class="sun-card"><div class="sun-icon">🌄</div><div class="sun-val">'+fmtT(times.dawn)+'</div><div class="sun-lbl">Dawn</div></div>'
    +'<div class="sun-card"><div class="sun-icon">🌃</div><div class="sun-val">'+fmtT(times.night)+'</div><div class="sun-lbl">Night</div></div>'
    +'</div>'
    +'<div style="margin-top:16px;background:var(--clr-bg3);border-radius:var(--rlg);padding:16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">'
    +'<div class="moon-phase">'+phaseIcon[pi]+'</div>'
    +'<div><div style="font-size:16px;font-weight:600">'+phaseNames[pi]+'</div>'
    +'<div class="moon-info" style="text-align:left;margin-top:4px">Illumination: '+Math.round(moon.fraction*100)+'%</div>'
    +(moonPos.rise?'<div class="moon-info" style="text-align:left">Moonrise: '+fmtT(moonPos.rise)+'</div>':'')
    +(moonPos.set?'<div class="moon-info" style="text-align:left">Moonset: '+fmtT(moonPos.set)+'</div>':'')
    +'</div></div>';
}

// ── WEATHER (Open-Meteo — free, no key) ────────────────────────────────────────
var wxLat=40.7128,wxLon=-74.006,wxCity='New York',wxUnit='celsius';
var WX_ICONS={0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'❄️',75:'❄️',77:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',85:'🌨️',86:'❄️',95:'⛈️',96:'⛈️',99:'⛈️'};
var WX_DESC={0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Moderate drizzle',55:'Heavy drizzle',61:'Slight rain',63:'Moderate rain',65:'Heavy rain',71:'Slight snow',73:'Moderate snow',75:'Heavy snow',77:'Snow grains',80:'Slight showers',81:'Moderate showers',82:'Violent showers',85:'Slight snow shower',86:'Heavy snow shower',95:'Thunderstorm',96:'Thunderstorm with hail',99:'Thunderstorm with heavy hail'};
function setWxUnit(u){wxUnit=u;loadWeather();}
function autoLocateWx(){
  navigator.geolocation.getCurrentPosition(function(pos){
    wxLat=pos.coords.latitude;wxLon=pos.coords.longitude;
    reverseGeocode(wxLat,wxLon,function(name){wxCity=name;document.getElementById('wx-city-name').textContent=wxCity;loadWeather();});
  },function(){loadWeather();});
}
function loadWeather(){
  var el=document.getElementById('wx-body');
  el.innerHTML='<div class="wx-loading">Loading weather for '+wxCity+'…</div>';
  var url='https://api.open-meteo.com/v1/forecast?latitude='+wxLat+'&longitude='+wxLon+'&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit='+wxUnit+'&timezone=auto&forecast_days=7';
  fetch(url).then(function(r){return r.json();}).then(function(d){
    var c=d.current_weather, daily=d.daily;
    var icon=WX_ICONS[c.weathercode]||'🌡️', desc=WX_DESC[c.weathercode]||'Unknown';
    var unit=wxUnit==='celsius'?'°C':'°F';
    var days=daily.time.slice(0,7).map(function(t,i){
      var dt=new Date(t+'T12:00:00');
      return '<div class="wx-day">'
        +'<div class="wx-day-nm">'+dt.toLocaleDateString('en-US',{weekday:'short'})+'</div>'
        +'<div class="wx-day-ic">'+(WX_ICONS[daily.weathercode[i]]||'🌡️')+'</div>'
        +'<div class="wx-day-t">'+Math.round(daily.temperature_2m_max[i])+'°/'+'<span style="color:var(--clr-text2)">'+Math.round(daily.temperature_2m_min[i])+'°</span></div>'
        +'</div>';
    }).join('');
    el.innerHTML='<div class="wx-current">'
      +'<div class="wx-icon">'+icon+'</div>'
      +'<div><div class="wx-big">'+Math.round(c.temperature)+unit+'</div>'
      +'<div class="wx-desc">'+desc+'</div>'
      +'<div class="wx-meta">Wind: '+c.windspeed+' km/h · Updated: '+new Date(c.time).toLocaleTimeString()+'</div></div>'
      +'</div><div class="wx-grid">'+days+'</div>';
  }).catch(function(){el.innerHTML='<div class="wx-loading">Could not load weather. Check your connection.</div>';});
}

// ── HOLIDAYS (Nager.Date — free, no key) ──────────────────────────────────────
var holCountry='US',holYear=new Date().getFullYear();
function loadHolidays(){
  var el=document.getElementById('hol-list');
  el.innerHTML='<div class="hol-loading">Loading holidays…</div>';
  fetch('https://date.nager.at/api/v3/PublicHolidays/'+holYear+'/'+holCountry)
    .then(function(r){return r.json();})
    .then(function(data){
      if(!data.length){el.innerHTML='<div class="hol-loading">No holidays found.</div>';return;}
      el.innerHTML='<ul class="hol-list">'+data.map(function(h){
        return '<li class="hol-item">'
          +'<span class="hol-date">'+new Date(h.date+'T12:00').toLocaleDateString('en-US',{month:'short',day:'numeric',weekday:'short'})+'</span>'
          +'<span class="hol-name">'+h.localName+(h.name!==h.localName?' <span style="color:var(--clr-text3)">('+h.name+')</span>':'')+'</span>'
          +'<span class="hol-type">'+h.types.join(', ')+'</span>'
          +'</li>';
      }).join('')+'</ul>';
    }).catch(function(){el.innerHTML='<div class="hol-loading">Could not load holidays. Check connection.</div>';});
}

// ── Geolocation reverse geocode (BigDataCloud — free, no key) ─────────────────
function reverseGeocode(lat,lon,cb){
  fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+lat+'&longitude='+lon+'&localityLanguage=en')
    .then(function(r){return r.json();})
    .then(function(d){cb(d.city||d.locality||'Unknown');})
    .catch(function(){cb('Unknown');});
}

// ── Boot ───────────────────────────────────────────────────────────────────────
boot(); loadPins(); renderStrip();
function onPinsChanged(){renderStrip();}
function onFmtChange(){renderStrip();}
showTool('stopwatch');
// Init countdown display
cdRender();
// Set today in date calc
var today=new Date().toISOString().slice(0,10);
var d1=document.getElementById('dc-d1'),d2=document.getElementById('dc-d2'),db=document.getElementById('dc-base');
if(d1) d1.value=today; if(d2) d2.value=today; if(db) db.value=today;
// Load suncalc after script loads
loadSunCalc();
