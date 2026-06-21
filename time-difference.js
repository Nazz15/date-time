/* TimezoneBudy — Time Difference Calculator
   Depends on /cities.js being loaded first (defines the global CITIES array).
   CITIES entries look like: {name, country, cc, tz, region, pop} */

const TDC = (() => {

  let src = null; // {name, country, cc, tz}
  let dst = null;

  // ---------------------------------------------------------------
  // City label + search helpers
  // ---------------------------------------------------------------

  function cityLabel(city) {
    // Always show "Name, Country" — several cities share a bare name
    // (e.g. "Sydney" exists in both Canada and, under the name
    // "Melbourne", uses the Australia/Sydney timezone) so the country
    // must always be visible to avoid picking the wrong one.
    return `${city.name}, ${city.country}`;
  }

  function searchCities(query) {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return CITIES.filter(c =>
      c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    ).slice(0, 12);
  }

  function renderDropdown(ddEl, results, onPick) {
    if (!results.length) {
      ddEl.hidden = true;
      ddEl.innerHTML = '';
      return;
    }
    ddEl.innerHTML = results.map((c, i) =>
      `<div class="search-dd-item" data-idx="${i}">
         <span class="fi fi-${c.cc}" style="width:18px;height:13px;border-radius:2px;display:inline-block;background-size:cover;flex-shrink:0;margin-right:8px" aria-hidden="true"></span>
         <span>${c.name}</span><span style="opacity:.6;margin-left:6px">${c.country}</span>
       </div>`
    ).join('');
    ddEl.hidden = false;
    ddEl.querySelectorAll('.search-dd-item').forEach((el, i) => {
      el.addEventListener('click', () => onPick(results[i]));
    });
  }

  function wireSearchInput(inputId, ddId, chipId, onSelect) {
    const input = document.getElementById(inputId);
    const dd = document.getElementById(ddId);
    const chip = document.getElementById(chipId);

    input.addEventListener('input', () => {
      renderDropdown(dd, searchCities(input.value), (city) => {
        onSelect(city);
        input.value = '';
        dd.hidden = true;
        chip.hidden = false;
        chip.innerHTML = `
          <span class="fi fi-${city.cc}" style="width:18px;height:13px;border-radius:2px;display:inline-block;background-size:cover;flex-shrink:0" aria-hidden="true"></span>
          <span>${cityLabel(city)}</span>
          <button type="button" class="tdc-chip-clear" aria-label="Clear">&times;</button>
        `;
        chip.querySelector('.tdc-chip-clear').addEventListener('click', () => {
          onSelect(null);
          chip.hidden = true;
          chip.innerHTML = '';
          updateCalcButtonState();
        });
        updateCalcButtonState();
      });
    });

    document.addEventListener('click', (e) => {
      if (!dd.contains(e.target) && e.target !== input) dd.hidden = true;
    });
  }

  function updateCalcButtonState() {
    document.getElementById('tdc-calc').disabled = !(src && dst);
  }

  // ---------------------------------------------------------------
  // Core time-difference math
  // ---------------------------------------------------------------

  function getOffsetMinutes(tz, atDate) {
    // Computes the UTC offset (in minutes) for a given IANA timezone at a
    // given moment — correctly reflects DST since it's evaluated live.
    const utcDate = new Date(atDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(atDate.toLocaleString('en-US', { timeZone: tz }));
    return (tzDate - utcDate) / 60000;
  }

  function diffPhrase(srcTz, dstTz, now) {
    const srcOff = getOffsetMinutes(srcTz, now);
    const dstOff = getOffsetMinutes(dstTz, now);
    const deltaMin = dstOff - srcOff;

    if (deltaMin === 0) return { text: 'No time difference', hours: 0, minutes: 0, direction: 'same' };

    const direction = deltaMin > 0 ? 'ahead' : 'behind';
    const abs = Math.abs(deltaMin);
    const h = Math.floor(abs / 60);
    const m = abs % 60;

    let text = '';
    if (h) text += `${h} hour${h !== 1 ? 's' : ''}`;
    if (m) text += `${text ? ' ' : ''}${m} minute${m !== 1 ? 's' : ''}`;

    return { text, hours: h, minutes: m, direction };
  }

  function dayLabel(srcTz, dstTz, now) {
    const srcDay = new Date(now.toLocaleString('en-US', { timeZone: srcTz })).getDate();
    const dstDayDate = new Date(now.toLocaleString('en-US', { timeZone: dstTz }));
    const dstDay = dstDayDate.getDate();

    if (srcDay === dstDay) return 'Today';
    // Compare full date objects to correctly handle month/year boundaries,
    // not just the day-of-month number.
    const srcDateOnly = new Date(now.toLocaleDateString('en-US', { timeZone: srcTz }));
    const dstDateOnly = new Date(now.toLocaleDateString('en-US', { timeZone: dstTz }));
    return dstDateOnly > srcDateOnly ? 'Tomorrow' : 'Yesterday';
  }

  // ---------------------------------------------------------------
  // Calculate + render result
  // ---------------------------------------------------------------

  function calculate() {
    if (!src || !dst) return;
    const now = new Date();

    const srcTimeStr = now.toLocaleTimeString('en-US', { timeZone: src.tz, hour: '2-digit', minute: '2-digit', hour12: true });
    const dstTimeStr = now.toLocaleTimeString('en-US', { timeZone: dst.tz, hour: '2-digit', minute: '2-digit', hour12: true });
    const srcDateStr = now.toLocaleDateString('en-US', { timeZone: src.tz, weekday: 'long', month: 'short', day: 'numeric' });
    const dstDateStr = now.toLocaleDateString('en-US', { timeZone: dst.tz, weekday: 'long', month: 'short', day: 'numeric' });

    document.getElementById('tdc-res-src-name').textContent = cityLabel(src);
    document.getElementById('tdc-res-dst-name').textContent = cityLabel(dst);
    document.getElementById('tdc-res-src-time').textContent = srcTimeStr;
    document.getElementById('tdc-res-dst-time').textContent = dstTimeStr;
    document.getElementById('tdc-res-src-date').textContent = srcDateStr;
    document.getElementById('tdc-res-dst-date').textContent = dstDateStr;

    const diff = diffPhrase(src.tz, dst.tz, now);
    const diffEl = document.getElementById('tdc-res-diff');
    if (diff.direction === 'same') {
      diffEl.textContent = `${dst.name} is the same time as ${src.name}`;
    } else {
      diffEl.textContent = `${dst.name} is ${diff.text} ${diff.direction} of ${src.name}`;
    }

    const badge = document.getElementById('tdc-res-day-badge');
    const label = dayLabel(src.tz, dst.tz, now);
    badge.textContent = label;
    badge.className = 'tdc-result-day-badge tdc-day-' + label.toLowerCase();

    document.getElementById('tdc-result').hidden = false;
  }

  function swap() {
    if (!src || !dst) return;
    [src, dst] = [dst, src];

    const srcChip = document.getElementById('tdc-src-selected');
    const dstChip = document.getElementById('tdc-dst-selected');
    [srcChip.innerHTML, dstChip.innerHTML] = [dstChip.innerHTML, srcChip.innerHTML];

    // Re-wire the clear buttons since innerHTML swap doesn't carry listeners
    srcChip.querySelector('.tdc-chip-clear')?.addEventListener('click', () => {
      src = null; srcChip.hidden = true; srcChip.innerHTML = ''; updateCalcButtonState();
    });
    dstChip.querySelector('.tdc-chip-clear')?.addEventListener('click', () => {
      dst = null; dstChip.hidden = true; dstChip.innerHTML = ''; updateCalcButtonState();
    });

    calculate();
  }

  // ---------------------------------------------------------------
  // Dynamic SEO sections — built from REAL CITIES data, not hardcoded.
  // ---------------------------------------------------------------

  function findCity(name, countryHint) {
    const matches = CITIES.filter(c => c.name === name && (!countryHint || c.country === countryHint));
    return matches[0] || CITIES.find(c => c.name === name);
  }

  function urlFor(a, b) {
    const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `/time-difference-calculator?from=${slug(a.name)}&to=${slug(b.name)}`;
  }

  function buildPopularComparisons() {
    // Hand-picked pairs of genuinely high-search-volume city combinations.
    // Each pair is resolved against the REAL CITIES array (with country
    // hints to avoid the Sydney/Canada-vs-Australia ambiguity) so the
    // generated links always point at real, correct timezones.
    const pairs = [
      [['New York City', 'United States'], ['London', 'United Kingdom']],
      [['London', 'United Kingdom'], ['Melbourne', 'Australia']], // Melbourne entry carries Australia/Sydney tz
      [['Los Angeles', 'United States'], ['Tokyo', 'Japan']],
      [['Toronto', 'Canada'], ['Dubai', 'United Arab Emirates']],
      [['Mumbai', 'India'], ['New York City', 'United States']],
    ];

    const grid = document.getElementById('tdc-popular-grid');
    grid.innerHTML = pairs.map(([[an, ac], [bn, bc]]) => {
      const a = findCity(an, ac);
      const b = findCity(bn, bc);
      if (!a || !b) return '';
      return `<a class="tdc-chip-card" href="${urlFor(a, b)}">${a.name} vs ${b.name}</a>`;
    }).join('');
  }

  function buildCountryVsCountry() {
    const pairs = [
      [['New York City', 'United States'], ['Mumbai', 'India']],
      [['London', 'United Kingdom'], ['Melbourne', 'Australia']],
      [['Toronto', 'Canada'], ['Berlin', 'Germany']],
    ];
    const grid = document.getElementById('tdc-country-grid');
    grid.innerHTML = pairs.map(([[an, ac], [bn, bc]]) => {
      const a = findCity(an, ac);
      const b = findCity(bn, bc);
      if (!a || !b) return '';
      return `<a class="tdc-chip-card" href="${urlFor(a, b)}">${a.country} vs ${b.country} Time Difference</a>`;
    }).join('');
  }

  function buildCountryVsWorldCities() {
    const countries = [
      { label: 'USA', name: 'New York City', country: 'United States' },
      { label: 'UK', name: 'London', country: 'United Kingdom' },
      { label: 'India', name: 'Mumbai', country: 'India' },
      { label: 'Australia', name: 'Melbourne', country: 'Australia' },
    ];
    const worldCities = [
      ['London', 'United Kingdom'], ['New York City', 'United States'],
      ['Tokyo', 'Japan'], ['Dubai', 'United Arab Emirates'], ['Singapore', 'Singapore'],
    ];

    const tabsEl = document.getElementById('tdc-world-tabs');
    const tableWrapEl = document.getElementById('tdc-world-table-wrap');

    function renderTable(activeIdx) {
      const base = findCity(countries[activeIdx].name, countries[activeIdx].country);
      if (!base) { tableWrapEl.innerHTML = ''; return; }
      const now = new Date();
      const rows = worldCities
        .filter(([n, c]) => !(n === base.name && c === base.country))
        .map(([n, c]) => {
          const city = findCity(n, c);
          if (!city) return '';
          const d = diffPhrase(base.tz, city.tz, now);
          const diffText = d.direction === 'same' ? 'Same time' : `${d.text} ${d.direction}`;
          return `<tr><td>${city.name}, ${city.country}</td><td data-tz="${city.tz}">--:--</td><td>${diffText}</td></tr>`;
        }).join('');

      tableWrapEl.innerHTML = `
        <div class="tdc-table-wrap">
          <table class="tdc-table">
            <thead><tr><th>City</th><th>Local Time</th><th>Difference from ${base.country}</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
      tickAllClocksInScope(tableWrapEl);
    }

    tabsEl.innerHTML = countries.map((c, i) =>
      `<button type="button" class="tdc-world-tab${i === 0 ? ' active' : ''}" data-idx="${i}">${c.label} &rarr; Major World Cities</button>`
    ).join('');

    tabsEl.querySelectorAll('.tdc-world-tab').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        tabsEl.querySelectorAll('.tdc-world-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTable(i);
      });
    });

    renderTable(0);
  }

  function tickAllClocksInScope(scopeEl) {
    function tick() {
      const now = new Date();
      scopeEl.querySelectorAll('[data-tz]').forEach(el => {
        const tz = el.getAttribute('data-tz');
        try {
          el.textContent = now.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
        } catch (e) { el.textContent = '--:--'; }
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  // ---------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------

  function init() {
    wireSearchInput('tdc-src-srch', 'tdc-src-dd', 'tdc-src-selected', (city) => { src = city; });
    wireSearchInput('tdc-dst-srch', 'tdc-dst-dd', 'tdc-dst-selected', (city) => { dst = city; });
    buildPopularComparisons();
    buildCountryVsCountry();
    buildCountryVsWorldCities();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { calculate, swap };
})();
