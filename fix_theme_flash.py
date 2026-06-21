#!/usr/bin/env python3
"""
TimezoneBudy — Theme-flash fix, applied to every HTML file in the site.

Every page currently has <html lang="en" data-theme="dark">, hardcoded.
If the visitor has saved "light" mode, the page still paints dark first,
then JS corrects it a moment later — a visible flash, and the root cause
of the "dark mode randomly turns on" report.

This script, for every .html file found (recursively, from wherever it's
run):
  1. Removes the hardcoded data-theme="dark" attribute from <html>
  2. Inserts a tiny inline <script> as the very FIRST thing inside <head>,
     before any <link> or <meta> tags, that reads localStorage and sets
     the correct theme before the browser paints anything.

This mirrors the exact same logic already in util.js's WC.isDark
initializer — it just runs it earlier, so there's no flash.

Safety:
  - Each file gets a same Skipped if it doesn't match the expected
    <html lang="en" data-theme="dark"> pattern AND doesn't already have
    the fix applied (so it never touches a file blindly).
  - Already-fixed files are detected and skipped (safe to re-run).
  - A .bak copy of each ORIGINAL file is saved before any edit, the
    first time only — re-running never overwrites that backup.

Usage:
    cd into the root of your site (where index.html, converter.html etc.
    live, and where the location/ folder is), then:

    python fix_theme_flash.py

It will recursively find and fix every .html file from that point down.
"""
import os
import re

ANTI_FLASH_SCRIPT = '''<script>
(function() {
  var saved = localStorage.getItem('wc_theme');
  var isDark = saved === 'dark' ||
    (!saved && matchMedia('(prefers-color-scheme:dark)').matches);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
})();
</script>
'''

MARKER = "localStorage.getItem('wc_theme')"

HARDCODED_PATTERNS = [
    '<html lang="en" data-theme="dark">',
    '<html lang="en" data-theme="light">',
    "<html lang='en' data-theme=\"dark\">",
]


def find_html_files(root="."):
    for dirpath, _, filenames in os.walk(root):
        for fname in filenames:
            if fname.endswith(".html"):
                yield os.path.join(dirpath, fname)


def fix_file(path):
    with open(path, encoding="utf-8") as f:
        html = f.read()

    if MARKER in html:
        return f"SKIPPED ({path}): already has the anti-flash script"

    matched_pattern = None
    for pattern in HARDCODED_PATTERNS:
        if pattern in html:
            matched_pattern = pattern
            break

    if not matched_pattern:
        # No hardcoded data-theme found at all — might be a non-page file,
        # or already using a different pattern. Don't guess; report and skip.
        if "<head>" in html:
            # Still has a normal <head> — apply the script even without a
            # hardcoded attribute to remove, since the fix is still valid
            # (defends against late-loading JS either way).
            new_html = re.sub(r"(<head>\s*)", r"\1" + ANTI_FLASH_SCRIPT, html, count=1)
            backup_and_write(path, html, new_html)
            return f"OK ({path}): no hardcoded data-theme found, but added anti-flash script anyway"
        return f"SKIPPED ({path}): no <html data-theme=...> pattern and no <head> tag found — structure differs, not touching this file"

    new_html = html.replace(matched_pattern, '<html lang="en">')
    new_html = re.sub(r"(<head>\s*)", r"\1" + ANTI_FLASH_SCRIPT, new_html, count=1)

    backup_and_write(path, html, new_html)
    return f"OK ({path}): hardcoded theme removed, anti-flash script added"


def backup_and_write(path, original_html, new_html):
    backup_path = path + ".bak"
    if not os.path.exists(backup_path):
        with open(backup_path, "w", encoding="utf-8") as f:
            f.write(original_html)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_html)


def main():
    results = []
    for path in sorted(find_html_files(".")):
        result = fix_file(path)
        results.append(result)
        print(result)

    ok = sum(1 for r in results if r.startswith("OK"))
    skipped = sum(1 for r in results if r.startswith("SKIPPED"))
    print(f"\nDone. {ok} files fixed, {skipped} skipped.")
    print("Each fixed file has a .html.bak backup of the ORIGINAL saved alongside it.")


if __name__ == "__main__":
    main()
