/* TimezoneBuddy shared navigation — drop-in. Self-styles + self-mounts. */
(function () {
  if (window.__tzbnav) return; window.__tzbnav = 1;

  /* ==== EDIT LINKS HERE — confirm paths marked (?) ==== */
  var MAIN = [
    ["World Clock", "/world-clock/"],
    ["Time Difference Calculator", "https://timezonebudy.com/time-difference-calculator"],
    ["World Map",   "https://timezonebudy.com/world-time-map"],
    ["Sun & Moon",  "/sunmoon/"],
    ["Weather",     "/weather/"],
    ["Locations",   "/location/"]
  ];
  var MORE = [
    ["Time Zone Converter",        "/converter/"],        // (?)
    ["Meeting Planner",            "/meeting-planner/"],   // (?)
    ["DST (Daylight Saving Time)", "/dst/"],               // (?)
    ["Time Zone Abbreviations",    "/abbreviations/"],     // (?)
    ["Time Zone News",             "/news/"]               // (?)
  ];
  /* =================================================== */

  var GLOBE = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10" fill="#2f7fe0"/>' +
    '<path d="M4 9h16M4 15h16M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20" fill="none" stroke="#fff" stroke-width="1.1" opacity=".85"/>' +
    '<path d="M6 6c3 1 9 1 12 0M6 18c3-1 9-1 12 0" fill="none" stroke="#2f7fe0" stroke-width="1"/></svg>';

  var here = norm(location.pathname);
  function norm(p){ return (p.replace(/index\.html$/,"").replace(/\/+$/,"") || "/"); }
  function active(h){ h = norm(h); return h==="/" ? here==="/" : (here===h || here.indexOf(h+"/")===0); }
  function link(l){ return '<a href="'+l[1]+'"'+(active(l[1])?' class="on"':'')+'>'+l[0]+'</a>'; }

  var moreOn = MORE.some(function(l){ return active(l[1]); });
  var brand = '<a class="tzb-logo" href="https://timezonebudy.com/">'+GLOBE+
    '<span class="tzb-name"><span>Timezone<b>Buddy</b></span><small>Time Around the World</small></span></a>';

  var header =
    '<header class="tzb-nav" id="tzb-nav"><div class="tzb-in">' +
      '<button class="tzb-burger" aria-label="Open menu">'+
        '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 6h18M3 12h18M3 18h18" stroke="#1f2a44" stroke-width="2" fill="none" stroke-linecap="round"/></svg></button>' +
      brand +
      '<nav class="tzb-links">' + MAIN.map(link).join("") +
        '<div class="tzb-more'+(moreOn?" on":"")+'"><button class="tzb-mbtn" aria-expanded="false">More <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg></button>' +
          '<div class="tzb-drop">' + MORE.map(link).join("") + '</div></div>' +
      '</nav>' +
    '</div></header>';

  var drawer =
    '<div class="tzb-scrim"></div>' +
    '<aside class="tzb-drawer"><div class="tzb-dhead">'+brand+
      '<button class="tzb-close" aria-label="Close menu"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" stroke="#1f2a44" stroke-width="2" fill="none" stroke-linecap="round"/></svg></button></div>' +
      '<nav class="tzb-dlist">' + MAIN.map(link).join("") +
        '<button class="tzb-acc'+(moreOn?" open":"")+'" aria-expanded="'+moreOn+'">More <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg></button>' +
        '<div class="tzb-sub">' + MORE.map(link).join("") + '</div>' +
      '</nav></aside>';

  var css =
  ':root{--tzb-blue:#2f7fe0;--tzb-ink:#1f2a44}' +
  '.tzb-nav{position:sticky;top:0;z-index:1000;background:#fff;border-bottom:1px solid #e8ecf2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}' +
  '.tzb-in{max-width:1200px;margin:0 auto;height:64px;display:flex;align-items:center;padding:0 20px;gap:18px}' +
  '.tzb-logo{display:flex;align-items:center;gap:10px;text-decoration:none;margin-right:auto}' +
  '.tzb-name{display:flex;flex-direction:column;line-height:1.05}' +
  '.tzb-name span{font-size:20px;font-weight:700;color:var(--tzb-ink)}.tzb-name b{color:var(--tzb-blue);font-weight:700}' +
  '.tzb-name small{font-size:11px;color:#8a94a6;font-weight:400}' +
  '.tzb-links{display:flex;align-items:center;gap:26px}' +
  '.tzb-links a,.tzb-mbtn{font-size:15px;color:#3a465c;text-decoration:none;background:none;border:0;cursor:pointer;font-family:inherit;padding:6px 0;position:relative;display:inline-flex;align-items:center;gap:4px}' +
  '.tzb-links a:hover,.tzb-mbtn:hover{color:var(--tzb-blue)}' +
  '.tzb-links a.on,.tzb-more.on>.tzb-mbtn{color:var(--tzb-blue);font-weight:600}' +
  '.tzb-links a.on::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:2px;background:var(--tzb-blue);border-radius:2px}' +
  '.tzb-more{position:relative}' +
  '.tzb-drop{position:absolute;top:calc(100% + 12px);right:0;min-width:250px;background:#fff;border:1px solid #eef1f5;border-radius:10px;box-shadow:0 10px 30px rgba(20,30,60,.12);padding:6px;display:none;flex-direction:column}' +
  '.tzb-more.open .tzb-drop{display:flex}' +
  '.tzb-drop a{padding:10px 14px;border-radius:7px;font-size:14px;color:#3a465c}' +
  '.tzb-drop a:hover{background:#f4f7fb;color:var(--tzb-blue)}.tzb-drop a.on{color:var(--tzb-blue);font-weight:600}' +
  '.tzb-burger{display:none;background:none;border:0;cursor:pointer;padding:4px}' +
  /* drawer */
  '.tzb-scrim{position:fixed;inset:0;background:rgba(15,23,42,.4);opacity:0;visibility:hidden;transition:.2s;z-index:1100}' +
  '.tzb-scrim.show{opacity:1;visibility:visible}' +
  '.tzb-drawer{position:fixed;top:0;left:0;bottom:0;width:min(86vw,340px);background:#fff;z-index:1200;transform:translateX(-100%);transition:transform .25s ease;display:flex;flex-direction:column;box-shadow:2px 0 24px rgba(20,30,60,.15)}' +
  '.tzb-drawer.show{transform:none}' +
  '.tzb-dhead{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eef1f5}' +
  '.tzb-close{background:none;border:0;cursor:pointer;padding:4px}' +
  '.tzb-dlist{display:flex;flex-direction:column;overflow-y:auto;padding:6px 0}' +
  '.tzb-dlist>a,.tzb-acc{font-size:16px;color:#2b3752;text-decoration:none;background:none;border:0;border-bottom:1px solid #f1f4f8;text-align:left;padding:15px 20px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:space-between}' +
  '.tzb-dlist>a.on{color:var(--tzb-blue);font-weight:600}' +
  '.tzb-acc svg{transition:transform .2s}.tzb-acc.open svg{transform:rotate(180deg)}' +
  '.tzb-sub{display:none;flex-direction:column;background:#f7f9fc}.tzb-acc.open + .tzb-sub{display:flex}' +
  '.tzb-sub a{font-size:15px;color:#3a465c;text-decoration:none;padding:13px 20px 13px 34px;border-bottom:1px solid #eef2f7}.tzb-sub a.on{color:var(--tzb-blue);font-weight:600}' +
  'body.tzb-lock{overflow:hidden}' +
  '@media(max-width:900px){.tzb-links{display:none}.tzb-burger{display:block}.tzb-logo{margin:0 auto;transform:translateX(-14px)}.tzb-in{gap:0}}';

  var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
  var mount = document.getElementById("tzb-nav-mount") || document.querySelector("header#tzb-nav");
  var wrap = document.createElement("div"); wrap.innerHTML = header + drawer;
  if (mount) mount.replaceWith.apply(mount, [].slice.call(wrap.childNodes));
  else while (wrap.firstChild) document.body.insertBefore(wrap.firstChild, document.body.firstChild);

  /* interactions */
  var drw = document.querySelector(".tzb-drawer"), scr = document.querySelector(".tzb-scrim");
  function open(){ drw.classList.add("show"); scr.classList.add("show"); document.body.classList.add("tzb-lock"); }
  function close(){ drw.classList.remove("show"); scr.classList.remove("show"); document.body.classList.remove("tzb-lock"); }
  document.querySelector(".tzb-burger").onclick = open;
  document.querySelector(".tzb-close").onclick = close;
  scr.onclick = close;

  var more = document.querySelector(".tzb-more"), mbtn = more.querySelector(".tzb-mbtn");
  mbtn.onclick = function(e){ e.stopPropagation(); var o = more.classList.toggle("open"); mbtn.setAttribute("aria-expanded", o); };
  document.addEventListener("click", function(){ more.classList.remove("open"); mbtn.setAttribute("aria-expanded", false); });
  document.addEventListener("keydown", function(e){ if (e.key==="Escape"){ close(); more.classList.remove("open"); } });

  var acc = document.querySelector(".tzb-acc");
  acc.onclick = function(){ var o = acc.classList.toggle("open"); acc.setAttribute("aria-expanded", o); };
})();
