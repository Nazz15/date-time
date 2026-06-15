// clock.js — World Clock (index.html)
// Depends on: util.js, cities.js

var CK = { view: localStorage.getItem('wc_view')||'table', region:'all', sort:'city', asc:true };

// Safe city map: name_with_underscores → city obj (no JSON in onclick)
window._CM = {};
function _buildCM(){ CITIES.forEach(function(c){ _CM[c.name.replace(/[^a-zA-Z0-9]/g,'_')]=c; }); }
function addPinById(id){ var c=_CM[id]; if(c) addPin(c); }

// ── View switching ─────────────────────────────────────────────────────────
function setView(v){
  CK.view=v; localStorage.setItem('wc_view',v);
  document.querySelectorAll('.view-tab').forEach(function(t){ t.classList.toggle('active',t.dataset.v===v); });
  ['table','compact','digital','analog'].forEach(function(id){
    var el=document.getElementById('v-'+id); if(el) el.style.display=id===v?'block':'none';
  });
  renderView();
}
function filterRegion(v){ CK.region=v; renderView(); }
function setSort(col){
  if(CK.sort===col) CK.asc=!CK.asc; else{CK.sort=col;CK.asc=true;}
  renderView();
}

function getRows(){
  var rows=CITIES.filter(function(c){ return (CK.region==='all'||c.region===CK.region)&&c.pop>0; });
  rows.sort(function(a,b){
    var cmp=CK.sort==='city'?a.name.localeCompare(b.name):CK.sort==='country'?a.country.localeCompare(b.country)||a.name.localeCompare(b.name):offMin(new Date(),a.tz)-offMin(new Date(),b.tz);
    return CK.asc?cmp:-cmp;
  });
  return rows;
}

// ── TABLE ──────────────────────────────────────────────────────────────────
function renderTable(){
  var tbody=document.getElementById('tbl-body'); if(!tbody) return;
  var html=[];
  getRows().forEach(function(c){
    var dst=isDST(c.tz), pin=isPinned(c), cid=c.name.replace(/[^a-zA-Z0-9]/g,'_');
    html.push('<tr>'
      +'<td><div class="td-city">'+flag(c.cc,17)+'<span class="td-name">'+c.name+(dst?'<span class="dst-star">*</span>':'')+'</span></div></td>'
      +'<td class="td-country col-country">'+c.country+'</td>'
      +'<td><span class="td-time" id="t_'+cid+'">'+fmtDay(c.tz)+' '+fmt(c.tz)+'</span></td>'
      +'<td class="col-date" style="color:var(--clr-text2);font-size:12px">'+fmtDate(c.tz)+'</td>'
      +'<td class="col-offset td-off">'+utcOff(c.tz)+'</td>'
      +'<td style="text-align:center"><button class="add-btn'+(pin?' pinned':'')+'" onclick="addPinById(\''+cid+'\')" title="Add">'+(pin?'&#10003;':'+')+'</button></td>'
      +'</tr>');
  });
  tbody.innerHTML=html.join('');
}
function tickTable(){
  CITIES.filter(function(c){return (CK.region==='all'||c.region===CK.region)&&c.pop>0;}).forEach(function(c){
    var el=document.getElementById('t_'+c.name.replace(/[^a-zA-Z0-9]/g,'_'));
    if(el) el.textContent=fmtDay(c.tz)+' '+fmt(c.tz);
  });
}

// ── COMPACT ────────────────────────────────────────────────────────────────
function renderCompact(){
  var el=document.getElementById('cg'); if(!el) return;
  var html=[];
  getRows().forEach(function(c){
    var dst=isDST(c.tz), pin=isPinned(c), cid=c.name.replace(/[^a-zA-Z0-9]/g,'_');
    html.push('<div class="cg-cell">'
      +'<div class="cg-left">'+flag(c.cc,15)+'<span class="cg-name" onclick="addPinById(\''+cid+'\')">'+c.name+(dst?'<span class="dst-star">*</span>':'')+'</span></div>'
      +'<div class="cg-right"><div class="cg-time" id="c_'+cid+'">'+fmtDay(c.tz)+' '+fmt(c.tz)+'</div></div>'
      +'<button class="cg-add'+(pin?' pinned':'')+'" onclick="addPinById(\''+cid+'\')">'+(pin?'&#10003;':'+')+'</button>'
      +'</div>');
  });
  el.innerHTML=html.join('');
}
function tickCompact(){
  CITIES.filter(function(c){return (CK.region==='all'||c.region===CK.region)&&c.pop>0;}).forEach(function(c){
    var el=document.getElementById('c_'+c.name.replace(/[^a-zA-Z0-9]/g,'_'));
    if(el) el.textContent=fmtDay(c.tz)+' '+fmt(c.tz);
  });
}

// ── DIGITAL (pinned only) ──────────────────────────────────────────────────
function renderDigital(){
  var el=document.getElementById('dg'); if(!el) return;
  if(!WC.pinned.length){el.innerHTML='<div style="padding:40px;text-align:center;color:var(--clr-text3)">Search above to add cities.</div>';return;}
  var html=[];
  WC.pinned.forEach(function(c,i){
    var dst=isDST(c.tz), per=period(c.tz);
    html.push('<div class="dg-card '+per+'">'
      +'<div class="dg-top"><div class="dg-cw">'+flag(c.cc,22)+'<div><div class="dg-city">'+c.name+(dst?'<span class="dst-badge">DST</span>':'')+'</div><div class="dg-country">'+c.country+'</div></div></div>'
      +'<button class="dg-rm" onclick="removePin('+i+')" title="Remove">&#10005;</button></div>'
      +'<div class="dg-time" id="d_'+i+'">'+fmt(c.tz)+'</div>'
      +'<div class="dg-bot"><span class="dg-date" id="dd_'+i+'">'+fmtDate(c.tz)+'</span><span class="dg-off">'+utcOff(c.tz)+'</span></div>'
      +'</div>');
  });
  el.innerHTML=html.join('');
}
function tickDigital(){
  WC.pinned.forEach(function(c,i){
    var t=document.getElementById('d_'+i),d=document.getElementById('dd_'+i);
    if(t) t.textContent=fmt(c.tz);
    if(d) d.textContent=fmtDate(c.tz);
  });
}

// ── ANALOG (pinned only) ───────────────────────────────────────────────────
function renderAnalog(){
  var el=document.getElementById('ag'); if(!el) return;
  if(!WC.pinned.length){el.innerHTML='<div style="padding:40px;text-align:center;color:var(--clr-text3)">Search above to add cities.</div>';return;}
  var html=[];
  WC.pinned.forEach(function(c,i){
    var dst=isDST(c.tz);
    html.push('<div class="al-card">'
      +'<div class="al-head">'+flag(c.cc,20)+'<div class="al-info"><div class="al-city">'+c.name+(dst?'<span class="dst-star">*</span>':'')+'</div><div class="al-country">'+c.country+'</div></div>'
      +'<button class="al-rm" onclick="removePin('+i+')" title="Remove">&#10005;</button></div>'
      +'<div id="a_'+i+'">'+analogSVG(c.tz,110)+'</div>'
      +'<div class="al-time" id="at_'+i+'">'+fmt(c.tz)+'</div>'
      +'<div class="al-date" id="ad_'+i+'">'+fmtDate(c.tz)+'</div>'
      +'</div>');
  });
  el.innerHTML=html.join('');
}
function tickAnalog(){
  WC.pinned.forEach(function(c,i){
    var s=document.getElementById('a_'+i),t=document.getElementById('at_'+i),d=document.getElementById('ad_'+i);
    if(s) s.innerHTML=analogSVG(c.tz,110);
    if(t) t.textContent=fmt(c.tz);
    if(d) d.textContent=fmtDate(c.tz);
  });
}

// ── Dispatcher ─────────────────────────────────────────────────────────────
function renderView(){
  if(CK.view==='table') renderTable();
  if(CK.view==='compact') renderCompact();
  if(CK.view==='digital') renderDigital();
  if(CK.view==='analog') renderAnalog();
}
function tick(){
  tickStrip();
  if(CK.view==='table') tickTable();
  if(CK.view==='compact') tickCompact();
  if(CK.view==='digital') tickDigital();
  if(CK.view==='analog') tickAnalog();
}
function onPinsChanged(){ renderStrip(); renderView(); }
function onFmtChange(){ renderStrip(); renderView(); }

// ── Boot ───────────────────────────────────────────────────────────────────
_buildCM();
boot();
renderStrip();
var s=document.getElementById('cities-filter');
if(s) s.options[0].text='All ('+CITIES.filter(function(c){return c.pop>0;}).length+')';
initSearch('srch','srch-dd',function(city){ addPin(city); document.getElementById('srch').value=''; document.getElementById('srch-dd').hidden=true; },{showPinned:true});
setView(CK.view);
setInterval(tick,1000);
setInterval(function(){renderStrip();renderView();},60000);
