#!/usr/bin/env python3
"""
TimezoneBuddy — Holiday Calendar generator (Phase 1)
Builds /holiday/index.html and /holiday/{country}/index.html from the open-source
`holidays` library (+ a small curated layer of cultural/religious observances),
and writes a validation report cross-checked against `workalendar`.

Usage (from the repo root):
    pip install holidays workalendar
    python build_holidays.py              # writes holiday/… and holiday-validation-report.md
Re-run each year (or when governments announce changes) and commit the output.
"""
import datetime as dt, html, json, os, re, sys
from collections import OrderedDict
import holidays
from holidays.calendars.islamic import _IslamicLunar
from dateutil.easter import easter

YEARS = [2026, 2027, 2028]          # selector years; first two are written into the HTML for SEO
SEO_YEARS = YEARS[:2]
BUILD = dt.date.today()
ROOT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.getcwd()
REPORT = os.path.join(sys.argv[2] if len(sys.argv) > 2 else ROOT, 'holiday-validation-report.md')
SITE = 'https://timezonebudy.com'

C = OrderedDict([
  ('US', dict(slug='united-states', name='United States', short='the US', cc='us', cont='na', lang='en_US', rl='State',
     title='US Holidays 2026 & 2027 — Federal, State & Public Holidays', h1='US Holidays 2026 & 2027',
     lede='Federal holidays, state holidays and popular observances across the United States.', nat='Federal (nationwide)')),
  ('GB', dict(slug='united-kingdom', name='United Kingdom', short='the UK', cc='gb', cont='eu', lang='en_GB', rl='Nation',
     title='UK Bank Holidays 2026 & 2027 — England, Wales, Scotland & Northern Ireland', h1='UK Bank Holidays 2026 & 2027',
     lede='Bank holidays for England & Wales, Scotland and Northern Ireland, plus key observances.', nat='All of the UK')),
  ('IN', dict(slug='india', name='India', short='India', cc='in', cont='as', lang='en_IN', rl='State',
     title='Holidays in India 2026 & 2027 — Gazetted, Restricted & State Holidays', h1='Holidays in India 2026 & 2027',
     lede='Gazetted (public) holidays, restricted holidays, state holidays and major festivals.', nat='Nationwide')),
  ('CA', dict(slug='canada', name='Canada', short='Canada', cc='ca', cont='na', lang='en_CA', rl='Province',
     title='Canada Holidays 2026 & 2027 — Statutory, Federal & Provincial', h1='Canada Holidays 2026 & 2027',
     lede='Federal statutory holidays plus holidays by province and territory, and key observances.', nat='Federal statutory holiday')),
  ('AU', dict(slug='australia', name='Australia', short='Australia', cc='au', cont='oc', lang='en_AU', rl='State',
     title='Public Holidays in Australia 2026 & 2027 — By State & Territory', h1='Australia Public Holidays 2026 & 2027',
     lede='National public holidays plus state and territory holidays across Australia.', nat='Nationwide')),
  ('AE', dict(slug='united-arab-emirates', name='United Arab Emirates', short='the UAE', cc='ae', cont='as', lang='en_US', rl='Emirate',
     title='UAE Public Holidays 2026 & 2027 — Eid, National Day & More', h1='UAE Public Holidays 2026 & 2027',
     lede='Official public holidays in the UAE, including Eid dates (estimated until announced).', nat='Nationwide')),
  ('DE', dict(slug='germany', name='Germany', short='Germany', cc='de', cont='eu', lang='en_US', rl='State',
     title='Public Holidays in Germany 2026 & 2027 (Feiertage) — By State', h1='Germany Public Holidays 2026 & 2027',
     lede='Nationwide public holidays (Feiertage) and holidays in individual German states.', nat='Nationwide')),
  ('JP', dict(slug='japan', name='Japan', short='Japan', cc='jp', cont='as', lang='en_US', rl='Region',
     title='Japan National Holidays 2026 & 2027 — Golden Week & Bank Holidays', h1='Japan Holidays 2026 & 2027',
     lede='National holidays, substitute holidays, bank holidays and cultural festivals in Japan.', nat='Nationwide')),
  ('BR', dict(slug='brazil', name='Brazil', short='Brazil', cc='br', cont='sa', lang='en_US', rl='State',
     title='Brazil Public Holidays 2026 & 2027 (Feriados) — National & State', h1='Brazil Holidays 2026 & 2027',
     lede='National holidays (feriados), state holidays and optional days like Carnival.', nat='Nationwide')),
  ('ZA', dict(slug='south-africa', name='South Africa', short='South Africa', cc='za', cont='af', lang=None, rl='Province',
     title='South Africa Public Holidays 2026 & 2027', h1='South Africa Public Holidays 2026 & 2027',
     lede='Official public holidays in South Africa, including Sunday substitute days, plus key observances.', nat='Nationwide')),
])
CONT = [('all','All'),('na','North America'),('sa','South America'),('eu','Europe'),('as','Asia & Middle East'),('af','Africa'),('oc','Oceania')]

NAT = re.compile(r"Independence|National Day|Republic Day|Constitution|Australia Day|Canada Day|German Unity|Unity Day|Freedom Day|Foundation Day|Proclamation|Tiradentes|Emperor'?s Birthday|Sh[oō]wa Day|King'?s Birthday|Queen'?s Birthday|Sovereign|Victoria Day|Juneteenth|Memorial Day|Veterans Day|Remembrance Day|Commemoration Day|Martyr|Gandhi|Heritage Day|Youth Day|Human Rights Day|Reconciliation|National Women|Black Consciousness|Washington'?s Birthday|Martin Luther King|Columbus Day|Indigenous Peoples|Ambedkar|Labour Day|Labor Day|Workers'? Day|May Day", re.I)
REL = re.compile(r"Christmas|Easter|Good Friday|Holy |Maundy|Ascension|Whit|Pentecost|Corpus Christi|Assumption|All Saints|All Souls|Epiphany|Reformation|Repentance|Immaculate|Our Lady|Aparecida|Eid|Id-ul|Islamic|Hijri|Muharram|Ashura|Prophet|Milad|Isra|Mi'?raj|Arafat|Ramadan|Diwali|Deepavali|\bHoli\b|Holika|Dussehra|Vijaya|Durga|Navami|Navratri|Janmashtami|Shivaratri|Ganesh|Mahavir|Buddha|Guru|Raksha|Hanukkah|Yom |Passover|Rosh|Vesak|Chhath|Karva|Krishna|Bakrid|Zuha|Fitr|Adha|Shab|Saint|St\.? |Bhai|Govardhan|Lakshmi|Mahalaya|Ratha|Ram Navami|Hazarat|Jamat|Easter", re.I)
CUL = re.compile(r"Carnival|Carnaval|Lunar New Year|Chinese New Year|Thanksgiving|Halloween|Valentine|Mother'?s Day|Mothering|Father'?s Day|Pongal|Bihu|Onam|Makar Sankranti|Vaisakhi|Baisakhi|Gudi Padwa|Ugadi|Cheti Chand|Burns Night|Bonfire|Guy Fawkes|Tanabata|Shichi|Hogmanay|New Year'?s Eve|Groundhog|Andrew|Patrick|David|George|Boxing Day|Lohri|Shrove|Pancake|Black Friday|Namorados|Rose Monday|Martin'?s Day|Melbourne Cup|Family Day|Civic|Golden Week|Coming of Age|Children'?s Day|Culture Day|Mountain Day|Marine Day|Sea Day|Respect for the Aged|Sports Day|Greenery|Labour Thanksgiving|Vernal Equinox|Autumnal Equinox", re.I)
NOTE = {'optional':'Restricted / optional holiday','optional_women':'Optional holiday for women employees','government':'Government offices closed','half_day':'Half day','unofficial':'','bank':'Banks closed','catholic':''}

def nth_weekday(y, m, wd, n):          # wd: Mon=0…Sun=6 ; n=1.. ; n=-1 last
    if n > 0:
        d = dt.date(y, m, 1); d += dt.timedelta((wd - d.weekday()) % 7); return d + dt.timedelta(7*(n-1))
    d = dt.date(y, m+1, 1) - dt.timedelta(1) if m < 12 else dt.date(y, 12, 31); return d - dt.timedelta((d.weekday() - wd) % 7)

_cache = {}
def lib(cc, years, **kw):
    key = (cc, tuple(years), tuple(sorted(kw.items())))
    if key not in _cache: _cache[key] = holidays.country_holidays(cc, years=years, **kw)
    return _cache[key]
def named(cc, pat, y, **kw):
    h = lib(cc, [y], language='en_US', **kw)
    for d, n in sorted(h.items()):
        if re.search(pat, n, re.I): return d, '(estimated)' in n
    return None, False

def curated(cc, y):
    """Cultural / religious / observance days that official lists don't include. (name, date, tags, est, regions)"""
    out = []
    E = easter(y)
    add = lambda n, d, t, e=False, r=None: d and out.append((n, d, t, e, r))
    if cc != 'US': add("New Year's Eve", dt.date(y,12,31), ['observance','cultural'])
    add("International Women's Day", dt.date(y,3,8), ['observance'])
    if cc in ('GB','CA','AU','IN','JP','ZA','DE'): add("Valentine's Day", dt.date(y,2,14), ['cultural','observance'])
    md = {'GB': E - dt.timedelta(21), 'AE': dt.date(y,3,21)}.get(cc, nth_weekday(y,5,6,2) if cc not in ('US',) else None)
    if md: add("Mothering Sunday" if cc=='GB' else "Mother's Day", md, ['cultural','observance'])
    fd = {'AU': nth_weekday(y,9,6,1), 'BR': nth_weekday(y,8,6,2)}.get(cc, nth_weekday(y,6,6,3) if cc in ('GB','CA','IN','JP','ZA') else None)
    if fd: add("Father's Day", fd, ['cultural','observance'])
    if cc in ('GB','CA'): add("Halloween", dt.date(y,10,31), ['cultural','observance'])
    for d, est in _IslamicLunar().ramadan_beginning_dates(y):
        if d.year == y: add("Ramadan begins", d, ['religious','observance'], est)
    if cc in ('US','GB','CA','AU','DE','JP','BR','ZA'):
        d, e = named('AE', r'Fitr', y); add("Eid al-Fitr", d, ['religious','cultural'], True)
        d, e = named('AE', r'Adha', y); add("Eid al-Adha", d, ['religious','cultural'], True)
    if cc in ('US','GB','CA','AU','ZA'):
        d, e = named('IN', r'^Diwali|Deepavali', y); add("Diwali", d, ['religious','cultural'])
    if cc in ('US','GB','CA','AU'):
        d, e = named('IN', r'^Holi$', y); add("Holi", d, ['religious','cultural'])
        d, e = named('SG', r'Chinese New Year', y); add("Lunar New Year", d, ['cultural'])
        d, e = named('IL', r'Hanukkah', y, categories=('optional','public','school')) if 'IL' in holidays.list_supported_countries() else (None, False)
        add("Hanukkah begins", d, ['religious','cultural'])
    if cc == 'GB':
        add("Burns Night", dt.date(y,1,25), ['cultural'], False, ['SCT'])
        add("Shrove Tuesday (Pancake Day)", E - dt.timedelta(47), ['cultural','religious'])
        add("Guy Fawkes Night", dt.date(y,11,5), ['cultural'])
        add("Remembrance Sunday", nth_weekday(y,11,6,2), ['national','observance'])
    if cc == 'US':
        add("Black Friday", nth_weekday(y,11,3,4) + dt.timedelta(1), ['observance'])
    if cc == 'DE':
        add("Rose Monday (Carnival)", E - dt.timedelta(48), ['cultural'])
        add("St. Martin's Day", dt.date(y,11,11), ['cultural','religious'])
        add("Christmas Eve", dt.date(y,12,24), ['religious','observance'])
    if cc == 'JP':
        add("Tanabata", dt.date(y,7,7), ['cultural'])
        add("Shichi-Go-San", dt.date(y,11,15), ['cultural'])
    if cc == 'BR':
        add("Valentine's Day (Dia dos Namorados)", dt.date(y,6,12), ['cultural','observance'])
    if cc == 'AU':
        add("Halloween", dt.date(y,10,31), ['cultural','observance'])
    return out

def clean(n):
    est = '(estimated)' in n
    n = re.sub(r'\s*\(estimated\)', '', n).strip()
    return n, est

def tags_for(cc, name, cats, regional):
    t = []
    if 'public' in cats: t.append('public')
    if 'bank' in cats or (cc == 'GB' and 'public' in cats) or (cc == 'US' and 'public' in cats and not regional and 'Inauguration' not in name):
        t.append('bank')
    if cats & {'optional','optional_women','government','unofficial','half_day'} and 'public' not in cats: t.append('observance')
    if NAT.search(name): t.append('national')
    if REL.search(name) and not re.search(r'Ambedkar|Gandhi|Labour Thanksgiving|Saint Andrew|St\.? Andrew', name): t.append('religious')
    if CUL.search(name): t.append('cultural')
    if not t: t.append('observance')
    return t

def build_country(cc, cfg):
    cls = holidays.country_holidays(cc).__class__
    cats = [c for c in getattr(cls, 'supported_categories', ('public',)) if c not in ('school','catholic','workday')]
    lang = cfg['lang'] if cfg['lang'] in getattr(cls, 'supported_languages', ()) else None
    kw = {'language': lang} if lang else {}
    subs = [s for s in getattr(cls, 'subdivisions', ()) if s != 'NSW Western']
    names = {}
    for alias, code in getattr(cls, 'subdivisions_aliases', {}).items():
        names.setdefault(code, alias)
    out = {}
    for y in YEARS:
        ent = OrderedDict()                       # (date, name) -> dict
        def put(d, n, t, est=False, region=None, note=''):
            k = (d.isoformat(), n, 'R' if region else 'N')   # regional and nationwide entries never merge
            if k in ent:
                e = ent[k]
                for x in t:
                    if x not in e['t']: e['t'].append(x)
                if region and region not in e['r']: e['r'].append(region)
                if note and not e.get('o'): e['o'] = note
                return
            e = {'d': d.isoformat(), 'n': n, 't': list(t)}
            if region: e['r'] = [region]
            if est: e['e'] = 1
            if note: e['o'] = note
            ent[k] = e
        nat_public = set()
        for cat in cats:
            for d, raw in lib(cc, [y], categories=(cat,), **kw).items():
                for part in raw.split('; '):
                    n, est = clean(part)
                    put(d, n, tags_for(cc, n, {cat}, False), est, None, NOTE.get(cat, ''))
                    if cat == 'public': nat_public.add((d, n))
        for s in subs:
            try: h = lib(cc, [y], subdiv=s, categories=('public',), **kw)
            except Exception: continue
            for d, raw in h.items():
                for part in raw.split('; '):
                    n, est = clean(part)
                    if (d, n) in nat_public: continue
                    put(d, n, tags_for(cc, n, {'public'}, True), est, s)
        existing = {(e['d'], e['n'].lower()) for e in ent.values() if 'r' not in e}
        existing_names = {(e['d'][:4], re.sub(r'[^a-z]', '', e['n'].lower())[:8]) for e in ent.values()}
        for n, d, t, est, regs in curated(cc, y):
            key8 = re.sub(r'[^a-z]', '', n.lower())[:8]
            if (d.isoformat(), n.lower()) in existing or any(k[1] == key8 and abs((dt.date.fromisoformat(e['d']) - d).days) < 3 for e in ent.values() for k in [(e['d'][:4], re.sub(r'[^a-z]', '', e['n'].lower())[:8])]):
                continue
            for r in (regs or [None]): put(d, n, t, est, r)
        for k in list(ent.keys()):
            e = ent[k]
            if 'r' in e:
                e['r'] = sorted(set(e['r']))
                if subs and len(e['r']) >= len(subs):
                    nk = (k[0], k[1], 'N')
                    if nk in ent:
                        for x in e['t']:
                            if x not in ent[nk]['t']: ent[nk]['t'].append(x)
                        del ent[k]
                    else: e.pop('r')
        for e in ent.values():
            if 'public' in e['t']:
                if 'observance' in e['t'] and len(e['t']) > 1: e['t'].remove('observance')
                if e.get('o') in ('Government offices closed', 'Restricted / optional holiday', 'Optional holiday for women employees'): e.pop('o')
        lst = sorted(ent.values(), key=lambda e: (e['d'], 0 if 'public' in e['t'] and 'r' not in e else 1, e['n']))
        out[y] = lst
    return out, {k: names.get(k, k) for k in subs}

# ---------------------------------------------------------------- templates
def esc(s): return html.escape(str(s), quote=True)
def ld(d): x = dt.date.fromisoformat(d); return x.strftime('%a %-d %b %Y')
def ldn(d): x = dt.date.fromisoformat(d); return x.strftime('%A, %-d %B %Y')

def head(title, desc, canon, extra=''):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<script>
(function(){{var s=localStorage.getItem('wc_theme');var d=s==='dark'||(!s&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}})();
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canon}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/css/flag-icons.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.11.0/dist/tabler-icons.min.css">
<link rel="stylesheet" href="/main.css">
<link rel="stylesheet" href="/footer.css">
<link rel="stylesheet" href="/holiday/holiday.css?v=1">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0d2240">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
{extra}
</head>
<body>
'''

DOCK = '''<nav class="v2-dock" aria-label="Quick tools">
  <a href="/world-clock/"><i class="ti ti-clock"></i>Clock</a>
  <a href="/converter"><i class="ti ti-arrows-exchange"></i>Convert</a>
  <a href="/time-difference-calculator"><i class="ti ti-arrows-left-right"></i>Difference</a>
  <a href="/holiday/" class="on" aria-current="page"><i class="ti ti-calendar-event"></i>Holidays</a>
  <a href="/weather/"><i class="ti ti-cloud"></i>Weather</a>
</nav>
'''
def tail(footer, data_js):
    return f'''{DOCK}{footer}
<div id="toast" role="status" aria-live="polite"></div>
<script src="/cities.js"></script>
<script src="/util.js?v=3"></script>
<script>{data_js}</script>
<script src="/holiday/holiday.js?v=1"></script>
<script>if(typeof boot==='function')try{{boot();}}catch(e){{}} HL_BOOT(); var fy=document.getElementById('wx-year');if(fy)fy.textContent=new Date().getFullYear();</script>
<script src="/nav.js?v=3"></script>
</body>
</html>
'''

def faq_html(qs):
    items = ''.join(f'<details{" open" if i == 0 else ""}><summary>{esc(q)}</summary><p>{a}</p></details>' for i, (q, a) in enumerate(qs))
    schema = json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r'<[^>]+>', '', a)}} for q, a in qs]}, ensure_ascii=False)
    return items, schema

CHIPS_PLACEHOLDER = '<div class="hl-chips" id="hlChips" role="group" aria-label="Filter by holiday type"></div>'
VIEWS = '<div class="hl-seg" id="hlViews" role="group" aria-label="View"><button type="button" data-view="calendar" aria-pressed="true">Calendar</button><button type="button" data-view="list" aria-pressed="false">List</button><button type="button" data-view="year" aria-pressed="false">Year</button></div>'

def country_page(cc, cfg, data, regions, footer, others):
    y0, y1 = SEO_YEARS
    natpub = {y: [e for e in data[y] if 'public' in e['t'] and 'r' not in e] for y in SEO_YEARS}
    # 2026 vs 2027 comparison table (nationwide public + nationwide religious/cultural)
    rows = OrderedDict()
    for y in SEO_YEARS:
        for e in data[y]:
            if 'r' in e: continue
            if not ({'public','bank','national','religious'} & set(e['t'])): continue
            k = re.sub(r'\s*\((observed|substitute.*|in lieu.*)\)', '', e['n'], flags=re.I)
            rows.setdefault(k, {}).setdefault(y, []).append(e)
    def cell(lst): return '<br>'.join(ld(e['d']) + (' <span class="hl-tag est">est.</span>' if e.get('e') else '') for e in lst) if lst else '—'
    trows = ''.join(f'<tr><th scope="row">{esc(k)}</th><td>{cell(v.get(y0))}</td><td>{cell(v.get(y1))}</td></tr>' for k, v in rows.items())
    est_any = any(e.get('e') for y in SEO_YEARS for e in data[y])
    nreg = len(regions)
    rl = cfg['rl'].lower()
    qs = [
      (f"How many public holidays are there in {cfg['short']} in {y0}?",
       f"There are {len(natpub[y0])} nationwide public holidays in {cfg['short']} in {y0} and {len(natpub[y1])} in {y1}"
       + (f", plus additional holidays that apply only in some {rl}s" if nreg else '') + ". Turn on the other categories above to also see religious and cultural festivals and observances."),
      (f"What are the public holidays in {cfg['short']} in {y1}?",
       ', '.join(f"{esc(e['n'])} ({dt.date.fromisoformat(e['d']).strftime('%-d %b')})" for e in natpub[y1]) + '.'),
    ]
    if nreg: qs.append((f"Are holidays different in each {rl}?",
       f"Yes. Some holidays only apply in certain {rl}s. Use the {cfg['rl']} selector at the top of the page to see the complete calendar for one {rl}, or choose “Nationwide only”."))
    if cc == 'GB': qs.append(("What is the difference between a bank holiday and a public holiday in the UK?",
       "In the UK the two terms are used interchangeably. Bank holidays are set separately for England & Wales, Scotland and Northern Ireland, which is why the lists differ slightly between nations."))
    if cc == 'IN': qs.append(("What is a restricted holiday in India?",
       "Restricted (optional) holidays are days that central government employees may choose to take from a published list, up to a limit each year. They are shown here as Observance with the note “Restricted / optional holiday”; gazetted holidays are shown as Public."))
    if est_any: qs.append(("Why are some dates marked “estimated”?",
       "Holidays based on the lunar calendar, such as Eid and other Islamic holidays, depend on moon sighting and are confirmed by the authorities shortly beforehand. We show the expected date and update it when the official date is announced."))
    qs.append(("Where does this holiday data come from?",
       f"Official holidays come from the open-source <a href=\"https://github.com/vacanza/holidays\" rel=\"nofollow noopener\">holidays</a> dataset, which follows government announcements, and are cross-checked against a second independent dataset. Cultural observances are added by our team. Last updated {BUILD.strftime('%-d %B %Y')}."))
    faqs, faq_schema = faq_html(qs)
    bc = json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Holidays", "item": SITE + "/holiday/"},
        {"@type": "ListItem", "position": 3, "name": cfg['name'], "item": f"{SITE}/holiday/{cfg['slug']}/"}]})
    desc = f"{cfg['lede']} Complete {y0} and {y1} calendar with dates, long weekends, regional holidays and add-to-calendar." if nreg else f"{cfg['lede']} Complete {y0} and {y1} calendar with dates, long weekends and add-to-calendar."
    extra = f'<script type="application/ld+json">{faq_schema}</script>\n<script type="application/ld+json">{bc}</script>'
    canon = f"{SITE}/holiday/{cfg['slug']}/"
    hol = {'slug': cfg['slug'], 'name': cfg['name'], 'short': cfg['short'], 'natLabel': cfg['nat'], 'regions': regions, 'years': {str(y): data[y] for y in YEARS}}
    others_html = ''.join(f'<a class="hl-cc" href="/holiday/{o["slug"]}/"><span class="fi fi-{o["cc"]}" aria-hidden="true"></span><span style="min-width:0"><b>{esc(o["name"])}</b><small>Holidays {y0} &amp; {y1}</small></span></a>' for o in others)
    reg_field = f'''<div class="hl-f" id="hlRegionF"><label for="hlRegion">{esc(cfg['rl'])}</label><select id="hlRegion"></select></div>'''
    body = f'''<nav class="topnav" aria-label="Main navigation"></nav>
<main>
<section class="hl-hero">
 <div class="hl-wrap hl-hero-grid">
  <div>
   <nav class="hl-crumb" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/holiday/">Holidays</a> › {esc(cfg['name'])}</nav>
   <h1><span class="fi fi-{cfg['cc']}" aria-hidden="true" style="width:34px;height:25px;border-radius:3px;vertical-align:-2px;margin-right:8px"></span>{esc(cfg['h1'])}</h1>
   <p class="hl-lede">{esc(cfg['lede'])} <span id="hlStat"></span></p>
   <div class="hl-next" id="hlNext" hidden></div>
  </div>
  <div class="hl-card">
   <div class="hl-row">
    {reg_field if nreg else '<div class="hl-f" id="hlRegionF" hidden><select id="hlRegion"></select></div>'}
    <div class="hl-f"><label for="hlYearSel">Year</label><select id="hlYearSel"></select></div>
   </div>
   <div class="hl-f"><label for="hlQ">Search holidays</label><input id="hlQ" type="search" autocomplete="off" placeholder="Name or date — e.g. “Christmas”, “May”, “25 Dec”"></div>
   <div class="hl-pop"><button type="button" class="hl-tbtn" id="hlIcsAll" style="min-height:34px"><i class="ti ti-calendar-plus"></i> Download year (.ics)</button><a href="/holiday/" style="color:var(--clr-brand);font-weight:600;margin-left:auto;text-decoration:none">All countries →</a></div>
  </div>
 </div>
</section>
<div class="hl-bar"><div class="hl-wrap">{CHIPS_PLACEHOLDER}{VIEWS}</div></div>
<div class="hl-wrap hl-main">
 <noscript><p class="hl-empty">Turn on JavaScript for the interactive calendar. The full {y0} and {y1} list is below.</p></noscript>
 <section class="hl-v hl-grid" id="hlV-calendar" aria-label="Calendar">
  <div class="hl-box">
   <div class="hl-mhead"><button class="hl-ib" type="button" id="hlPrev" aria-label="Previous month">‹</button><h2 id="hlMonthT" aria-live="polite"></h2><button class="hl-ib" type="button" id="hlNextM" aria-label="Next month">›</button><button class="hl-tbtn" type="button" id="hlToday">Today</button></div>
   <div class="hl-dow" aria-hidden="true"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
   <div class="hl-days" id="hlDays"></div>
   <p class="hl-hint">Outlined = today · shaded = weekend · tap a highlighted day to see its holiday.</p>
  </div>
  <div class="hl-box"><div class="hl-lhead"><h2 id="hlMonthL"></h2><span id="hlMonthN"></span></div><div id="hlMonthList"></div></div>
 </section>
 <section class="hl-v hl-box" id="hlV-list" hidden aria-label="List"><div class="hl-lhead"><h2 id="hlListT"></h2></div><div id="hlList"></div></section>
 <section class="hl-v" id="hlV-year" hidden aria-label="Year at a glance"><div class="hl-year" id="hlYear"></div></section>

 <section class="hl-sec"><h2 id="hlLwT">Long weekends</h2><p>Three or more days off in a row, combining public holidays with weekends{(' for the selected ' + rl) if nreg else ''}.</p><div class="hl-lw" id="hlLw"></div></section>

 <section class="hl-sec" aria-labelledby="hlCmpH">
  <h2 id="hlCmpH">{esc(cfg['name'])} holiday dates: {y0} vs {y1}</h2>
  <p>Nationwide public, bank, national and religious holidays side by side.</p>
  <div class="hl-box" style="overflow-x:auto;padding:0">
   <table style="width:100%;border-collapse:collapse;font-size:14px;min-width:520px">
    <thead><tr style="text-align:left;background:var(--clr-bg3)"><th scope="col" style="padding:10px 14px">Holiday</th><th scope="col" style="padding:10px 14px">{y0}</th><th scope="col" style="padding:10px 14px">{y1}</th></tr></thead>
    <tbody class="hl-cmp">{trows}</tbody>
   </table>
  </div>
 </section>

 <section class="hl-sec"><h2>Holidays in other countries</h2><div class="hl-cgrid">{others_html}<a class="hl-cc" href="/holiday/"><span style="font-size:22px">🌍</span><span><b>All countries</b><small>Global holiday hub</small></span></a></div></section>

 <section class="hl-faq" aria-label="Frequently asked questions">
  <div><h2>{esc(cfg['name'])} holiday questions</h2><p class="lead">Quick answers about holidays in {esc(cfg['short'])}.</p><p class="hl-src">Data: official holiday lists via the open-source <em>holidays</em> dataset, cross-checked with <em>workalendar</em>; cultural observances curated by TimezoneBuddy. Last updated {BUILD.strftime('%-d %B %Y')}. Spotted an error? <a href="/contact">Let us know</a>.</p></div>
  <div>{faqs}</div>
 </section>
</div>
</main>
'''
    css = '<style>.hl-cmp th,.hl-cmp td{padding:9px 14px;border-top:1px solid var(--clr-border);vertical-align:top;color:var(--clr-text)}.hl-cmp th{font-weight:600}</style>'
    return head(cfg['title'], desc, canon, extra + css) + body + tail(footer, 'window.HOL=' + json.dumps(hol, ensure_ascii=False, separators=(',', ':')) + ';')

def hub_page(all_data, footer, tzmap):
    y0, y1 = SEO_YEARS
    countries = []
    for cc, cfg in C.items():
        years = {str(y): [e for e in all_data[cc][0][y] if 'r' not in e] for y in YEARS}
        countries.append({'slug': cfg['slug'], 'name': cfg['name'], 'short': cfg['short'], 'cc': cfg['cc'], 'cont': cfg['cont'], 'years': years})
    D = {'countries': countries, 'tzmap': tzmap, 'minYear': YEARS[0], 'maxYear': YEARS[-1]}
    cards = ''.join(f'<a class="hl-cc" data-slug="{cfg["slug"]}" href="/holiday/{cfg["slug"]}/"><span class="fi fi-{cfg["cc"]}" aria-hidden="true"></span><span style="min-width:0"><b>{esc(cfg["name"])}</b><small>Holidays {y0} &amp; {y1}</small></span></a>' for cc, cfg in C.items())
    tabs = ''.join(f'<button type="button" data-cont="{k}" aria-pressed="{str(k=="all").lower()}">{v}</button>' for k, v in CONT)
    qs = [
      ("What is the difference between a public holiday and a bank holiday?",
       "A public holiday is an official day off set by the government. A bank holiday is a day when banks are closed; in the UK and Ireland the two terms mean the same thing, while in other countries banks may close on fewer or more days than the public holiday list."),
      ("Why do religious holidays change date every year?",
       "Many religious festivals follow lunar or lunisolar calendars rather than the Gregorian calendar. Easter moves with the spring full moon, Diwali and Holi follow the Hindu calendar, and Islamic holidays like Eid move about 11 days earlier each year. Islamic dates are marked as estimated until they are officially announced."),
      ("What is a long weekend?",
       "A long weekend is a break of three or more days in a row created when a public holiday falls on a Friday or Monday, or next to another holiday. Each country page lists every long weekend for the selected year."),
      ("Can I add holidays to my calendar?",
       "Yes. Every holiday has an “Add to calendar” button, and each country page lets you download the whole year as an .ics file that works with Google Calendar, Apple Calendar and Outlook."),
      ("Which countries are covered?",
       f"We currently cover {len(C)} countries: " + ', '.join(cfg['name'] for cfg in C.values()) + ". More countries are being added regularly."),
      ("Where does the holiday data come from and how often is it updated?",
       f"Official holidays come from the open-source holidays dataset, which follows government announcements, cross-checked against a second dataset. Cultural observances are added by our team. Last updated {BUILD.strftime('%-d %B %Y')}."),
    ]
    faqs, faq_schema = faq_html(qs)
    title = f"Holiday Calendar {y0} & {y1} — Public & Bank Holidays Worldwide | TimezoneBuddy"
    desc = f"Public holidays, bank holidays, national days and religious and cultural festivals for {y0} and {y1}. Browse by country, filter by type and see what's coming up around the world."
    pop = ''.join(f'<button type="button" data-q="{q}">{q}</button>' for q in ['Christmas', 'Diwali', 'Eid', 'Easter', 'Thanksgiving', 'Lunar New Year'])
    body = f'''<nav class="topnav" aria-label="Main navigation"></nav>
<main>
<section class="hl-hero">
 <div class="hl-wrap hl-hero-grid">
  <div>
   <nav class="hl-crumb" aria-label="Breadcrumb"><a href="/">Home</a> › Holidays</nav>
   <h1>Holiday Calendar {y0} &amp; {y1}</h1>
   <p class="hl-lede">Public, bank, national, religious and cultural holidays around the world. Pick a country or search any holiday.</p>
   <div class="hl-next" id="hlNext" hidden></div>
  </div>
  <div class="hl-card">
   <div class="hl-f"><label for="hlCountry">Country</label><select id="hlCountry" onchange="if(this.value)location.href='/holiday/'+this.value+'/'"><option value="">Choose a country…</option>{''.join(f'<option value="{cfg["slug"]}">{esc(cfg["name"])}</option>' for cfg in sorted(C.values(), key=lambda c: c['name']))}</select></div>
   <div class="hl-f"><label for="hlQ">Search</label><input id="hlQ" type="search" autocomplete="off" placeholder="Holiday, country or date — “Diwali”, “Japan”, “25 Dec”" aria-controls="hlDrop"><div class="hl-drop" id="hlDrop" role="listbox"></div></div>
   <div class="hl-pop">Popular: {pop}</div>
  </div>
 </div>
</section>
<div class="hl-bar"><div class="hl-wrap">{CHIPS_PLACEHOLDER}</div></div>
<div class="hl-wrap hl-main">
 <section class="hl-sec" style="margin-top:6px" aria-labelledby="hlWH">
  <h2 id="hlWH">Upcoming around the world</h2><p>Nationwide holidays in the next 30 days.</p>
  <div class="hl-tabs" id="hlCont" role="group" aria-label="Filter by region">{tabs}</div>
  <div class="hl-world" id="hlWorld"></div>
 </section>
 <section class="hl-sec hl-grid" aria-label="World holiday calendar">
  <div class="hl-box">
   <div class="hl-mhead"><button class="hl-ib" type="button" id="hlPrev" aria-label="Previous month">‹</button><h2 id="hlMonthT" aria-live="polite"></h2><button class="hl-ib" type="button" id="hlNextM" aria-label="Next month">›</button><button class="hl-tbtn" type="button" id="hlToday">Today</button></div>
   <div class="hl-dow" aria-hidden="true"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
   <div class="hl-days" id="hlDays"></div>
   <p class="hl-hint">Numbers show how many countries have a holiday that day. Tap a day to see them.</p>
  </div>
  <div class="hl-box"><div class="hl-lhead"><h2 id="hlDayT"></h2></div><div id="hlDayL"></div></div>
 </section>
 <section class="hl-sec"><h2>Browse holidays by country</h2><div class="hl-cgrid">{cards}</div></section>
 <section class="hl-faq" aria-label="Frequently asked questions">
  <div><h2>Holiday questions</h2><p class="lead">How public, bank, religious and cultural holidays work around the world.</p><p class="hl-src">Last updated {BUILD.strftime('%-d %B %Y')}. Spotted an error? <a href="/contact">Let us know</a>.</p></div>
  <div>{faqs}</div>
 </section>
</div>
</main>
'''
    extra = f'<script type="application/ld+json">{faq_schema}</script>'
    return head(title, desc, SITE + '/holiday/', extra) + body + tail(footer, 'window.HOLS=' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';')

# ---------------------------------------------------------------- validation
def validate(all_data):
    try:
        from workalendar.usa import UnitedStates
        from workalendar.europe import UnitedKingdom, Germany
        from workalendar.america import Canada, Brazil
        from workalendar.oceania import Australia
        from workalendar.asia import Japan
        from workalendar.africa import SouthAfrica
    except Exception as e:
        return f"workalendar not available: {e}"
    WA = {'US': UnitedStates, 'GB': UnitedKingdom, 'DE': Germany, 'CA': Canada, 'BR': Brazil, 'AU': Australia, 'JP': Japan, 'ZA': SouthAfrica}
    lines = [f"# Holiday data validation report\n\nGenerated {BUILD.isoformat()} · years {', '.join(map(str, YEARS))}\n",
             "Nationwide **public** holidays from our data are compared with the independent `workalendar` library. "
             "Differences are listed for review; many are expected (e.g. one library includes a regional or observed day the other doesn't).\n"]
    total_ok = total = 0
    for cc, cfg in C.items():
        data = all_data[cc][0]
        lines.append(f"\n## {cfg['name']}\n")
        est = sorted({(e['d'], e['n']) for y in YEARS for e in data[y] if e.get('e')})
        if cc not in WA:
            lines.append("No second dataset available for cross-checking — **manual review recommended** against the official government list.\n")
        for y in YEARS:
            ours = {e['d']: e['n'] for e in data[y] if 'public' in e['t'] and 'r' not in e}
            if cc in WA:
                try: theirs = {d.isoformat(): n for d, n in WA[cc]().holidays(y)}
                except Exception as ex: lines.append(f"- {y}: workalendar error {ex}\n"); continue
                only_ours = sorted(set(ours) - set(theirs)); only_theirs = sorted(set(theirs) - set(ours))
                match = len(set(ours) & set(theirs)); total_ok += match; total += len(set(ours) | set(theirs))
                lines.append(f"- **{y}**: {len(ours)} public holidays · {match} dates match")
                for d in only_ours: lines.append(f"  - only in our data: {d} {ours[d]}")
                for d in only_theirs: lines.append(f"  - only in workalendar: {d} {theirs[d]}")
            else:
                lines.append(f"- **{y}**: {len(ours)} nationwide public holidays: " + '; '.join(f"{d} {n}" for d, n in sorted(ours.items())))
        if est: lines.append(f"\nEstimated (lunar / announcement-based) dates shown with an “Estimated” label: " + '; '.join(f"{d} {n}" for d, n in est))
        regional = sum(1 for y in YEARS for e in data[y] if 'r' in e)
        lines.append(f"\nEntries per year (all types): " + ', '.join(f"{y}: {len(data[y])}" for y in YEARS) + f" · regional entries (all years): {regional}\n")
    lines.insert(2, f"**Overall date agreement where a second source exists: {total_ok}/{total} ({100*total_ok/max(total,1):.0f}%)**\n")
    return '\n'.join(lines)

def main():
    wc = open(os.path.join(ROOT, 'world-clock', 'index.html'), encoding='utf-8').read()
    m = re.search(r'<footer class="(?:wx-footer|site-footer)".*?</footer>', wc, re.S)
    footer = m.group(0) if m else ''
    # time zone -> country (for "next holiday in your country")
    tzmap = {}
    for p in ('/usr/share/zoneinfo/zone.tab',):
        if os.path.exists(p):
            for line in open(p):
                if line.startswith('#'): continue
                f = line.split('\t')
                if len(f) >= 3 and f[0] in C: tzmap[f[2].strip()] = C[f[0]]['slug']
    tzmap.update({'Asia/Calcutta': 'india', 'US/Eastern': 'united-states', 'US/Pacific': 'united-states', 'US/Central': 'united-states', 'Europe/Belfast': 'united-kingdom'})
    all_data = {}
    for cc, cfg in C.items():
        all_data[cc] = build_country(cc, cfg)
        print(f"{cc}: " + ', '.join(f"{y}:{len(all_data[cc][0][y])}" for y in YEARS) + f" · regions {len(all_data[cc][1])}")
    os.makedirs(os.path.join(ROOT, 'holiday'), exist_ok=True)
    for cc, cfg in C.items():
        others = [{'slug': o['slug'], 'name': o['name'], 'cc': o['cc']} for k, o in C.items() if k != cc]
        d = os.path.join(ROOT, 'holiday', cfg['slug']); os.makedirs(d, exist_ok=True)
        page = country_page(cc, cfg, all_data[cc][0], all_data[cc][1], footer, others)
        open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(page)
    open(os.path.join(ROOT, 'holiday', 'index.html'), 'w', encoding='utf-8').write(hub_page(all_data, footer, tzmap))
    open(REPORT, 'w', encoding='utf-8').write(validate(all_data))
    print('done →', os.path.join(ROOT, 'holiday'), '| report →', REPORT)

if __name__ == '__main__':
    main()
