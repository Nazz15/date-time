// util.js — shared utilities for all pages
// Deps: lipis/flag-icons (CDN), Intl.DateTimeFormat (browser native), @vvo/tzdb (cities.js)

// ── State ─────────────────────────────────────────────────────────────────────
var WC = {
  is24h: localStorage.getItem('wc_24h') === 'true',
  isDark: localStorage.getItem('wc_theme') === 'dark' ||
    (!localStorage.getItem('wc_theme') && matchMedia('(prefers-color-scheme:dark)').matches),
  pinned: [],
  _srchIdx: {},
  _srchCb: {},
  _toastT: null
};

// ── Flag (lipis/flag-icons via CDN) ──────────────────────────────────────────
function flag(cc, size) {
  size = size || 20;
  return '<span class="fi fi-' + (cc||'un').toLowerCase() +
    '" style="width:' + size + 'px;height:' + Math.round(size*0.75) +
    'px;border-radius:2px;display:inline-block;background-size:cover;flex-shrink:0" aria-hidden="true"></span>';
}

// ── Time (Intl.DateTimeFormat — 100% browser native) ─────────────────────────
function fmt(tz, opts) {
  opts = opts || {};
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit', minute: '2-digit',
      second: opts.sec ? '2-digit' : undefined,
      hour12: !WC.is24h
    }).format(opts.date || new Date());
  } catch(e) { return '--:--'; }
}

function fmtDate(tz, date) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz, weekday:'short', month:'short', day:'numeric'
    }).format(date || new Date());
  } catch(e) { return ''; }
}

function fmtDay(tz, date) {
  try {
    return new Intl.DateTimeFormat('en-US',{timeZone:tz,weekday:'short'}).format(date||new Date());
  } catch(e) { return ''; }
}

function offMin(date, tz) {
  try {
    var u = new Date(date.toLocaleString('en-US',{timeZone:'UTC'}));
    var t = new Date(date.toLocaleString('en-US',{timeZone:tz}));
    return (t-u)/60000;
  } catch(e) { return 0; }
}

function utcOff(tz) {
  var d = offMin(new Date(), tz);
  var s = d>=0?'+':'-', h=Math.floor(Math.abs(d)/60), m=Math.abs(d)%60;
  return 'UTC'+s+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
}

function isDST(tz) {
  try {
    var yr = new Date().getFullYear();
    var jan = offMin(new Date(yr,0,15),tz), jul = offMin(new Date(yr,6,15),tz);
    if(jan===jul) return false;
    return offMin(new Date(),tz)===Math.max(jan,jul);
  } catch(e) { return false; }
}

function period(tz) {
  try {
    var h = parseInt(new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'numeric',hour12:false}).format(new Date()));
    return h>=6&&h<12?'morning':h>=12&&h<17?'afternoon':h>=17&&h<21?'evening':'night';
  } catch(e) { return 'night'; }
}

// ── Analog clock SVG (pure Intl.DateTimeFormat) ───────────────────────────────
function analogSVG(tz, sz) {
  sz = sz||110;
  try {
    var parts = new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'numeric',minute:'numeric',second:'numeric',hour12:false}).formatToParts(new Date());
    var g = function(t){return parseInt((parts.find(function(p){return p.type===t;})||{value:'0'}).value);};
    var h=g('hour')%12, m=g('minute'), s=g('second');
    var cx=sz/2, cy=sz/2, r=sz/2-3;
    var toR = function(a){return(a-90)*Math.PI/180;};
    var pt = function(a,l){return [+(cx+Math.cos(toR(a))*l).toFixed(1),+(cy+Math.sin(toR(a))*l).toFixed(1)];};
    var tks='';
    for(var i=0;i<60;i++){var a=i*6,ih=i%5===0,p1=pt(a,r-(ih?8:4)),p2=pt(a,r);tks+='<line x1="'+p1[0]+'" y1="'+p1[1]+'" x2="'+p2[0]+'" y2="'+p2[1]+'" stroke="var(--clr-border)" stroke-width="'+(ih?1.5:0.8)+'">'+'</line>';}
    var hp=pt(h*30+m*0.5,r*0.55),mp=pt(m*6,r*0.78),sp=pt(s*6,r*0.88);
    return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 '+sz+' '+sz+'" aria-hidden="true">'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="var(--clr-bg2)" stroke="var(--clr-border2)" stroke-width="2"/>'
      +tks
      +'<line x1="'+cx+'" y1="'+cy+'" x2="'+hp[0]+'" y2="'+hp[1]+'" stroke="var(--clr-text)" stroke-width="4" stroke-linecap="round"/>'
      +'<line x1="'+cx+'" y1="'+cy+'" x2="'+mp[0]+'" y2="'+mp[1]+'" stroke="var(--clr-brand)" stroke-width="3" stroke-linecap="round"/>'
      +'<line x1="'+cx+'" y1="'+cy+'" x2="'+sp[0]+'" y2="'+sp[1]+'" stroke="var(--clr-acc)" stroke-width="1.5" stroke-linecap="round"/>'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="4" fill="var(--clr-brand)"/>'
      +'</svg>';
  } catch(e) { return '<svg width="'+sz+'" height="'+sz+'"></svg>'; }
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme', WC.isDark?'dark':'light');
  var b=document.getElementById('theme-btn');
  if(b) b.textContent = WC.isDark?'☀️':'🌙';
}
function toggleTheme() {
  WC.isDark=!WC.isDark;
  localStorage.setItem('wc_theme',WC.isDark?'dark':'light');
  applyTheme();
}
function toggle24h() {
  WC.is24h=!WC.is24h;
  localStorage.setItem('wc_24h',WC.is24h);
  var b=document.getElementById('fmt-btn');
  if(b) b.textContent=WC.is24h?'AM/PM':'24h';
  if(typeof onFmtChange==='function') onFmtChange();
}

// ── Pinned cities ─────────────────────────────────────────────────────────────
var DEFAULT_PINS=[
  {name:'Mumbai',country:'India',cc:'in',tz:'Asia/Kolkata'},
  {name:'London',country:'United Kingdom',cc:'gb',tz:'Europe/London'},
  {name:'New York',country:'United States',cc:'us',tz:'America/New_York'},
  {name:'Tokyo',country:'Japan',cc:'jp',tz:'Asia/Tokyo'},
  {name:'Dubai',country:'United Arab Emirates',cc:'ae',tz:'Asia/Dubai'},
  {name:'Singapore',country:'Singapore',cc:'sg',tz:'Asia/Singapore'}
];

function loadPins() {
  var s=localStorage.getItem('wc_pins');
  WC.pinned = s ? JSON.parse(s) : DEFAULT_PINS.slice();
  // Re-enrich from CITIES in case of stale data
  WC.pinned = WC.pinned.map(function(p){
    var c=CITIES.find(function(x){return x.name===p.name&&x.tz===p.tz;});
    if(c){p.cc=c.cc;p.country=c.country;}
    return p;
  });
}
function savePins() { localStorage.setItem('wc_pins',JSON.stringify(WC.pinned)); }
function isPinned(c){ return WC.pinned.some(function(p){return p.tz===c.tz&&p.name===c.name;}); }

function addPin(city) {
  if(isPinned(city)) return;
  WC.pinned.push(city); savePins();
  toast(flag(city.cc,16)+' <b>'+city.name+'</b> added to My Cities');
  if(typeof onPinsChanged==='function') onPinsChanged();
}
function removePin(i) {
  var c=WC.pinned[i]; WC.pinned.splice(i,1); savePins();
  toast(c.name+' removed');
  if(typeof onPinsChanged==='function') onPinsChanged();
}

// ── My Cities strip ───────────────────────────────────────────────────────────
function renderStrip() {
  var el=document.getElementById('my-strip');
  if(!el) return;
  if(!WC.pinned.length){
    el.innerHTML='<span class="strip-empty">Search above to add cities</span>';
    return;
  }
  el.innerHTML=WC.pinned.map(function(c,i){
    return '<div class="tile">'
      +'<button class="tile-rm" onclick="removePin('+i+')" title="Remove '+c.name+'">&#10005;</button>'
      +'<div class="tile-flag">'+flag(c.cc,28)+'</div>'
      +'<div class="tile-body">'
      +'<div class="tile-city">'+c.name+'</div>'
      +'<div class="tile-country">'+c.country+'</div>'
      +'<div class="tile-time" id="st'+i+'">'+fmt(c.tz)+'</div>'
      +'<div class="tile-date" id="sd'+i+'">'+fmtDate(c.tz)+'</div>'
      +'</div></div>';
  }).join('');
}
function tickStrip() {
  WC.pinned.forEach(function(c,i){
    var t=document.getElementById('st'+i), d=document.getElementById('sd'+i);
    if(t) t.textContent=fmt(c.tz);
    if(d) d.textContent=fmtDate(c.tz);
  });
}

// ── Search ────────────────────────────────────────────────────────────────────
var _st=null;
function _pick(id,idx){
  var city=WC._srchIdx[id]&&WC._srchIdx[id][idx];
  if(city&&WC._srchCb[id]) WC._srchCb[id](city);
}

function initSearch(inId,ddId,cb,opts){
  var inp=document.getElementById(inId), dd=document.getElementById(ddId);
  if(!inp||!dd) return;
  WC._srchCb[inId]=cb; WC._srchIdx[inId]=[];
  var showPinned=opts&&opts.showPinned;

  inp.addEventListener('input',function(e){
    var q=e.target.value.trim().toLowerCase();
    if(q.length<1){dd.hidden=true;return;}
    clearTimeout(_st);
    _st=setTimeout(function(){
      var hits=CITIES.filter(function(c){
        return c.name.toLowerCase().includes(q)||c.country.toLowerCase().includes(q);
      }).sort(function(a,b){
        return (a.name.toLowerCase().startsWith(q)?0:1)-(b.name.toLowerCase().startsWith(q)?0:1)||b.pop-a.pop;
      }).slice(0,10);
      WC._srchIdx[inId]=hits;
      if(!hits.length){dd.innerHTML='<div class="dd-empty">No cities found</div>';}
      else {
        var re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
        dd.innerHTML=hits.map(function(c,idx){
          var already=isPinned(c);
          var hi=c.name.replace(re,'<mark>$1</mark>');
          return '<div class="dd-row'+(already&&showPinned?' dd-dim':'')+'" onclick="_pick(\''+inId+'\','+idx+')">'
            +flag(c.cc,18)
            +'<div class="dd-info"><div class="dd-name">'+hi+'</div><div class="dd-ctry">'+c.country+'</div></div>'
            +'<div class="dd-time">'+fmtDay(c.tz)+' '+fmt(c.tz)+'</div>'
            +(already?'<span class="dd-chk">&#10003;</span>':'')
            +'</div>';
        }).join('');
      }
      dd.hidden=false;
    },140);
  });
  document.addEventListener('click',function(e){
    if(!e.target.closest('#'+inId)&&!e.target.closest('#'+ddId)) dd.hidden=true;
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){dd.hidden=true;inp.blur();}});
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg){
  var t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t);}
  t.innerHTML=msg; t.classList.add('show');
  clearTimeout(WC._toastT);
  WC._toastT=setTimeout(function(){t.classList.remove('show');},2200);
}

// ── UTC bar ───────────────────────────────────────────────────────────────────
function tickUTC(){
  var el=document.getElementById('utc-val');
  if(el) el.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date())+' UTC';
}

// ── Boot ──────────────────────────────────────────────────────────────────────
function boot(){
  loadPins(); applyTheme();
  var b=document.getElementById('fmt-btn');
  if(b) b.textContent=WC.is24h?'AM/PM':'24h';
  tickUTC(); setInterval(tickUTC,1000);
}
