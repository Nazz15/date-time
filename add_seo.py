r"""
add_seo.py
Injects unique, GEO/LLM-optimised SEO content into every city and country
page under location/. Reads countries_v2.csv and cities.csv for rich,
accurate data — no guesswork.

Run from repo root:
  cd C:\Users\manka\OneDrive\Documents\GitHub\date-time
  python add_seo.py

Place cities.csv and countries_v2.csv in the same folder as this script.
Safe to re-run (idempotency marker prevents double-injection).
"""

import os, re, csv, json

REPO_ROOT    = os.path.dirname(os.path.abspath(__file__))
LOC_DIR      = os.path.join(REPO_ROOT, 'location')
GUARD        = 'seo_inject_v1'
ANCHOR       = '</main>'
SKIP_DIRS    = {'node_modules', '.git', '__pycache__'}

COUNTRIES_CSV = os.path.join(REPO_ROOT, 'countries_v2.csv')
CITIES_CSV    = os.path.join(REPO_ROOT, 'cities.csv')

# ── Load CSV data ─────────────────────────────────────────────────────────────
def load_csv(path):
    if not os.path.exists(path):
        print(f'WARNING: {path} not found')
        return []
    with open(path, newline='', encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))

countries_raw = load_csv(COUNTRIES_CSV)
cities_raw    = load_csv(CITIES_CSV)

# Index by slug for fast lookup
COUNTRIES = {r['slug'].strip().lower(): r for r in countries_raw}
CITIES    = {r['slug'].strip().lower(): r for r in cities_raw}

print(f'Loaded {len(COUNTRIES)} countries, {len(CITIES)} cities from CSV')

# ── Helpers ───────────────────────────────────────────────────────────────────
def natural_join(items):
    items = [s.strip() for s in items if s.strip()]
    if len(items) == 1: return items[0]
    return ', '.join(items[:-1]) + ' and ' + items[-1]

def fmt_population(n):
    try:
        n = int(n)
        if n >= 1_000_000: return f'{n/1_000_000:.1f} million'
        if n >= 1_000:     return f'{n/1_000:.0f},000'
        return str(n)
    except: return n

def fmt_area(n):
    try: return f'{int(n):,} km²'
    except: return n

def lang_list(lang_str):
    """'Hindi/English' → ['Hindi', 'English']"""
    return [l.strip() for l in re.split(r'[/,]', lang_str) if l.strip()]

def dst_mentions_no_dst(dst_note):
    return 'does not observe' in dst_note.lower() or 'no daylight' in dst_note.lower()

# ── SEO CSS (appended to location.css once) ───────────────────────────────────
SEO_CSS = '''
/* ── SEO content section (injected by add_seo.py) ───────────────────────── */
.loc-seo-section{padding:32px 0 8px;border-top:1px solid var(--clr-border);margin-top:32px;}
.loc-seo-inner{max-width:860px;}
.loc-seo-p{font-size:14px;line-height:1.8;color:var(--clr-text2);margin-bottom:14px;}
.loc-seo-p code,.loc-seo-p strong{color:var(--clr-text);}
.loc-seo-p code{background:var(--clr-bg2);border:1px solid var(--clr-border);border-radius:4px;padding:1px 6px;font-size:12px;}
.faq-list{display:flex;flex-direction:column;gap:14px;margin-bottom:8px;}
.faq-item{border:1px solid var(--clr-border);border-radius:var(--rlg);padding:16px 18px;background:var(--clr-bg2);}
.faq-q{font-size:14px;font-weight:700;color:var(--clr-text);margin:0 0 8px;}
.faq-a p{font-size:13px;line-height:1.75;color:var(--clr-text2);margin:0;}
@media(max-width:640px){
  .loc-seo-section{padding:20px 0 4px;}
  .faq-item{padding:12px 14px;}
  .faq-q{font-size:13px;}
}
'''

# ── Country page SEO ──────────────────────────────────────────────────────────
def country_seo(c):
    name      = c['country']
    capital   = c['capital_city']
    currency  = f"{c['currency_name']} ({c['currency_code']}, {c['currency_symbol']})"
    langs     = natural_join(lang_list(c['language']))
    n_zones   = c['num_timezones']
    primary_tz= c['primary_timezone']
    famous    = c['famous_for']
    best_time = c['best_time_to_visit']
    visa      = c['visa_info']
    dst_note  = c['dst_note']
    pop       = fmt_population(c['population'])
    area      = fmt_area(c['area_km2'])
    flag      = c['flag_emoji']
    tz_list   = [t.strip() for t in c['timezones_list'].split(',')]
    zone_word = 'time zone' if int(n_zones) == 1 else 'time zones'
    no_dst    = dst_mentions_no_dst(dst_note)

    tz_display = ', '.join(f'<code>{z}</code>' for z in tz_list[:6])
    if len(tz_list) > 6:
        tz_display += f' and {len(tz_list)-6} more'

    faqs = [
        {
            'q': f'What time zone does {name} use?',
            'a': f'{name} {"uses a single time zone" if int(n_zones)==1 else f"spans {n_zones} time zones"}. The primary offset is <strong>{primary_tz}</strong>. {dst_note}'
        },
        {
            'q': f'What is {name} known for?',
            'a': f'{name} is renowned for {famous}. With a population of approximately {pop} and a total area of {area}, it is one of the significant nations in {c["continent"]}.'
        },
        {
            'q': f'When is the best time to visit {name}?',
            'a': f'The best time to visit {name} is {best_time}. Travellers should also check current entry requirements before planning a trip: {visa}.'
        },
        {
            'q': f'What currency does {name} use?',
            'a': f'{name} uses the {currency}. When making international transfers or payments, time zone differences between {name} and other countries can affect banking hours and transaction timing.'
        },
        {
            'q': f'How do I convert time between {name} and another country?',
            'a': f'Use the TimezoneBudy Time Zone Converter to compare {name} ({primary_tz}) with any city worldwide. The tool highlights business-hours overlap and calculates the exact time difference instantly.'
        },
        {
            'q': f'Does {name} observe Daylight Saving Time?',
            'a': dst_note
        },
    ]

    faq_schema = ','.join(
        f'{{"@type":"Question","name":{json.dumps(f["q"])},"acceptedAnswer":{{"@type":"Answer","text":{json.dumps(re.sub("<[^>]+>","",f["a"]))}}}}}'
        for f in faqs
    )
    faq_html = '\n'.join(f'''<div class="faq-item" itemscope itemtype="https://schema.org/Question">
  <h3 class="faq-q" itemprop="name">{f["q"]}</h3>
  <div class="faq-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
    <p itemprop="text">{f["a"]}</p>
  </div>
</div>''' for f in faqs)

    return f'''
<!-- {GUARD} -->
<section class="loc-seo-section" aria-label="About time zones in {name}">
  <div class="loc-seo-inner">

    <h2 class="loc-h2">Time Zones in {flag} {name}</h2>
    <p class="loc-seo-p">{name} {"observes a single national time zone" if int(n_zones)==1 else f"spans {n_zones} distinct time zones"} with a primary UTC offset of <strong>{primary_tz}</strong>. The capital city, <strong>{capital}</strong>, serves as the administrative and political centre of the country. {dst_note}</p>

    <p class="loc-seo-p">The country is famous for {famous}. The IANA time zone {"identifier" if int(n_zones)==1 else "identifiers"} used by {name} {"is" if int(n_zones)==1 else "include"} {tz_display}. These identifiers are the global standard used by operating systems, programming languages, and scheduling platforms worldwide.</p>

    <h2 class="loc-h2">Key Facts — {name}</h2>
    <div class="loc-stat-grid" style="margin-bottom:20px">
      <div class="loc-stat"><div class="loc-stat-lbl">Capital</div><div class="loc-stat-val">{capital}</div></div>
      <div class="loc-stat"><div class="loc-stat-lbl">Primary UTC Offset</div><div class="loc-stat-val">{primary_tz}</div></div>
      <div class="loc-stat"><div class="loc-stat-lbl">Time Zones</div><div class="loc-stat-val">{n_zones}</div></div>
      <div class="loc-stat"><div class="loc-stat-lbl">Currency</div><div class="loc-stat-val">{c["currency_name"]} ({c["currency_symbol"]})</div></div>
      <div class="loc-stat"><div class="loc-stat-lbl">Language</div><div class="loc-stat-val">{langs}</div></div>
      <div class="loc-stat"><div class="loc-stat-lbl">Population</div><div class="loc-stat-val">{pop}</div></div>
    </div>

    <h2 class="loc-h2">Best Time to Visit {name}</h2>
    <p class="loc-seo-p">The ideal time to travel to {name} is {best_time}. For entry requirements: {visa}.</p>

    <h2 class="loc-h2">Frequently Asked Questions</h2>
    <div class="faq-list" itemscope itemtype="https://schema.org/FAQPage">
{faq_html}
    </div>

    <h2 class="loc-h2">More Time Zone Tools</h2>
    <div class="loc-chip-row">
      <a href="/" class="loc-chip"><i class="ti ti-clock"></i> World Clock</a>
      <a href="/converter.html" class="loc-chip"><i class="ti ti-arrows-exchange"></i> Converter</a>
      <a href="/time-difference-calculator" class="loc-chip"><i class="ti ti-chart-bar"></i> Time Difference</a>
      <a href="/world-time-map" class="loc-chip"><i class="ti ti-map"></i> World Map</a>
      <a href="/weather.html" class="loc-chip"><i class="ti ti-cloud"></i> Weather</a>
    </div>

  </div>
</section>
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{faq_schema}]}}
</script>
'''

# ── City page SEO ─────────────────────────────────────────────────────────────
def city_seo(city_data, country_data):
    city    = city_data['city']
    country = country_data['country']
    tz      = city_data['timezone']
    pop     = fmt_population(city_data['population'])
    capital = country_data['capital_city']
    dst_note= country_data['dst_note']
    famous  = country_data['famous_for']
    visa    = country_data['visa_info']
    currency= f"{country_data['currency_name']} ({country_data['currency_symbol']})"
    flag    = country_data['flag_emoji']
    no_dst  = dst_mentions_no_dst(dst_note)

    is_capital = city.lower() == capital.lower()
    capital_note = f' As the capital of {country}, {city} is the country\'s political and administrative hub.' if is_capital else ''

    # Build UTC offset display from IANA tz (approximate from country primary if not in map)
    utc_map = {
        'Asia/Kolkata':'+05:30','Asia/Tokyo':'+09:00','America/New_York':'-05:00',
        'America/Los_Angeles':'-08:00','America/Chicago':'-06:00','Europe/London':'+00:00',
        'Europe/Paris':'+01:00','Europe/Berlin':'+01:00','Asia/Dubai':'+04:00',
        'Asia/Singapore':'+08:00','Asia/Shanghai':'+08:00','Australia/Sydney':'+10:00',
        'America/Sao_Paulo':'-03:00','America/Toronto':'-05:00','America/Mexico_City':'-06:00',
        'Africa/Cairo':'+02:00','Africa/Lagos':'+01:00','Africa/Nairobi':'+03:00',
        'Asia/Riyadh':'+03:00','Asia/Bangkok':'+07:00','Asia/Karachi':'+05:00',
        'Asia/Dhaka':'+06:00','Asia/Jakarta':'+07:00','Asia/Seoul':'+09:00',
        'Asia/Taipei':'+08:00','Asia/Hong_Kong':'+08:00','Asia/Kuala_Lumpur':'+08:00',
        'Asia/Colombo':'+05:30','Asia/Kathmandu':'+05:45','Asia/Kabul':'+04:30',
        'Asia/Tehran':'+03:30','Asia/Baghdad':'+03:00','Asia/Beirut':'+02:00',
        'Asia/Tbilisi':'+04:00','Asia/Baku':'+04:00','Asia/Almaty':'+05:00',
        'Asia/Tashkent':'+05:00','Asia/Ulaanbaatar':'+08:00','Asia/Manila':'+08:00',
        'Europe/Moscow':'+03:00','Europe/Istanbul':'+03:00','Europe/Kyiv':'+02:00',
        'Europe/Warsaw':'+01:00','Europe/Rome':'+01:00','Europe/Madrid':'+01:00',
        'Europe/Amsterdam':'+01:00','Europe/Stockholm':'+01:00','Europe/Oslo':'+01:00',
        'Europe/Copenhagen':'+01:00','Europe/Helsinki':'+02:00','Europe/Athens':'+02:00',
        'Europe/Bucharest':'+02:00','Europe/Lisbon':'+00:00','Europe/Dublin':'+00:00',
        'Africa/Johannesburg':'+02:00','Africa/Casablanca':'+01:00','Africa/Accra':'+00:00',
        'Pacific/Auckland':'+12:00','Pacific/Honolulu':'-10:00','America/Anchorage':'-09:00',
        'America/Denver':'-07:00','America/Phoenix':'-07:00','America/Vancouver':'-08:00',
        'America/Argentina/Buenos_Aires':'-03:00','America/Lima':'-05:00',
        'America/Bogota':'-05:00','America/Santiago':'-04:00','America/Caracas':'-04:00',
        'Australia/Melbourne':'+10:00','Australia/Brisbane':'+10:00','Australia/Perth':'+08:00',
        'Australia/Adelaide':'+09:30',
    }
    utc_off = 'UTC' + utc_map.get(tz, country_data['primary_timezone'].replace('UTC',''))

    faqs = [
        {
            'q': f'What is the current local time in {city}?',
            'a': f'The current local time in {city} is shown live at the top of this page, updated every second. {city} uses the <strong>{tz}</strong> time zone, which is <strong>{utc_off}</strong> from Coordinated Universal Time (UTC).'
        },
        {
            'q': f'What time zone does {city} use?',
            'a': f'{city} uses the IANA time zone identifier <strong>{tz}</strong>. {dst_note}'
        },
        {
            'q': f'How far ahead or behind GMT is {city}?',
            'a': f'{city} is {utc_off} relative to UTC/GMT. {"This offset is fixed and does not change throughout the year." if no_dst else "This offset may change during Daylight Saving Time. The live clock above always reflects the current correct local time."}'
        },
        {
            'q': f'What is {city} known for?',
            'a': f'{city} is a major city in {country}, a country famous for {famous}.{capital_note} With a population of approximately {pop}, it is one of the significant urban centres in the country.'
        },
        {
            'q': f'How do I convert time from {city} to another city?',
            'a': f'Use the TimezoneBudy Time Zone Converter to compare {city} ({utc_off}) with any other city in the world. The tool shows the exact time difference and highlights business-hours overlap, making it easy to schedule international meetings and calls.'
        },
    ]

    faq_schema = ','.join(
        f'{{"@type":"Question","name":{json.dumps(f["q"])},"acceptedAnswer":{{"@type":"Answer","text":{json.dumps(re.sub("<[^>]+>","",f["a"]))}}}}}'
        for f in faqs
    )
    faq_html = '\n'.join(f'''<div class="faq-item" itemscope itemtype="https://schema.org/Question">
  <h3 class="faq-q" itemprop="name">{f["q"]}</h3>
  <div class="faq-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
    <p itemprop="text">{f["a"]}</p>
  </div>
</div>''' for f in faqs)

    return f'''
<!-- {GUARD} -->
<section class="loc-seo-section" aria-label="About {city} time zone">
  <div class="loc-seo-inner">

    <h2 class="loc-h2">Current Time in {flag} {city}, {country}</h2>
    <p class="loc-seo-p">{city} is a major city in {country} operating on the <strong>{tz}</strong> time zone, <strong>{utc_off}</strong> from UTC.{capital_note} The live clock above shows the exact current local time in {city}, updated every second in your browser without requiring a page refresh.</p>

    <p class="loc-seo-p">{dst_note} The IANA time zone identifier <code>{tz}</code> is the global standard reference used by operating systems, programming languages, calendar applications, and international scheduling tools to unambiguously represent time in {city}.</p>

    <h2 class="loc-h2">Time Zone Details — {city}</h2>
    <div class="loc-stat-grid" style="margin-bottom:20px">
      <div class="loc-stat"><div class="loc-stat-lbl">UTC Offset</div><div class="loc-stat-val">{utc_off}</div></div>
      <div class="loc-stat"><div class="loc-stat-lbl">IANA Time Zone</div><div class="loc-stat-val" style="font-size:12px">{tz}</div></div>
      <div class="loc-stat"><div class="loc-stat-lbl">Country</div><div class="loc-stat-val">{country}</div></div>
      <div class="loc-stat"><div class="loc-stat-lbl">Population</div><div class="loc-stat-val">{pop}</div></div>
      <div class="loc-stat"><div class="loc-stat-lbl">Currency</div><div class="loc-stat-val">{currency}</div></div>
      <div class="loc-stat"><div class="loc-stat-lbl">Best to Visit</div><div class="loc-stat-val" style="font-size:11px">{country_data["best_time_to_visit"][:40]}…</div></div>
    </div>

    <h2 class="loc-h2">Frequently Asked Questions</h2>
    <div class="faq-list" itemscope itemtype="https://schema.org/FAQPage">
{faq_html}
    </div>

    <h2 class="loc-h2">More Time Zone Tools</h2>
    <div class="loc-chip-row">
      <a href="/" class="loc-chip"><i class="ti ti-clock"></i> World Clock</a>
      <a href="/converter.html" class="loc-chip"><i class="ti ti-arrows-exchange"></i> Converter</a>
      <a href="/time-difference-calculator" class="loc-chip"><i class="ti ti-chart-bar"></i> Time Difference</a>
      <a href="/world-time-map" class="loc-chip"><i class="ti ti-map"></i> World Map</a>
      <a href="/weather.html" class="loc-chip"><i class="ti ti-cloud"></i> Weather</a>
    </div>

  </div>
</section>
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{faq_schema}]}}
</script>
'''

# ── Extract page data from HTML ───────────────────────────────────────────────
def extract_slugs(filepath):
    """Return (country_slug, city_slug_or_None) from file path."""
    rel   = os.path.relpath(filepath, LOC_DIR)
    parts = [p for p in rel.replace('\\','/').split('/') if p and p != 'index.html']
    if len(parts) == 1:
        return parts[0], None       # country page
    elif len(parts) >= 2:
        return parts[0], parts[1]   # city page
    return None, None

# ── Main loop ─────────────────────────────────────────────────────────────────
patched, skipped, errors = [], [], []

for dirpath, dirnames, filenames in os.walk(LOC_DIR):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    if os.path.normpath(dirpath) == os.path.normpath(LOC_DIR):
        continue  # skip top-level location/index.html

    for fname in filenames:
        if fname != 'index.html':
            continue

        fpath = os.path.join(dirpath, fname)
        rel   = os.path.relpath(fpath, REPO_ROOT)

        try:
            content = open(fpath, 'r', encoding='utf-8', errors='replace').read()
        except Exception as e:
            errors.append(f'{rel}: read: {e}'); continue

        if GUARD in content:
            skipped.append(rel); continue

        if ANCHOR not in content:
            errors.append(f'{rel}: no </main>'); continue

        country_slug, city_slug = extract_slugs(fpath)
        if not country_slug:
            errors.append(f'{rel}: could not determine slug'); continue

        c_data = COUNTRIES.get(country_slug)
        if not c_data:
            errors.append(f'{rel}: country slug "{country_slug}" not in CSV — skipping'); continue

        try:
            if city_slug:
                city_data = CITIES.get(city_slug)
                if not city_data:
                    # Fallback: minimal city data from country + HTML title
                    title_m = re.search(r'Current Time in ([^|<\-–]+)', content)
                    city_name = title_m.group(1).strip() if title_m else slug_to_name(city_slug)
                    tz_m = re.search(r'data-tz="([^"]+)"', content)
                    tz   = tz_m.group(1) if tz_m else c_data['primary_timezone'].replace('UTC','UTC')
                    city_data = {'city': city_name, 'country_slug': country_slug,
                                 'timezone': tz, 'population': '0', 'slug': city_slug}
                seo = city_seo(city_data, c_data)
            else:
                seo = country_seo(c_data)
        except Exception as e:
            errors.append(f'{rel}: generation error: {e}'); continue

        new_content = content.replace(ANCHOR, seo + '\n' + ANCHOR, 1)
        try:
            open(fpath, 'w', encoding='utf-8').write(new_content)
            patched.append(rel)
        except Exception as e:
            errors.append(f'{rel}: write: {e}')

def slug_to_name(slug):
    return ' '.join(w.capitalize() for w in slug.replace('-',' ').split())

# ── Append CSS once ───────────────────────────────────────────────────────────
loc_css = os.path.join(REPO_ROOT, 'location.css')
if os.path.exists(loc_css):
    css_content = open(loc_css, 'r', encoding='utf-8').read()
    if 'loc-seo-section' not in css_content:
        open(loc_css, 'a', encoding='utf-8').write(SEO_CSS)
        print('Appended SEO styles → location.css')
    else:
        print('location.css already has SEO styles — skipped')
else:
    print(f'WARNING: location.css not found')

# ── Summary ───────────────────────────────────────────────────────────────────
print(f'\n✅ Patched:  {len(patched)} pages')
print(f'⏭  Skipped:  {len(skipped)} pages (already done)')
if errors:
    print(f'⚠️  Issues:   {len(errors)}')
    for e in errors[:30]: print(f'   {e}')
else:
    print('✔  No errors.')
print('\nDelete this script + CSVs from repo root, then commit:')
print('"Add rich SEO/FAQ content to all location pages from CSV data"')
