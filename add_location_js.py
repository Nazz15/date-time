#!/usr/bin/env python3
r"""
add_location_js.py
Injects <script src="/location.js"></script> into every city page
under the location/ directory.

Run from the repo root:
  cd C:\Users\manka\OneDrive\Documents\GitHub\date-time
  python add_location_js.py
"""

import os, re

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
LOC_DIR   = os.path.join(REPO_ROOT, 'location')
INJECT    = '<script src="/location.js"></script>'
GUARD     = '/location.js'
# Insert just before </body>
ANCHOR    = '</body>'

patched, skipped, errors = [], [], []

for dirpath, dirnames, filenames in os.walk(LOC_DIR):
    for fname in filenames:
        if fname != 'index.html':
            continue
        # Skip the top-level location/index.html (that's the directory page)
        if os.path.normpath(dirpath) == os.path.normpath(LOC_DIR):
            continue
        # Skip country-level pages (only 1 level deep = country/index.html)
        rel = os.path.relpath(dirpath, LOC_DIR)
        depth = len(rel.split(os.sep))
        if depth < 2:   # depth 1 = country page, 2 = city page
            continue

        fpath = os.path.join(dirpath, fname)
        try:
            content = open(fpath, 'r', encoding='utf-8', errors='replace').read()
        except Exception as e:
            errors.append(fpath + ': ' + str(e)); continue

        if GUARD in content:
            skipped.append(rel); continue

        if ANCHOR not in content:
            errors.append(rel + ': </body> not found'); continue

        new = content.replace(ANCHOR, INJECT + '\n' + ANCHOR, 1)
        try:
            open(fpath, 'w', encoding='utf-8').write(new)
            patched.append(rel)
        except Exception as e:
            errors.append(rel + ': write error ' + str(e))

print(f'✅ Patched: {len(patched)} city pages')
print(f'⏭  Already had location.js: {len(skipped)}')
if errors:
    print(f'❌ Errors ({len(errors)}):')
    for e in errors: print('  ', e)
else:
    print('✔  No errors.')
print('\nCommit and push via GitHub Desktop when ready.')
