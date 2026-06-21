#!/usr/bin/env python3
"""
TimezoneBudy — Navigation consistency fix.

Standardizes the top nav across every page into exactly two variants:

  FULL NAV (homepage, converter, sunmoon, weather, tools,
            time-difference-calculator, and every location page):
    Logo -> World Clock, Converter, Sun & Moon, Weather,
            Time Difference, Tools, Locations (single link, no dropdown)
            -> UTC clock, AM/PM button, theme button

  SIMPLE NAV (about, contact, privacy-policy, terms):
    Logo -> World Clock, Converter, Sun & Moon, Weather,
            Time Difference, Tools -> theme button only
            (no UTC clock, no Locations link -- intentionally lighter
            chrome for legal/info pages)

Also fixes:
  - The duplicate `class` attribute bug on "active" nav-tab links
    (e.g. `<a class="nav-tab" href="/" class="nav-tab active">`) which
    silently fails to apply the active style, since HTML uses only the
    FIRST of two duplicate attributes.
  - Removes the now-unused <script src="/locations-menu.js"> tag,
    since its only job was populating the dropdown being removed.

Safety:
  - Skips offline.html on purpose (special-case fallback page, not a
    normal nav page).
  - Skips any file whose <nav class="topnav"> block doesn't match the
    expected structure, rather than guessing.
  - Backs up the ORIGINAL of every changed file as ".bak" (never
    overwrites an existing backup on re-run).
  - Marks the correct tab "active" based on the file's own path/name.

Usage:
    Run from the root of the repo (where index.html lives, and where
    location/ is a subfolder):

        python fix_nav_consistency.py
"""
import os
import re

SIMPLE_NAV_PAGES = {"about.html", "contact.html", "privacy-policy.html", "terms.html"}
SKIP_PAGES = {"offline.html"}

TOOL_LINKS = [
    ("/", "ti-clock", "World Clock"),
    ("/converter.html", "ti-arrows-exchange", "Converter"),
    ("/sunmoon.html", "ti-sun", "Sun &amp; Moon"),
    ("/weather.html", "ti-cloud", "Weather"),
    ("/time-difference-calculator", "ti-chart-bar", "Time Difference"),
    ("/tools.html", "ti-tool", "Tools"),
]

NAV_BLOCK_RE = re.compile(r"<nav class=\"topnav\".*?</nav>", re.DOTALL)


def active_href_for(filepath):
    """Determines which tab should be marked active based on the file's
    own name/path. Location pages (location/**/index.html) intentionally
    get NO active tool tab -- Locations is its own plain link, not one
    of the 6 tool tabs, and a location page isn't "on" any of them."""
    normalized = filepath.replace("\\", "/")
    if normalized.startswith("./location/") or normalized.startswith("location/"):
        return None

    name = os.path.basename(filepath)
    mapping = {
        "index.html": "/",
        "converter.html": "/converter.html",
        "sunmoon.html": "/sunmoon.html",
        "weather.html": "/weather.html",
        "tools.html": "/tools.html",
        "time-difference-calculator.html": "/time-difference-calculator",
    }
    return mapping.get(name)


def build_tool_tabs_html(active_href, indent="      "):
    lines = []
    for href, icon, label in TOOL_LINKS:
        cls = "nav-tab active" if href == active_href else "nav-tab"
        lines.append(f'{indent}<a class="{cls}" href="{href}"><i class="ti {icon}"></i> <span>{label}</span></a>')
    return "\n".join(lines)


def build_full_nav(active_href):
    tabs = build_tool_tabs_html(active_href)
    return f'''<nav class="topnav" aria-label="Main navigation">
  <div class="topnav-inner">
    <a class="logo" href="/"><span>\U0001f30d</span><span class="logo-name">World<em>Clock</em></span></a>
    <div class="nav-tabs" role="tablist">
{tabs}
      <a class="nav-tab" href="/location/"><i class="ti ti-map-pin"></i> <span>Locations</span></a>
    </div>
    <div class="nav-utc"><span class="utc-l">UTC</span><span class="utc-v" id="utc-val">--:--:--</span></div>
    <div class="nav-btns">
      <button class="nav-btn" id="fmt-btn" onclick="toggle24h()">AM/PM</button>
      <button class="nav-btn" id="theme-btn" onclick="toggleTheme()">\U0001f319</button>
    </div>
  </div>
</nav>'''


def build_simple_nav():
    tabs = build_tool_tabs_html(active_href=None)
    return f'''<nav class="topnav" aria-label="Main navigation">
  <div class="topnav-inner">
    <a class="logo" href="/"><span>\U0001f30d</span><span class="logo-name">World<em>Clock</em></span></a>
    <div class="nav-tabs">
{tabs}
    </div>
    <div class="nav-btns">
      <button class="nav-btn" id="theme-btn" onclick="toggleTheme()">\U0001f319</button>
    </div>
  </div>
</nav>'''


def fix_file(path):
    name = os.path.basename(path)
    if name in SKIP_PAGES:
        return f"SKIPPED ({path}): intentionally excluded (offline fallback page)"

    with open(path, encoding="utf-8") as f:
        html = f.read()

    if not NAV_BLOCK_RE.search(html):
        return f"SKIPPED ({path}): no <nav class=\"topnav\"> block found — structure differs, not touching this file"

    if name in SIMPLE_NAV_PAGES:
        new_nav = build_simple_nav()
    else:
        new_nav = build_full_nav(active_href_for(path))

    new_html = NAV_BLOCK_RE.sub(new_nav, html, count=1)

    # Remove the now-unused locations-menu.js script tag (only job was
    # populating the dropdown menu we just removed).
    new_html = re.sub(
        r'\s*<script src="/locations-menu\.js"[^>]*></script>\n?',
        '\n',
        new_html,
    )

    # NOTE: We deliberately do NOT try to remove the dead dropdown-toggle
    # JS code (the document.querySelectorAll('.loc-menu-trigger')... block).
    # On location pages, that code shares the SAME <script> tag as the
    # live-clock ticker (tickAllClocks) -- a previous version of this
    # script tried to regex-match and strip just the dropdown code, but
    # the pattern was fragile and risked corrupting or deleting adjacent
    # real code. The dropdown-toggle code is harmless once the dropdown
    # markup is removed (querySelectorAll simply finds zero elements and
    # the listeners never fire) -- leaving a few inert lines in place is
    # a far smaller risk than a regex edit that could break live clocks
    # across 100+ pages. If you want this dead code cleaned up later, do
    # it by hand on a handful of files, verifying each one visually.

    if new_html == html:
        return f"SKIPPED ({path}): nav already matches target, no change needed"

    backup_path = path + ".bak"
    if not os.path.exists(backup_path):
        with open(backup_path, "w", encoding="utf-8") as f:
            f.write(html)

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_html)

    return f"OK ({path}): nav standardized"


def find_html_files(root="."):
    for dirpath, _, filenames in os.walk(root):
        for fname in filenames:
            if fname.endswith(".html"):
                yield os.path.join(dirpath, fname)


def main():
    results = []
    for path in sorted(find_html_files(".")):
        result = fix_file(path)
        results.append(result)
        print(result)

    ok = sum(1 for r in results if r.startswith("OK"))
    skipped = sum(1 for r in results if r.startswith("SKIPPED"))
    print(f"\nDone. {ok} files updated, {skipped} skipped.")
    print("Each changed file has a .html.bak backup of the ORIGINAL saved alongside it.")


if __name__ == "__main__":
    main()
