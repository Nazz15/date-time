#!/usr/bin/env python3
# TimezoneBudy location page generator — new card design.
# Keeps the global nav/footer/scripts identical to the live site and swaps in
# the redesigned page body. Reads data/countries.csv + data/cities.csv.
# Writes output/location/<country>/index.html and .../<city>/index.html
#
#   pip install astral
#   python3 build.py

import csv, os, shutil, math, html
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from astral import LocationInfo, moon
from astral.sun import sun

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = ROOT   # CSVs live in the repo root (countries.csv / cities.csv)
OUT  = os.path.join(ROOT, "output")

# ---------------------------------------------------------------- helpers
def esc(s): return html.escape(str(s or ""), quote=True)

def g(row, key, default=""):
    """Safe column access — missing columns return default, never crash."""
    v = row.get(key)
    return default if v is None or v == "" else v

def offset_str(tz):
    """UTC±HH:MM for an IANA zone, right now."""
    try:
        off = datetime.now(ZoneInfo(tz)).utcoffset()
        mins = int(off.total_seconds() // 60)
        sign = "+" if mins >= 0 else "-"
        mins = abs(mins)
        return f"UTC{sign}{mins//60:02d}:{mins%60:02d}"
    except Exception:
        return "UTC+00:00"

def haversine(a, b):
    la1, lo1, la2, lo2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    d = math.sin((la2-la1)/2)**2 + math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 6371 * 2 * math.asin(math.sqrt(d))

def fmt_time(t):
    """Windows-safe 'H:MM AM/PM' (no %-I, which crashes on Windows)."""
    if t is None:
        return "—"
    s = t.strftime("%I:%M %p")
    return s[1:] if s[0] == "0" else s   # drop leading zero: 06:24 -> 6:24

MOON_NAMES = [
    (1.84,"New Moon"),(5.53,"Waxing Crescent"),(9.22,"First Quarter"),
    (12.91,"Waxing Gibbous"),(16.61,"Full Moon"),(20.30,"Waning Gibbous"),
    (23.99,"Last Quarter"),(27.68,"Waning Crescent"),(28,"New Moon")]

def moon_info(d):
    p = moon.phase(d)                       # 0..27.99 (~days since new moon)
    name = next(n for lim,n in MOON_NAMES if p <= lim)
    illum = round((1 - abs(1 - p/14.0)) * 100)
    return name, max(0, min(100, illum)), round(p, 1)

def next_moon_events(d):
    """Scan forward to find the next Full Moon and next New Moon dates."""
    from datetime import timedelta
    full = new = None
    prev = moon.phase(d)
    for i in range(1, 45):
        day = d + timedelta(days=i)
        cur = moon.phase(day)
        # full moon ~ phase 14 (crossing upward through 14)
        if full is None and prev < 14 <= cur:
            full = day
        # new moon ~ phase wraps 27.99 -> 0 (cur < prev)
        if new is None and cur < prev:
            new = day
        prev = cur
        if full and new:
            break
    f = lambda x: x.strftime("%b ") + str(x.day) + x.strftime(", %Y") if x else "—"
    return f(full), f(new)

def sun_info(lat, lng, tz):
    """Returns sunrise, solar noon, sunset, day length — all Windows-safe."""
    try:
        z = ZoneInfo(tz)
        obs = LocationInfo("", "", tz, lat, lng).observer
        s = sun(obs, date=datetime.now(z).date(), tzinfo=z)
        rise, noon, set_ = s["sunrise"], s["noon"], s["sunset"]
        length = set_ - rise
        h, m = divmod(int(length.total_seconds()//60), 60)
        return fmt_time(rise), fmt_time(noon), fmt_time(set_), f"{h}h {m:02d}m"
    except Exception:
        return "—", "—", "—", "—"

def moon_times(lat, lng, tz):
    """Moonrise / moonset for today, Windows-safe. Returns (rise, set)."""
    try:
        z = ZoneInfo(tz)
        obs = LocationInfo("", "", tz, lat, lng).observer
        today = datetime.now(z).date()
        try:
            mr = moon.moonrise(obs, today, tzinfo=z)
        except Exception:
            mr = None
        try:
            ms = moon.moonset(obs, today, tzinfo=z)
        except Exception:
            ms = None
        return fmt_time(mr), fmt_time(ms)
    except Exception:
        return "—", "—"

# ---------------------------------------------------------------- load data
with open(os.path.join(DATA, "countries.csv"), encoding="utf-8") as f:
    COUNTRIES = {r["slug"]: r for r in csv.DictReader(f)}
with open(os.path.join(DATA, "cities.csv"), encoding="utf-8") as f:
    CITIES = [r for r in csv.DictReader(f)]

for c in CITIES:
    try:
        c["lat"] = float(c.get("lat") or 0); c["lng"] = float(c.get("lng") or 0)
    except ValueError:
        c["lat"] = 0.0; c["lng"] = 0.0

CITIES_BY_COUNTRY = {}
for c in CITIES:
    CITIES_BY_COUNTRY.setdefault(c["country_slug"], []).append(c)

# world cities for the time-difference table (slug -> label, IANA)
WORLD = [("London","Europe/London"),("New York","America/New_York"),
         ("Mumbai","Asia/Kolkata"),("Singapore","Asia/Singapore"),
         ("Sydney","Australia/Sydney"),("Tokyo","Asia/Tokyo")]

# ---------------------------------------------------------------- chrome
def head(title, desc, canonical):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<script>(function(){{var s=localStorage.getItem('wc_theme');var d=s==='dark'||(!s&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}})();</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{esc(canonical)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/css/flag-icons.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.11.0/dist/tabler-icons.min.css">
<link rel="stylesheet" href="/main.css?v=2">
<link rel="stylesheet" href="/location.css?v=2">
<link rel="stylesheet" href="/locationnew.css?v=1">
<link rel="stylesheet" href="/footer.css?v=2">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0d2240">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="TimezoneBudy">
<link rel="stylesheet" href="/pwa.css?v=2">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌍</text></svg>">
</head>
<body>

<nav class="topnav" aria-label="Main navigation">
  <div class="topnav-inner">
    <a class="logo" href="/"><span>🌍</span><span class="logo-name">World<em>Clock</em></span></a>
    <div class="nav-tabs" role="tablist">
      <a class="nav-tab" href="/"><i class="ti ti-clock"></i> <span>World Clock</span></a>
      <a class="nav-tab" href="/converter.html"><i class="ti ti-arrows-exchange"></i> <span>Converter</span></a>
      <a class="nav-tab" href="/sunmoon.html"><i class="ti ti-sun"></i> <span>Sun &amp; Moon</span></a>
      <a class="nav-tab" href="/weather"><i class="ti ti-cloud"></i> <span>Weather</span></a>
      <a class="nav-tab" href="/time-difference-calculator"><i class="ti ti-chart-bar"></i> <span>Time Difference</span></a>
      <a class="nav-tab" href="/tools.html"><i class="ti ti-tool"></i> <span>Tools</span></a>
      <a class="nav-tab" href="/location/"><i class="ti ti-map-pin"></i> <span>Locations</span></a>
    </div>
    <div class="nav-utc"><span class="utc-l">UTC</span><span class="utc-v" id="utc-val">--:--:--</span></div>
    <div class="nav-btns">
      <button class="nav-btn" id="fmt-btn" onclick="toggle24h()">AM/PM</button>
      <button class="nav-btn" id="theme-btn" onclick="toggleTheme()">🌙</button>
    </div>
  </div>
</nav>
"""

FOOTER = """
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-col footer-brand">
        <a class="footer-logo" href="/"><span>🌍</span><span class="logo-name">World<em>Clock</em></span></a>
        <p class="footer-tagline">Free world clock, timezone converter, weather, and travel time tools for 130+ cities worldwide.</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Tools</h4>
        <a href="/">World Clock</a><a href="/converter.html">Timezone Converter</a>
        <a href="/converter.html#meeting">Meeting Planner</a><a href="/sunmoon.html">Sun &amp; Moon</a>
        <a href="/weather">Weather</a><a href="/tools.html">Time Tools</a>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Locations</h4>
        <a href="/location/">Browse All Countries</a><a href="/location/india/">India</a>
        <a href="/location/united-states/">United States</a><a href="/location/united-kingdom/">United Kingdom</a>
        <a href="/location/china/">China</a><a href="/location/japan/">Japan</a>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Company</h4>
        <a href="/about.html">About Us</a><a href="/contact.html">Contact Us</a>
        <a href="/blog/">Blog</a><a href="/privacy-policy.html">Privacy Policy</a>
        <a href="/terms.html">Terms of Service</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span id="footer-year">2026</span> TimezoneBudy. All rights reserved.</span>
      <div class="footer-bottom-links">
        <a href="/privacy-policy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/contact.html">Contact</a>
      </div>
    </div>
  </div>
</footer>

<script src="/util.js?v=2"></script>
<script src="/pwa-install.js" defer></script>
<script>boot();</script>
<script>
function tickAllClocks(){var now=new Date();var is24h=(window.WC&&window.WC.is24h)||false;
document.querySelectorAll('[data-tz]').forEach(function(el){var tz=el.getAttribute('data-tz');try{el.textContent=now.toLocaleTimeString('en-US',{timeZone:tz,hour12:!is24h,hour:'2-digit',minute:'2-digit',second:el.classList.contains('loc-live-time')||el.classList.contains('tzb-clock')?'2-digit':undefined});}catch(e){el.textContent='--:--';}});
document.querySelectorAll('[data-tz-date]').forEach(function(el){var tz=el.getAttribute('data-tz-date');try{el.textContent=now.toLocaleDateString('en-US',{timeZone:tz,weekday:'long',year:'numeric',month:'long',day:'numeric'});}catch(e){el.textContent='';}});}
tickAllClocks();setInterval(tickAllClocks,1000);
</script>
<script src="/location.js?v=2"></script>
<script src="/tzb-weather.js?v=1" defer></script>
<!-- nav_inject_v2 -->
<script src="/nav.js?v=3"></script>
</body>
</html>"""

def flag(cc, w=18, h=14):
    return (f'<span class="fi fi-{cc.lower()}" style="width:{w}px;height:{h}px;'
            f'border-radius:2px;display:inline-block;background-size:cover;'
            f'flex-shrink:0" aria-hidden="true"></span>')

# ---------------------------------------------------------------- city page
def build_city(city, country):
    slug, name = city["slug"], city["city"]
    cslug, cname = country["slug"], country["country"]
    cc = g(country,"cca2","un"); tz = city["timezone"]; off = offset_str(tz)
    lat, lng = city["lat"], city["lng"]
    tzname = tz.split("/")[-1].replace("_", " ") + " Time"
    canonical = f"https://timezonebudy.com/location/{cslug}/{slug}/"

    rise, noon, set_, length = sun_info(lat, lng, tz)
    mname, illum, mage = moon_info(datetime.now(ZoneInfo(tz)).date())
    mrise, mset = moon_times(lat, lng, tz)
    next_full, next_new = next_moon_events(datetime.now(ZoneInfo(tz)).date())

    # nearby cities by distance (same-country first, then any)
    others = [c for c in CITIES if c["slug"] != slug]
    others.sort(key=lambda c: haversine((lat,lng),(c["lat"],c["lng"])))
    nearby = others[:6]

    # time difference vs world cities
    base = datetime.now(ZoneInfo(tz)).utcoffset().total_seconds()/3600
    diffs = []
    for wl, wtz in WORLD:
        if wtz == tz:
            continue
        try:
            wo = datetime.now(ZoneInfo(wtz)).utcoffset().total_seconds()/3600
            d = wo - base
            sign = "+" if d >= 0 else "−"
            hh = int(abs(d)); mm = int(round((abs(d)-hh)*60))
            dtxt = f"{sign}{hh}h" + (f" {mm}m" if mm else "")
            diffs.append((wl, wtz, dtxt))
        except Exception:
            pass

    # ---- data-driven markup pieces
    stat = lambda k,v: f'<div class="tzb-info-cell"><div class="k">{k}</div><div class="v">{v}</div></div>'
    info = "".join([
        stat("COUNTRY", f'<a href="/location/{cslug}/" style="color:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:6px">{flag(cc,20,14)}{esc(cname)}</a>'),
        stat("UTC OFFSET", esc(off)),
        stat("CURRENCY", f'{esc(g(country,"currency_symbol"))} {esc(g(country,"currency_code"))}'),
        stat("CURRENCY NAME", esc(g(country,"currency_name"))),
        stat("LANGUAGE", esc(g(country,"language"))),
        stat("DIAL CODE", esc(g(country,"dial_code"))),
    ])

    nearby_html = "".join(
        f'<a class="tzb-ncard" href="/location/{c["country_slug"]}/{c["slug"]}/">'
        f'<div class="img"></div><div class="body">'
        f'<div class="nm">{esc(c["city"])}</div>'
        f'<div class="tm" data-tz="{esc(c["timezone"])}">--:--</div>'
        f'<div class="wx" data-wx-lat="{c["lat"]}" data-wx-lng="{c["lng"]}">☀️ --°</div>'
        f'</div></a>' for c in nearby)

    diff_html = "".join(
        f'<tr><td class="c1">{esc(wl)}</td>'
        f'<td class="c2" data-tz="{esc(wtz)}">--:--</td>'
        f'<td class="diff">{esc(dtxt)}</td></tr>' for wl, wtz, dtxt in diffs)

    # more countries in same continent (chips)
    cont = g(country,"continent","Asia")
    peers = [c for s,c in COUNTRIES.items()
             if c["continent"] == cont and s != cslug][:6]
    chips = "".join(
        f'<a class="tzb-chip" href="/location/{g(p,"slug")}/">{flag(g(p,"cca2","un"),20,14)}{esc(g(p,"country"))}</a>'
        for p in peers)

    body = f"""
<main class="wrap tzb-loc">

  <section class="tzb-hero" data-wx-lat="{lat}" data-wx-lng="{lng}">
    <div class="tzb-hero-in">
      <div class="tzb-hero-main">
        <nav class="tzb-crumb"><a href="/location/">Locations</a> › <a href="/location/{cslug}/">{esc(cname)}</a> › <span>{esc(name)}</span></nav>
        {flag(cc,34,24)}
        <div class="tzb-eyebrow">Current Local Time in</div>
        <h1 class="tzb-city">{esc(name)}, {esc(cname)}</h1>
        <div class="tzb-clock"><span class="tzb-clock-t" data-tz="{tz}">--:--:--</span></div>
        <div class="tzb-date" data-tz-date="{tz}">Loading…</div>
        <div class="tzb-tzline">{esc(off.replace("UTC","GMT "))} | {esc(tzname)}</div>
        <div class="tzb-hero-actions">
          <button class="tzb-btn tzb-btn-primary">➕ Add to World Clock</button>
          <button class="tzb-btn tzb-btn-ghost" onclick="navigator.share&&navigator.share({{title:document.title,url:location.href}})">🔗 Share</button>
        </div>
      </div>
      <div class="tzb-hero-weather" id="tzb-hero-wx">
        <div class="hw-row"><span class="hw-ico" id="wx-ico">⛅</span><span class="hw-temp" id="wx-temp">--°</span></div>
        <div id="wx-desc">Loading weather…</div>
      </div>
    </div>
  </section>

  <section class="tzb-section"><div class="tzb-card tzb-info-grid">{info}</div></section>

  <section class="tzb-section tzb-quad">
    <div class="tzb-card qcard"><span class="ic">🌅</span><div><div class="k">Sunrise</div><div class="v">{esc(rise)}</div></div></div>
    <div class="tzb-card qcard"><span class="ic">🌇</span><div><div class="k">Sunset</div><div class="v">{esc(set_)}</div></div></div>
    <div class="tzb-card qcard"><span class="ic">☀️</span><div><div class="k">Day Length</div><div class="v">{esc(length)}</div></div></div>
    <div class="tzb-card qcard"><span class="moon-thumb"></span><div><div class="k">Moon Phase</div><div class="v">{esc(mname)}</div><div class="s">{illum}% illuminated</div></div></div>
  </section>

  <section class="tzb-section tzb-two">
    <div class="tzb-card card-pad">
      <h2 class="tzb-stitle"><span class="i">🌤️</span>Hourly Weather Forecast</h2>
      <div class="tzb-hours" id="tzb-hourly"><div class="tzb-empty">Loading forecast…</div></div>
    </div>
    <div class="tzb-card card-pad">
      <h2 class="tzb-stitle"><span class="i">🕐</span>7-Day Weather Forecast</h2>
      <div class="tzb-days7" id="tzb-daily"><div class="tzb-empty">Loading forecast…</div></div>
    </div>
  </section>

  <section class="tzb-section tzb-trio">
    <div class="tzb-card card-pad">
      <h2 class="tzb-stitle"><span class="i">☀️</span>Sun in {esc(name)}</h2>
      <div class="kv"><span class="k">Sunrise</span><span class="v">{esc(rise)}</span></div>
      <div class="kv"><span class="k">Solar Noon</span><span class="v">{esc(noon)}</span></div>
      <div class="kv"><span class="k">Sunset</span><span class="v">{esc(set_)}</span></div>
      <div class="kv"><span class="k">Day Length</span><span class="v">{esc(length)}</span></div>
    </div>
    <div class="tzb-card card-pad">
      <h2 class="tzb-stitle"><span class="i">🌙</span>Moon in {esc(name)}</h2>
      <div class="moon-big"></div>
      <div style="text-align:center;font-weight:700;margin-bottom:8px">{esc(mname)} · {illum}%</div>
      <div class="kv"><span class="k">Moonrise</span><span class="v">{esc(mrise)}</span></div>
      <div class="kv"><span class="k">Moonset</span><span class="v">{esc(mset)}</span></div>
      <div class="kv"><span class="k">Moon Age</span><span class="v">{mage} days</span></div>
      <div class="kv"><span class="k">Next Full Moon</span><span class="v">{esc(next_full)}</span></div>
      <div class="kv"><span class="k">Next New Moon</span><span class="v">{esc(next_new)}</span></div>
    </div>
    <div class="tzb-card card-pad">
      <h2 class="tzb-stitle"><span class="i">🕐</span>Time Zone Information</h2>
      <div class="kv"><span class="k">Time Zone</span><span class="v">{esc(tzname)}</span></div>
      <div class="kv"><span class="k">IANA Zone</span><span class="v">{esc(tz)}</span></div>
      <div class="kv"><span class="k">UTC Offset</span><span class="v">{esc(off)}</span></div>
      <p class="muted" style="font-size:13px;margin:12px 0 0">Live local time for {esc(name)} is shown above and updates every second.</p>
    </div>
  </section>

  <section class="tzb-section tzb-two">
    <div class="tzb-card card-pad">
      <h2 class="tzb-stitle"><span class="i">🌐</span>{esc(name)} Time vs Other Major Cities</h2>
      <table class="tzb-tbl">{diff_html}</table>
    </div>
    <div class="tzb-card card-pad">
      <h2 class="tzb-stitle"><span class="i">📍</span>Nearby Cities</h2>
      <div class="tzb-nearby">{nearby_html}</div>
    </div>
  </section>

  <section class="tzb-section tzb-two">
    <div class="tzb-card card-pad">
      <h2 class="tzb-stitle"><span class="i">🌏</span>More Countries in {esc(cont)}</h2>
      <div class="tzb-chips">{chips}</div>
    </div>
    <div class="tzb-card card-pad seo-sec">
      <h2 class="tzb-stitle"><span class="i">ℹ️</span>About Time in {esc(name)}</h2>
      <p>{esc(name)} is located in <a href="/location/{cslug}/">{esc(cname)}</a> and runs on {esc(tz)} ({esc(off)}). Use our <a href="/converter.html">Timezone Converter</a> to compare {esc(name)} with any city worldwide, or check <a href="/sunmoon.html">sun &amp; moon times</a>.</p>
    </div>
  </section>

  <section class="tzb-section">
    <div class="tzb-cta">
      <h3>🌐 Explore More Locations Worldwide</h3>
      <p>Find current time, weather, and more for any city around the world.</p>
      <form class="tzb-search" role="search" onsubmit="return false">
        <input placeholder="Search for a city, country or time zone...">
        <button type="submit" aria-label="Search">🔍</button>
      </form>
    </div>
  </section>

</main>
"""
    page = head(f"Current Time in {name}, {cname} | TimezoneBudy",
                f"Current local time, weather, sun & moon for {name}, {cname}. {off} · {tz}",
                canonical) + body + FOOTER
    path = os.path.join(OUT, "location", cslug, slug, "index.html")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(page)

# ---------------------------------------------------------------- country page
def build_country(country):
    cslug, cname, cc = country["slug"], country["country"], g(country,"cca2","un")
    off = offset_str_from_utc(country.get("primary_timezone",""))
    canonical = f"https://timezonebudy.com/location/{cslug}/"
    cont = g(country,"continent","Asia")

    cities = sorted(CITIES_BY_COUNTRY.get(cslug, []),
                    key=lambda c: -int(c.get("population") or 0))
    city_cards = "".join(
        f'<a class="tzb-ncard" href="/location/{cslug}/{c["slug"]}/">'
        f'<div class="img"></div><div class="body">'
        f'<div class="nm">{esc(c["city"])}</div>'
        f'<div class="tm" data-tz="{esc(c["timezone"])}">--:--</div>'
        f'</div></a>' for c in cities)

    stat = lambda k,v: f'<div class="tzb-info-cell"><div class="k">{k}</div><div class="v">{v}</div></div>'
    info = "".join([
        stat("CAPITAL", esc(g(country,"capital_city"))),
        stat("UTC OFFSET", esc(country.get("primary_timezone","") or off)),
        stat("CURRENCY", f'{esc(g(country,"currency_symbol"))} {esc(g(country,"currency_code"))}'),
        stat("CURRENCY NAME", esc(g(country,"currency_name"))),
        stat("LANGUAGE", esc(g(country,"language"))),
        stat("DIAL CODE", esc(g(country,"dial_code"))),
    ])

    peers = [c for s,c in COUNTRIES.items()
             if c["continent"] == cont and s != cslug][:6]
    chips = "".join(
        f'<a class="tzb-chip" href="/location/{g(p,"slug")}/">{flag(g(p,"cca2","un"),20,14)}{esc(g(p,"country"))}</a>'
        for p in peers)

    body = f"""
<main class="wrap tzb-loc">
  <section class="tzb-hero tzb-hero-country">
    <div class="tzb-hero-in">
      <div class="tzb-hero-main">
        <nav class="tzb-crumb"><a href="/location/">Locations</a> › <span>{esc(cname)}</span></nav>
        {flag(cc,40,28)}
        <div class="tzb-eyebrow">Time &amp; Location Info</div>
        <h1 class="tzb-city">{esc(cname)}</h1>
        <div class="tzb-tzline">{esc(cont)} · Primary offset {esc(country.get("primary_timezone","") or off)}</div>
      </div>
    </div>
  </section>

  <section class="tzb-section"><div class="tzb-card tzb-info-grid">{info}</div></section>

  <section class="tzb-section">
    <div class="tzb-card card-pad">
      <h2 class="tzb-stitle"><span class="i">📍</span>Cities in {esc(cname)}</h2>
      <div class="tzb-nearby tzb-nearby-country">{city_cards or '<p class="muted">City pages coming soon.</p>'}</div>
    </div>
  </section>

  <section class="tzb-section tzb-two">
    <div class="tzb-card card-pad">
      <h2 class="tzb-stitle"><span class="i">🌏</span>More Countries in {esc(cont)}</h2>
      <div class="tzb-chips">{chips}</div>
    </div>
    <div class="tzb-card card-pad seo-sec">
      <h2 class="tzb-stitle"><span class="i">ℹ️</span>About {esc(cname)}</h2>
      <p>{esc(cname)} is in {esc(cont)} and uses {esc(g(country,"currency_name"))} ({esc(g(country,"currency_code"))}) with {esc(g(country,"language"))} widely spoken. Browse any city above for live local time, weather, and sun &amp; moon details.</p>
    </div>
  </section>

  <section class="tzb-section">
    <div class="tzb-cta">
      <h3>🌐 Explore More Locations Worldwide</h3>
      <p>Find current time, weather, and more for any city around the world.</p>
      <form class="tzb-search" role="search" onsubmit="return false">
        <input placeholder="Search for a city, country or time zone...">
        <button type="submit" aria-label="Search">🔍</button>
      </form>
    </div>
  </section>
</main>
"""
    page = head(f"Time in {cname} | TimezoneBudy",
                f"Local time, cities, currency and dial code for {cname}. {cont}.",
                canonical) + body + FOOTER
    path = os.path.join(OUT, "location", cslug, "index.html")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(page)

def offset_str_from_utc(s):
    return s or "UTC+00:00"

# ---------------------------------------------------------------- run
def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    n_country = n_city = 0
    for slug, country in COUNTRIES.items():
        build_country(country); n_country += 1
        for city in CITIES_BY_COUNTRY.get(slug, []):
            build_city(city, country); n_city += 1
    print(f"Built {n_country} country pages and {n_city} city pages -> {OUT}/location/")

if __name__ == "__main__":
    main()
