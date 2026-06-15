// converter.js — Timezone Converter + Meeting Planner + Time Diff
var CV={cities:[],selDate:new Date(),tool:'converter',selHour:null};
var QUICK=[{name:'New York',country:'United States',cc:'us',tz:'America/New_York'},{name:'London',country:'United Kingdom',cc:'gb',tz:'Europe/London'},{name:'Paris',country:'France',cc:'fr',tz:'Europe/Paris'},{name:'Dubai',country:'United Arab Emirates',cc:'ae',tz:'Asia/Dubai'},{name:'Mumbai',country:'India',cc:'in',tz:'Asia/Kolkata'},{name:'Singapore',country:'Singapore',cc:'sg',tz:'Asia/Singapore'},{name:'Tokyo',country:'Japan',cc:'jp',tz:'Asia/Tokyo'},{name:'Sydney',country:'Australia',cc:'au',tz:'Australia/Sydney'},{name:'Los Angeles',country:'United States',cc:'us',tz:'America/Los_Angeles'},{name:'São Paulo',country:'Brazil',cc:'br',tz:'America/Sao_Paulo'}];

function initCV(){
  var s=localStorage.getItem('wc_conv');
  CV.cities=s?JSON.parse(s):[{name:'New York',country:'United States',cc:'us',tz:'America/New_York'},{name:'London',country:'United Kingdom',cc:'gb',tz:'Europe/London'},{name:'Tokyo',country:'Japan',cc:'jp',tz:'Asia/Tokyo'},{name:'Mumbai',country:'India',cc:'in',tz:'Asia/Kolkata'}];
}
function saveCV(){localStorage.setItem('wc_conv',JSON.stringify(CV.cities));}

function setTool(t){
  CV.tool=t;
  document.querySelectorAll('.tool-tab').forEach(function(b){b.classList.toggle('active',b.dataset.t===t);});
  document.querySelectorAll('.tool-panel').forEach(function(p){p.style.display='none';});
  var p=document.getElementById('p-'+t); if(p) p.style.display='block';
  if(t==='meeting') renderMeeting();
  if(t==='diff')    renderDiff();
  updateShare();
}

// ── Converter ────────────────────────────────────────────────────────────────
function renderConv(){
  var el=document.getElementById('conv-rows'); if(!el) return;
  var srcTz=CV.cities[0]?CV.cities[0].tz:'UTC';
  var html=CV.cities.map(function(c,i){
    var off=offMin(CV.selDate,c.tz)-offMin(CV.selDate,srcTz);
    var absH=Math.floor(Math.abs(off)/60),absM=Math.abs(off)%60;
    var diffStr=off===0?'':(off>0?'+':'-')+absH+'h'+(absM?absM+'m':'');
    var diffCls=off>0?'ahead':off<0?'behind':'';
    var isrc=i===0;
    return '<div class="conv-row'+(isrc?' src':'')+'">'
      +'<div class="cr-flag" onclick="makeSource('+i+')" title="'+(isrc?'Source':'Set as source')+'">'+flag(c.cc,30)+'</div>'
      +'<div class="cr-info">'
      +'<div class="cr-name">'+c.name+(isrc?'<span class="src-badge">SOURCE</span>':diffStr?'<span class="diff-badge '+diffCls+'">'+diffStr+'</span>':'')+(isDST(c.tz)?'<span class="dst-badge">DST</span>':'')+'</div>'
      +'<div class="cr-tz">'+c.tz+' · '+utcOff(c.tz)+'</div>'
      +(!isrc?'<div class="cr-make-src" onclick="makeSource('+i+')">↑ Set as source</div>':'')
      +'</div>'
      +'<div class="cr-time-wrap"><div class="cr-time" id="cv'+i+'">'+fmt(c.tz,{date:CV.selDate})+'</div><div class="cr-date">'+fmtDate(c.tz,CV.selDate)+'</div></div>'
      +(i>0?'<button class="cr-rm" onclick="rmConv('+i+')" title="Remove">&#10005;</button>':'')
      +'</div>';
  }).join('');
  el.innerHTML=html;
  updateShare();
}
function tickConv(){
  if(CV.tool!=='converter') return;
  CV.cities.forEach(function(c,i){var el=document.getElementById('cv'+i);if(el) el.textContent=fmt(c.tz,{date:CV.selDate});});
}
function rmConv(i){CV.cities.splice(i,1);saveCV();renderConv();}
function makeSource(i){if(i===0)return;CV.cities.unshift(CV.cities.splice(i,1)[0]);saveCV();renderConv();}
function addConvCity(city){
  if(CV.cities.some(function(c){return c.tz===city.tz;})){toast(city.name+' already in list');return;}
  CV.cities.push(city);saveCV();renderConv();
  if(CV.tool==='meeting') renderMeeting();
  toast(flag(city.cc,14)+' '+city.name+' added');
}
function onDateChange(v){var ti=document.getElementById('time-inp');var d=new Date(v+'T'+(ti?ti.value:'12:00'));if(!isNaN(d)){CV.selDate=d;renderConv();}}
function onTimeChange(v){var di=document.getElementById('date-inp');var d=new Date((di?di.value:new Date().toISOString().slice(0,10))+'T'+v);if(!isNaN(d)){CV.selDate=d;renderConv();}}

// Build quick-add buttons in JS (never template literals in HTML)
function buildQA(){
  var el=document.getElementById('qa-body');if(!el)return;
  el.innerHTML=QUICK.map(function(c){
    return '<button class="qa-btn" onclick="addConvCity({name:\''+c.name.replace(/'/g,"\\'")
      +'\',country:\''+c.country+'\',cc:\''+c.cc+'\',tz:\''+c.tz+'\'})">'+flag(c.cc,14)+' '+c.name+'</button>';
  }).join('');
}

// ── Meeting Planner ───────────────────────────────────────────────────────────
function renderMeeting(){
  var el=document.getElementById('mtg-wrap');if(!el)return;
  var rows=CV.cities.length?CV.cities:[{name:'New York',country:'United States',cc:'us',tz:'America/New_York'},{name:'London',country:'United Kingdom',cc:'gb',tz:'Europe/London'},{name:'Tokyo',country:'Japan',cc:'jp',tz:'Asia/Tokyo'},{name:'Mumbai',country:'India',cc:'in',tz:'Asia/Kolkata'}];
  var nowH=new Date().getUTCHours();
  var hours=[];for(var h=0;h<24;h++) hours.push(h);

  var hRow='<tr><th class="mtg-city-col hdr">City</th>'+hours.map(function(h){
    var isN=h===nowH;
    return '<th class="mtg-h-cell'+(isN?' now-col':'')+'">'+String(h).padStart(2,'0')+':00</th>';
  }).join('')+'</tr>';

  var body=rows.map(function(c,ri){
    var shift=Math.round(offMin(new Date(),c.tz)/60);
    var rmB=ri>0?'<button onclick="rmMtg('+ri+')" style="background:none;border:none;color:var(--clr-text3);cursor:pointer;font-size:10px;float:right" title="Remove">&#10005;</button>':'';
    var cells=hours.map(function(h){
      var lh=((h+shift)%24+24)%24;
      var cls=lh>=9&&lh<17?'work':lh>=7&&lh<9?'morning':lh>=17&&lh<21?'evening':'sleep';
      var isN=h===nowH, isSel=CV.selHour===h;
      var lbl=WC.is24h?String(lh).padStart(2,'0')+':00':(lh===0?'12AM':lh<12?lh+'AM':lh===12?'12PM':(lh-12)+'PM');
      return '<td class="hour-cell '+cls+(isSel?' selected':'')+(isN?' now-col':'')+'" onclick="selHour('+h+')" title="'+c.name+': '+lbl+'">'+lbl+'</td>';
    }).join('');
    return '<tr><td class="mtg-city-col">'+flag(c.cc,15)+' <strong>'+c.name+'</strong>'+rmB+'<br><small style="color:var(--clr-text3)">'+utcOff(c.tz)+'</small></td>'+cells+'</tr>';
  }).join('');

  el.innerHTML='<div class="mtg-wrap"><table class="mtg-tbl"><thead>'+hRow+'</thead><tbody>'+body+'</tbody></table></div>';
}
function rmMtg(i){CV.cities.splice(i,1);saveCV();renderMeeting();}
function selHour(h){CV.selHour=CV.selHour===h?null:h;renderMeeting();}

// ── Time Diff ─────────────────────────────────────────────────────────────────
function renderDiff(){
  var el=document.getElementById('diff-body');if(!el)return;
  if(CV.cities.length<2){el.innerHTML='<p style="color:var(--clr-text3);padding:16px">Add at least 2 cities in the Converter tab.</p>';return;}
  var src=CV.cities[0];
  var html='<p style="font-size:13px;color:var(--clr-text2);margin-bottom:10px">vs '+flag(src.cc,14)+' <strong>'+src.name+'</strong> ('+utcOff(src.tz)+') — '+fmt(src.tz)+'</p><div class="diff-cards">';
  CV.cities.slice(1).forEach(function(c){
    var d=offMin(new Date(),c.tz)-offMin(new Date(),src.tz);
    var abs=Math.abs(d),str=d===0?'Same time':(d>0?'+':'−')+Math.floor(abs/60)+'h'+(abs%60?abs%60+'m':'');
    var col=d===0?'':d>0?'color:#2e7d32':'color:#c62828';
    html+='<div class="diff-card">'+flag(c.cc,22)
      +'<div style="flex:1"><div style="font-weight:600">'+c.name+'</div><div style="font-size:12px;color:var(--clr-text2)">'+c.country+' · '+utcOff(c.tz)+'</div></div>'
      +'<div style="text-align:right"><div style="font-family:var(--mono);font-size:18px;font-weight:600">'+fmt(c.tz)+'</div>'
      +'<div style="font-size:12px;font-weight:600;'+col+'">'+str+'</div></div></div>';
  });
  el.innerHTML=html+'</div>';
}

// ── Share URL ─────────────────────────────────────────────────────────────────
function updateShare(){
  var el=document.getElementById('share-url');if(!el)return;
  var url=location.origin+'/converter.html?tz='+CV.cities.map(function(c){return encodeURIComponent(c.tz);}).join(',');
  el.textContent=url.length>55?url.slice(0,52)+'...':url;
}
function copyShare(){
  var url=location.origin+'/converter.html?tz='+CV.cities.map(function(c){return encodeURIComponent(c.tz);}).join(',');
  navigator.clipboard.writeText(url).then(function(){toast('Link copied!');}).catch(function(){toast('Copy: '+url);});
}
function loadFromURL(){
  var tzs=new URLSearchParams(location.search).get('tz');if(!tzs)return;
  var from=tzs.split(',').map(decodeURIComponent).map(function(tz){return CITIES.find(function(c){return c.tz===tz;});}).filter(Boolean);
  if(from.length){CV.cities=from;saveCV();}
}

// ── Sidebar clocks ────────────────────────────────────────────────────────────
function tickSide(){
  var u=document.getElementById('utc-big'),ud=document.getElementById('utc-date');
  var l=document.getElementById('local-big'),ld=document.getElementById('local-date');
  var now=new Date();
  var f12={hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false};
  if(u) u.textContent=new Intl.DateTimeFormat('en-US',Object.assign({timeZone:'UTC'},f12)).format(now);
  if(ud) ud.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'UTC',weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(now);
  if(l) l.textContent=new Intl.DateTimeFormat('en-US',f12).format(now);
  if(ld) ld.textContent=Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// ── Tick ───────────────────────────────────────────────────────────────────────
function tick(){tickStrip();tickConv();tickSide();if(CV.tool==='diff')renderDiff();}
function onPinsChanged(){renderStrip();}
function onFmtChange(){renderStrip();renderConv();if(CV.tool==='meeting')renderMeeting();}

// ── Boot ───────────────────────────────────────────────────────────────────────
boot(); loadPins(); renderStrip(); initCV(); loadFromURL();
var now=new Date(),pad=function(n){return String(n).padStart(2,'0');};
var di=document.getElementById('date-inp'),ti=document.getElementById('time-inp');
if(di) di.value=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
if(ti) ti.value=pad(now.getHours())+':'+pad(now.getMinutes());
buildQA();
initSearch('conv-srch','conv-dd',function(city){addConvCity(city);document.getElementById('conv-srch').value='';document.getElementById('conv-dd').hidden=true;},{showPinned:false});
initSearch('mtg-srch','mtg-dd',function(city){addConvCity(city);document.getElementById('mtg-srch').value='';document.getElementById('mtg-dd').hidden=true;renderMeeting();},{showPinned:false});
renderConv(); setTool('converter');
tickSide(); setInterval(tick,1000);
if(location.hash==='#meeting') setTool('meeting');
if(location.hash==='#diff') setTool('diff');
