/* ===== Holiday Calendar — shared logic for /holiday/ and /holiday/{country}/ ===== */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function track(ev,p){try{if(window.gtag)gtag('event',ev,p||{});}catch(e){}}
var TYPES=[['national','N','National'],['religious','R','Religious'],['cultural','C','Cultural'],['public','P','Public holiday'],['bank','B','Bank holiday'],['observance','O','Observance']];
var TMAP={};TYPES.forEach(function(t){TMAP[t[0]]={l:t[1],n:t[2],c:'var(--hl-'+t[1].toLowerCase()+')'};});
var CHIP_ORDER=['public','bank','national','religious','cultural','observance'];
var MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
var DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function prim(e){for(var i=0;i<TYPES.length;i++)if(e.t.indexOf(TYPES[i][0])>-1)return TYPES[i][0];return 'observance';}
function dObj(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]);}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
var TODAY=iso(new Date());
function longDate(s){var d=dObj(s);return DOW[d.getDay()]+' '+d.getDate()+' '+MON[d.getMonth()].slice(0,3)+' '+d.getFullYear();}
function daysUntil(s){return Math.round((dObj(s)-dObj(TODAY))/86400000);}
function inTxt(s){var n=daysUntil(s);return n===0?'Today':n===1?'Tomorrow':n===-1?'Yesterday':n<0?'Passed':'in '+n+' days';}
function dot(t){var m=TMAP[t];return '<span class="hl-l" style="--c:'+m.c+'" title="'+m.n+'">'+m.l+'</span>';}
function flag(cc,w){return cc?'<span class="fi fi-'+esc(cc)+'" aria-hidden="true"'+(w?' style="width:'+w+'px;height:'+Math.round(w*.75)+'px"':'')+'></span>':'';}
function toastMsg(m){if(window.toast)toast(m);}
function navH(){var n=document.querySelector('.tzb-nav,.topnav');if(!n)return;var cs=getComputedStyle(n);document.documentElement.style.setProperty('--hl-navh',(cs.position==='sticky'||cs.position==='fixed')?n.offsetHeight+'px':'0px');}
window.addEventListener('resize',navH);setTimeout(navH,300);setTimeout(navH,1200);

/* ---------- .ics ---------- */
function icsEvent(e,country){
  var d=e.d.replace(/-/g,''),n=dObj(e.d);n.setDate(n.getDate()+1);
  return ['BEGIN:VEVENT','UID:'+d+'-'+e.n.replace(/[^a-z0-9]/gi,'').slice(0,30)+'@timezonebudy.com','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z','DTSTART;VALUE=DATE:'+d,'DTEND;VALUE=DATE:'+iso(n).replace(/-/g,''),'SUMMARY:'+(e.n+(country?' ('+country+')':'')).replace(/[,;]/g,'\\$&'),'TRANSP:TRANSPARENT','END:VEVENT'].join('\r\n');
}
function downloadIcs(list,country,file){
  var body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//TimezoneBuddy//Holidays//EN','CALSCALE:GREGORIAN'].concat(list.map(function(e){return icsEvent(e,country);}),['END:VCALENDAR']).join('\r\n');
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:'text/calendar'}));a.download=file;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
}
function share(url,title){
  if(navigator.share){navigator.share({title:title,url:url}).catch(function(){});return;}
  if(navigator.clipboard)navigator.clipboard.writeText(url).then(function(){toastMsg('Link copied');},function(){prompt('Copy this link:',url);});else prompt('Copy this link:',url);
}

/* ---------- shared rendering ---------- */
function tagsHTML(e,ctx){
  var p=prim(e),h=e.t.filter(function(t){return t!==p;}).map(function(t){return '<span class="hl-tag" style="--c:'+TMAP[t].c+'">'+TMAP[t].n+'</span>';});
  h.unshift('<span class="hl-tag" style="--c:'+TMAP[p].c+'">'+TMAP[p].l+' · '+TMAP[p].n+'</span>');
  if(ctx&&ctx.lw&&ctx.lw[e.d])h.push('<span class="hl-tag lw">Long weekend</span>');
  if(e.e)h.push('<span class="hl-tag est" title="Depends on the lunar calendar or official announcement">Estimated date</span>');
  return h.join('');
}
function monthGrid(y,m,byDay,opt){
  var first=new Date(y,m,1),start=first.getDay(),n=new Date(y,m+1,0).getDate(),h='';
  for(var i=0;i<start;i++)h+='<div class="hl-day x" aria-hidden="true"></div>';
  for(var d=1;d<=n;d++){
    var k=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'),list=byDay[k]||[],dw=(start+d-1)%7;
    var types=[];list.forEach(function(e){var p=prim(e);if(types.indexOf(p)<0)types.push(p);});
    var cls='hl-day'+(dw===0||dw===6?' we':'')+(k===TODAY?' today':'')+(list.length?' has':'')+(opt.sel===k?' sel':'');
    var lbl=d+' '+MON[m]+(list.length?': '+list.map(function(e){return e.n;}).join(', '):'');
    h+=(list.length?'<button type="button"':'<div')+' class="'+cls+'" data-day="'+k+'" aria-label="'+esc(lbl)+'"><b>'+d+'</b><span class="hl-dots">'+types.slice(0,3).map(dot).join('')+(types.length>3?'<span class="more">+'+(types.length-3)+'</span>':'')+(opt.count&&list.length>1?'<span class="more">'+list.length+'</span>':'')+'</span>'+(list.length?'</button>':'</div>');
  }
  return h;
}
function chipsHTML(counts,active){
  return CHIP_ORDER.map(function(t){var m=TMAP[t];return '<button type="button" class="hl-chip" data-type="'+t+'" aria-pressed="'+(active[t]!==false)+'" style="--c:'+m.c+'"><span class="hl-l">'+m.l+'</span>'+m.n.replace(' holiday','')+(counts?' <span class="k">'+(counts[t]||0)+'</span>':'')+'</button>';}).join('');
}

/* =====================================================================
   COUNTRY PAGE
   ===================================================================== */
function countryPage(H){
  var years=Object.keys(H.years).map(Number).sort();
  var thisY=new Date().getFullYear();
  var q0=new URLSearchParams(location.search);
  var S={year:years.indexOf(+q0.get('year'))>-1?+q0.get('year'):(years.indexOf(thisY)>-1?thisY:years[0]),region:q0.get('region')||'',types:{},q:'',view:'calendar',month:0,sel:null};
  if(S.region&&!H.regions[S.region]&&S.region!=='__nat')S.region='';
  S.month=S.year===thisY?new Date().getMonth():0;
  try{var tv=JSON.parse(localStorage.getItem('hl_types')||'null');if(tv)S.types=tv;}catch(e){}

  function regionOk(e){if(!S.region)return true;if(S.region==='__nat')return !e.r;return !e.r||e.r.indexOf(S.region)>-1;}
  function hay(e){return (e.n+' '+longDate(e.d)+' '+MON[+e.d.slice(5,7)-1]+' '+e.d+' '+(e.r||[]).map(function(r){return H.regions[r]||r;}).join(' ')+' '+e.t.join(' ')).toLowerCase();}
  function base(){return (H.years[S.year]||[]).filter(regionOk);}
  function filtered(){var q=S.q.trim().toLowerCase();return base().filter(function(e){return e.t.some(function(t){return S.types[t]!==false;})&&(!q||q.split(/\s+/).every(function(w){return hay(e).indexOf(w)>-1;}));});}
  function regionTxt(e){
    if(!e.r)return H.natLabel||'Nationwide';
    var n=e.r.map(function(r){return H.regions[r]||r;});
    return n.length>6?n.slice(0,5).join(', ')+' + '+(n.length-5)+' more':n.join(', ');
  }
  function longWeekends(){
    var off={},hol={};
    base().forEach(function(e){if(e.t.indexOf('public')>-1&&(S.region?true:!e.r)){off[e.d]=1;(hol[e.d]=hol[e.d]||[]).push(e.n);}});
    var runs=[],y=S.year,d=new Date(y,0,1),cur=null;
    while(d.getFullYear()===y){var k=iso(d),w=d.getDay()===0||d.getDay()===6;
      if(w||off[k]){if(!cur)cur={s:k,days:[]};cur.days.push(k);}else{if(cur)runs.push(cur);cur=null;}
      d.setDate(d.getDate()+1);}
    if(cur)runs.push(cur);
    var out=[],map={};
    runs.forEach(function(r){if(r.days.length>=3&&r.days.some(function(k){return hol[k];})){var names=[];r.days.forEach(function(k){(hol[k]||[]).forEach(function(n){if(names.indexOf(n)<0)names.push(n);});});out.push({s:r.days[0],e:r.days[r.days.length-1],n:r.days.length,names:names});r.days.forEach(function(k){map[k]=1;});}});
    return {list:out,map:map};
  }
  function itemHTML(e,lw){
    var p=prim(e);
    return '<article class="hl-item" id="d-'+e.d+'-'+e.i+'" data-d="'+e.d+'" style="--c:'+TMAP[p].c+'">'
      +'<div class="dt"><small>'+DOW[dObj(e.d).getDay()].toUpperCase()+'</small><b>'+dObj(e.d).getDate()+'</b></div>'
      +'<div class="bd"><h3>'+esc(e.n)+'</h3><span class="hl-tags">'+tagsHTML(e,{lw:lw})+'</span>'
      +'<div class="hl-meta">'+longDate(e.d)+' · '+esc(regionTxt(e))+(e.o?' · '+esc(e.o):'')+'</div>'
      +'<div class="hl-acts"><button type="button" data-ics="'+e.i+'">+ Add to calendar</button><button type="button" data-share="'+e.i+'">Share</button><a href="/holiday/?q='+encodeURIComponent(e.n.replace(/\s*\(.*\)$/,''))+'">Other countries →</a></div></div>'
      +'<span class="hl-in">'+inTxt(e.d)+'</span></article>';
  }
  var IDX={};
  function indexYear(){IDX={};Object.keys(H.years).forEach(function(y){H.years[y].forEach(function(e,i){e.i=y+'-'+i;IDX[e.i]=e;});});}
  indexYear();

  function render(){
    var all=filtered(),lw=longWeekends(),byDay={};
    all.forEach(function(e){(byDay[e.d]=byDay[e.d]||[]).push(e);});
    // counts on chips (ignores type filter)
    var counts={};base().forEach(function(e){e.t.forEach(function(t){counts[t]=(counts[t]||0)+1;});});
    $('hlChips').innerHTML=chipsHTML(counts,S.types);
    // headline stats
    var pub=base().filter(function(e){return e.t.indexOf('public')>-1&&!e.r;}).length;
    $('hlStat').textContent=pub+' nationwide public holidays in '+S.year+(lw.list.length?' · '+lw.list.length+' long weekends':'');
    // calendar view
    $('hlMonthT').textContent=MON[S.month]+' '+S.year;
    $('hlDays').innerHTML=monthGrid(S.year,S.month,byDay,{sel:S.sel});
    var ml=all.filter(function(e){return +e.d.slice(5,7)-1===S.month;});
    $('hlMonthL').textContent=MON[S.month]+' holidays';
    $('hlMonthN').textContent=ml.length+(ml.length===1?' day':' days');
    $('hlMonthList').innerHTML=ml.length?ml.map(function(e){return itemHTML(e,lw.map);}).join(''):'<div class="hl-empty">No holidays match in '+MON[S.month]+'. Try another month or turn on more categories.</div>';
    // list view
    var lh='',lastM=-1;
    all.forEach(function(e){var m=+e.d.slice(5,7)-1;if(m!==lastM){lh+='<h3 class="hl-mtitle">'+MON[m]+' '+S.year+'</h3>';lastM=m;}lh+=itemHTML(e,lw.map);});
    $('hlList').innerHTML=lh||'<div class="hl-empty">No holidays match your filters.</div>';
    $('hlListT').textContent='All holidays in '+S.year+' ('+all.length+')';
    // year view
    var yh='';for(var m=0;m<12;m++){var f=new Date(S.year,m,1).getDay(),n=new Date(S.year,m+1,0).getDate(),g='';
      for(var i=0;i<f;i++)g+='<span class="x"></span>';
      for(var d=1;d<=n;d++){var k=S.year+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'),L=byDay[k];g+=L?'<span class="h" data-day="'+k+'" style="--c:'+TMAP[prim(L[0])].c+'" title="'+esc(L.map(function(e){return e.n;}).join(', '))+'">'+d+'</span>':'<span>'+d+'</span>';}
      yh+='<div class="hl-mini"><b>'+MON[m]+'</b><div class="g">'+g+'</div></div>';}
    $('hlYear').innerHTML=yh;
    // long weekends
    $('hlLwT').textContent='Long weekends in '+S.year;
    $('hlLw').innerHTML=lw.list.length?lw.list.map(function(r){return '<div class="hl-lwc"><em>'+r.n+' days off</em><b>'+longDate(r.s).slice(0,-5)+' – '+longDate(r.e).slice(0,-5)+'</b><span>'+esc(r.names.join(', '))+'</span></div>';}).join(''):'<div class="hl-empty">No long weekends found for this selection.</div>';
    // views
    ['calendar','list','year'].forEach(function(v){$('hlV-'+v).hidden=S.view!==v;});
    document.querySelectorAll('#hlViews [data-view]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.view===S.view));});
    // year select + region + url
    $('hlYearSel').value=S.year;$('hlRegion').value=S.region;
    var qs=[];if(S.year!==thisY)qs.push('year='+S.year);if(S.region)qs.push('region='+S.region);
    try{history.replaceState(null,'',location.pathname+(qs.length?'?'+qs.join('&'):'')+location.hash);}catch(e){}
  }
  function nextHoliday(){
    var all=[];years.forEach(function(y){all=all.concat(H.years[y]);});
    var n=all.filter(function(e){return e.d>=TODAY&&e.t.indexOf('public')>-1&&!e.r;})[0];
    if(!n)return;
    var d=dObj(n.d);
    $('hlNext').hidden=false;
    $('hlNext').innerHTML='<div class="hl-dbox"><small>'+MON[d.getMonth()].slice(0,3).toUpperCase()+'</small><b>'+d.getDate()+'</b></div><div class="t"><small>Next public holiday in '+esc(H.short||H.name)+'</small><b>'+esc(n.n)+'</b><span>'+DOW[d.getDay()]+', '+d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear()+' · '+inTxt(n.d)+(n.e?' · estimated':'')+'</span></div>'+dot(prim(n));
  }
  function goTo(k){
    var y=+k.slice(0,4);if(H.years[y]){S.year=y;S.month=+k.slice(5,7)-1;S.sel=k;S.view='calendar';render();
      var el=document.querySelector('#hlMonthList [data-d="'+k+'"]');if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.add('flash');setTimeout(function(){el.classList.remove('flash');},1600);}}
  }
  // events
  $('hlChips').addEventListener('click',function(e){var b=e.target.closest('[data-type]');if(!b)return;var t=b.dataset.type;S.types[t]=S.types[t]===false;
    if(CHIP_ORDER.every(function(x){return S.types[x]===false;}))CHIP_ORDER.forEach(function(x){S.types[x]=true;});
    try{localStorage.setItem('hl_types',JSON.stringify(S.types));}catch(x){}render();track('holiday_filter',{type:t});});
  $('hlViews').addEventListener('click',function(e){var b=e.target.closest('[data-view]');if(!b)return;S.view=b.dataset.view;render();track('holiday_view',{view:S.view});});
  $('hlPrev').addEventListener('click',function(){if(S.month===0){if(H.years[S.year-1]){S.year--;S.month=11;}}else S.month--;S.sel=null;render();});
  $('hlNextM').addEventListener('click',function(){if(S.month===11){if(H.years[S.year+1]){S.year++;S.month=0;}}else S.month++;S.sel=null;render();});
  $('hlToday').addEventListener('click',function(){var t=new Date();if(H.years[t.getFullYear()]){S.year=t.getFullYear();S.month=t.getMonth();S.sel=TODAY;render();}});
  $('hlYearSel').addEventListener('change',function(){S.year=+this.value;S.month=S.year===thisY?new Date().getMonth():0;S.sel=null;render();track('holiday_year',{year:S.year});});
  $('hlRegion').addEventListener('change',function(){S.region=this.value;render();track('holiday_region',{region:S.region});});
  var qt=0;$('hlQ').addEventListener('input',function(){var v=this.value;clearTimeout(qt);qt=setTimeout(function(){S.q=v;if(v&&S.view==='calendar')S.view='list';render();},150);});
  document.addEventListener('click',function(e){
    var day=e.target.closest('[data-day]');
    if(day&&(day.closest('#hlDays')||day.closest('#hlYear'))){goTo(day.dataset.day);return;}
    var ic=e.target.closest('[data-ics]');if(ic){var ev=IDX[ic.dataset.ics];downloadIcs([ev],H.name,ev.n.replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'-'+ev.d+'.ics');track('holiday_ics');return;}
    var sh=e.target.closest('[data-share]');if(sh){var ev2=IDX[sh.dataset.share];share(location.origin+location.pathname+(ev2.d.slice(0,4)!=String(thisY)?'?year='+ev2.d.slice(0,4):'')+'#'+ev2.d,ev2.n+' — '+H.name);track('holiday_share');return;}
  });
  $('hlIcsAll').addEventListener('click',function(){var l=filtered();downloadIcs(l,H.name,H.slug+'-holidays-'+S.year+'.ics');track('holiday_ics_all',{n:l.length});});
  // boot
  $('hlYearSel').innerHTML=years.map(function(y){return '<option value="'+y+'">'+y+'</option>';}).join('');
  $('hlRegion').innerHTML='<option value="">All regions</option><option value="__nat">Nationwide only</option>'+Object.keys(H.regions).sort(function(a,b){return H.regions[a].localeCompare(H.regions[b]);}).map(function(k){return '<option value="'+k+'">'+esc(H.regions[k])+'</option>';}).join('');
  if(!Object.keys(H.regions).length)$('hlRegionF').hidden=true;
  nextHoliday(); render();
  var h=location.hash.slice(1);if(/^\d{4}-\d{2}-\d{2}$/.test(h))setTimeout(function(){goTo(h);},50);
}

/* =====================================================================
   HUB PAGE
   ===================================================================== */
function hubPage(D){
  var all=[];D.countries.forEach(function(c){Object.keys(c.years).forEach(function(y){c.years[y].forEach(function(e){all.push({e:e,c:c});});});});
  all.sort(function(a,b){return a.e.d<b.e.d?-1:a.e.d>b.e.d?1:0;});
  var S={types:{},cont:'all',month:new Date().getMonth(),year:new Date().getFullYear(),sel:TODAY};
  function okT(e){return e.t.some(function(t){return S.types[t]!==false;});}
  function okC(c){return S.cont==='all'||c.cont===S.cont;}
  // next holiday in the visitor's country
  var tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
  var mine=D.countries.filter(function(c){return c.slug===D.tzmap[tz];})[0];
  var pool=all.filter(function(x){return x.e.d>=TODAY&&x.e.t.indexOf('public')>-1&&!x.e.r&&(!mine||x.c===mine);});
  if(pool[0]){var n=pool[0],d=dObj(n.e.d);$('hlNext').hidden=false;
    $('hlNext').innerHTML='<div class="hl-dbox"><small>'+MON[d.getMonth()].slice(0,3).toUpperCase()+'</small><b>'+d.getDate()+'</b></div><div class="t"><small>'+(mine?'Next public holiday in '+esc(mine.short||mine.name):'Next public holiday worldwide')+'</small><b>'+esc(n.e.n)+(mine?'':' · '+esc(n.c.name))+'</b><span>'+DOW[d.getDay()]+', '+d.getDate()+' '+MON[d.getMonth()]+' · '+inTxt(n.e.d)+'</span></div><a class="hl-tbtn" style="display:inline-flex;align-items:center;text-decoration:none" href="/holiday/'+n.c.slug+'/">View all</a>';}
  function render(){
    var counts={};all.forEach(function(x){if(x.e.d.slice(0,4)==String(S.year)&&okC(x.c))x.e.t.forEach(function(t){counts[t]=(counts[t]||0)+1;});});
    $('hlChips').innerHTML=chipsHTML(counts,S.types);
    // upcoming 30 days, grouped by date
    var lim=iso(new Date(Date.now()+30*86400000)),groups={},order=[];
    all.forEach(function(x){if(x.e.d>=TODAY&&x.e.d<=lim&&okT(x.e)&&okC(x.c)&&!x.e.r){if(!groups[x.e.d]){groups[x.e.d]=[];order.push(x.e.d);}groups[x.e.d].push(x);}});
    $('hlWorld').innerHTML=order.length?order.slice(0,16).map(function(k){return '<div class="hl-wd"><small>'+longDate(k).toUpperCase().slice(0,-5)+' · '+inTxt(k)+'</small>'+groups[k].map(function(x){return '<a class="hl-wi" href="/holiday/'+x.c.slug+'/#'+k+'">'+flag(x.c.cc)+'<span class="n"><b>'+esc(x.e.n)+'</b><small>'+esc(x.c.name)+'</small></span>'+dot(prim(x.e))+'</a>';}).join('')+'</div>';}).join(''):'<div class="hl-empty">No holidays in the next 30 days for this selection.</div>';
    // world calendar
    var byDay={};all.forEach(function(x){if(okT(x.e)&&okC(x.c)&&!x.e.r)(byDay[x.e.d]=byDay[x.e.d]||[]).push(x.e);});
    $('hlMonthT').textContent=MON[S.month]+' '+S.year;
    $('hlDays').innerHTML=monthGrid(S.year,S.month,byDay,{sel:S.sel,count:true});
    var dl=all.filter(function(x){return x.e.d===S.sel&&okT(x.e)&&okC(x.c)&&!x.e.r;});
    $('hlDayT').textContent=S.sel?longDate(S.sel):'Pick a date';
    $('hlDayL').innerHTML=dl.length?dl.map(function(x){return '<a class="hl-wi" href="/holiday/'+x.c.slug+'/#'+x.e.d+'" style="padding:8px 0;border-bottom:1px solid var(--clr-border)">'+flag(x.c.cc)+'<span class="n"><b>'+esc(x.e.n)+'</b><small>'+esc(x.c.name)+'</small></span>'+dot(prim(x.e))+'</a>';}).join(''):'<div class="hl-empty">No holidays on this date in these countries.</div>';
    document.querySelectorAll('#hlCont [data-cont]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.cont===S.cont));});
  }
  // country cards: next holiday
  document.querySelectorAll('.hl-cc[data-slug]').forEach(function(a){
    var n=all.filter(function(x){return x.c.slug===a.dataset.slug&&x.e.d>=TODAY&&x.e.t.indexOf('public')>-1&&!x.e.r;})[0];
    if(n)a.querySelector('small').textContent='Next: '+n.e.n+' · '+longDate(n.e.d).slice(4,-5);
  });
  // search
  var HITS=[],HL=0;
  function search(q){
    q=q.trim().toLowerCase();if(!q)return [];
    var cs=D.countries.filter(function(c){return (c.name+' '+(c.alt||'')).toLowerCase().indexOf(q)>-1;}).map(function(c){return {c:c};});
    var hs=all.filter(function(x){return x.e.d>=TODAY&&!x.e.r&&(x.e.n.toLowerCase().indexOf(q)>-1||(longDate(x.e.d)+' '+MON[+x.e.d.slice(5,7)-1]).toLowerCase().indexOf(q)>-1);}).slice(0,12);
    return cs.concat(hs);
  }
  function draw(){var dd=$('hlDrop');
    if(!HITS.length){dd.innerHTML=$('hlQ').value.trim()?'<div>No matches in our countries yet</div>':'';dd.classList.toggle('open',!!$('hlQ').value.trim());return;}
    dd.innerHTML=HITS.map(function(h,i){return h.e?'<a href="/holiday/'+h.c.slug+'/#'+h.e.d+'" class="'+(i===HL?'hl':'')+'">'+flag(h.c.cc)+'<span><b>'+esc(h.e.n)+'</b> · '+esc(h.c.name)+'</span><small>'+longDate(h.e.d)+'</small></a>':'<a href="/holiday/'+h.c.slug+'/" class="'+(i===HL?'hl':'')+'">'+flag(h.c.cc)+'<span><b>'+esc(h.c.name)+'</b> holiday calendar</span><small>Country</small></a>';}).join('');
    dd.classList.add('open');}
  $('hlQ').addEventListener('input',function(){HITS=search(this.value);HL=0;draw();});
  $('hlQ').addEventListener('keydown',function(e){var a=$('hlDrop').querySelectorAll('a');
    if(e.key==='ArrowDown'){HL=Math.min(HL+1,a.length-1);draw();e.preventDefault();}
    else if(e.key==='ArrowUp'){HL=Math.max(HL-1,0);draw();e.preventDefault();}
    else if(e.key==='Enter'&&a[HL]){e.preventDefault();track('holiday_search',{q:this.value});location.href=a[HL].href;}
    else if(e.key==='Escape')$('hlDrop').classList.remove('open');});
  document.addEventListener('click',function(e){if(!e.target.closest('.hl-f'))$('hlDrop').classList.remove('open');});
  document.querySelectorAll('.hl-pop [data-q]').forEach(function(b){b.addEventListener('click',function(){$('hlQ').value=b.dataset.q;$('hlQ').dispatchEvent(new Event('input'));$('hlQ').focus();});});
  var q0=new URLSearchParams(location.search).get('q');if(q0){$('hlQ').value=q0;HITS=search(q0);draw();}
  // filters + calendar
  $('hlChips').addEventListener('click',function(e){var b=e.target.closest('[data-type]');if(!b)return;var t=b.dataset.type;S.types[t]=S.types[t]===false;if(CHIP_ORDER.every(function(x){return S.types[x]===false;}))CHIP_ORDER.forEach(function(x){S.types[x]=true;});render();});
  $('hlCont').addEventListener('click',function(e){var b=e.target.closest('[data-cont]');if(!b)return;S.cont=b.dataset.cont;render();});
  $('hlPrev').addEventListener('click',function(){if(S.month===0){if(S.year>D.minYear){S.year--;S.month=11;}}else S.month--;render();});
  $('hlNextM').addEventListener('click',function(){if(S.month===11){if(S.year<D.maxYear){S.year++;S.month=0;}}else S.month++;render();});
  $('hlToday').addEventListener('click',function(){var t=new Date();S.year=t.getFullYear();S.month=t.getMonth();S.sel=TODAY;render();});
  $('hlDays').addEventListener('click',function(e){var b=e.target.closest('[data-day]');if(!b)return;S.sel=b.dataset.day;render();});
  render();
}

window.HL_BOOT=function(){if(window.HOL)countryPage(window.HOL);else if(window.HOLS)hubPage(window.HOLS);};
})();
