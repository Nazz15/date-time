/* TimezoneBuddy Blog — shared JS (no dependencies) */
(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};

  // mobile nav
  var bg=$('.bl-burger'),nv=$('.bl-nav');
  if(bg&&nv)bg.addEventListener('click',function(){nv.classList.toggle('open');bg.setAttribute('aria-expanded',nv.classList.contains('open'))});

  // UTC offset (minutes) of a zone at a date
  function off(tz,d){
    var p=new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(d),o={};
    p.forEach(function(x){o[x.type]=x.value});
    return Math.round((Date.UTC(o.year,o.month-1,o.day,o.hour,o.minute)-d.getTime())/60000);
  }
  function fmtDiff(m){var s=m<0?'-':'+',a=Math.abs(m),h=Math.floor(a/60),mm=a%60;return m===0?'Same time':s+h+'h'+(mm?' '+mm+'m':'')}

  // live clocks: <div class="bl-live" data-zones="Europe/London|London,Asia/Kolkata|Mumbai">
  function tick(){
    var now=new Date();
    $$('.bl-live[data-zones]').forEach(function(el){
      el.innerHTML=el.dataset.zones.split(',').map(function(z){
        var a=z.split('|');
        return '<span>'+a[1]+' <b>'+now.toLocaleTimeString('en-GB',{timeZone:a[0],hour:'2-digit',minute:'2-digit'})+'</b></span>';
      }).join('');
    });
    // live difference cells: <td data-diff="America/New_York|Europe/London">
    $$('[data-diff]').forEach(function(td){
      var a=td.dataset.diff.split('|');td.textContent=fmtDiff(off(a[1],now)-off(a[0],now));
    });
  }
  tick();setInterval(tick,30000);

  // reading progress + TOC highlight
  var art=$('.bl-art'),bars=$$('.bl-progress i,.bl-toc-bar i'),links=$$('.bl-toc a'),heads=$$('.bl-body h2[id]');
  if(art){
    var onScroll=function(){
      var r=art.getBoundingClientRect(),h=r.height-innerHeight,pc=Math.max(0,Math.min(100,(-r.top/(h>0?h:1))*100));
      bars.forEach(function(b){b.style.width=pc+'%'});
      var cur=heads[0];heads.forEach(function(x){if(x.getBoundingClientRect().top<120)cur=x});
      links.forEach(function(l){l.classList.toggle('on',cur&&l.getAttribute('href')==='#'+cur.id)});
    };
    addEventListener('scroll',onScroll,{passive:true});onScroll();
  }

  // share
  $$('.bl-share').forEach(function(b){b.addEventListener('click',function(){
    var d={title:document.title,url:location.href};
    if(navigator.share)navigator.share(d).catch(function(){});
    else if(navigator.clipboard)navigator.clipboard.writeText(d.url).then(function(){b.textContent='Link copied ✓'});
  })});

  // hub: filter chips + search
  var cards=$$('[data-cat]'),chips=$$('.bl-chips .bl-chip'),q=$('.bl-search'),empty=$('.bl-empty'),cat='all';
  function filter(){
    var t=(q&&q.value||'').toLowerCase().trim(),n=0;
    cards.forEach(function(c){
      var ok=(cat==='all'||c.dataset.cat===cat)&&(!t||c.textContent.toLowerCase().indexOf(t)>-1);
      c.style.display=ok?'':'none';if(ok)n++;
    });
    if(empty)empty.style.display=n?'none':'block';
  }
  chips.forEach(function(c){c.addEventListener('click',function(){
    chips.forEach(function(x){x.classList.remove('on');x.setAttribute('aria-pressed','false')});
    c.classList.add('on');c.setAttribute('aria-pressed','true');cat=c.dataset.f;filter();
  })});
  if(q)q.addEventListener('input',filter);
})();
