#!/usr/bin/env python3
"""
add_worldmap_nav.py
Adds the World Time Map nav tab to every HTML page in the date-time repo.
Safe to run multiple times -- uses an injection marker so it won't double-add.

Usage:
  python add_worldmap_nav.py
Run from inside the repo root:
  C:\\Users\\manka\\OneDrive\\Documents\\GitHub\\date-time\\
"""

import os
import re

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))

# The exact Locations tab line as it appears in the repo (with \r\n endings)
ANCHOR = '      <a class="nav-tab" href="/location/"><i class="ti ti-map-pin"></i> <span>Locations</span></a>'

# The new tab to insert right after Locations
NEW_TAB = '      <a class="nav-tab" href="/world-time-map"><i class="ti ti-map"></i> <span>World Map</span></a>'

# Guard string — if this is already in the file, skip it
GUARD = 'href="/world-time-map"'

# Files to skip entirely
SKIP_FILES = {
    'world-time-map.html',  # already has it as active
    'admin.html',           # admin panel, no public nav
}

# File extensions to process
EXTENSIONS = {'.html'}

patched = []
skipped_guard = []
skipped_no_anchor = []
errors = []

def process_file(filepath):
    filename = os.path.basename(filepath)

    if filename in SKIP_FILES:
        return

    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except Exception as e:
        errors.append(f'{filepath}: read error — {e}')
        return

    # Skip if already patched
    if GUARD in content:
        skipped_guard.append(filename)
        return

    # Skip if the nav anchor isn't present (page has different nav or no nav)
    if ANCHOR not in content:
        # Try the \r\n variant
        anchor_crlf = ANCHOR.replace('\n', '\r\n')
        if anchor_crlf not in content:
            skipped_no_anchor.append(filename)
            return
        insert_after = anchor_crlf
    else:
        insert_after = ANCHOR

    # Detect line endings
    crlf = '\r\n' in content
    new_tab_line = NEW_TAB + ('\r\n' if crlf else '\n')

    new_content = content.replace(
        insert_after,
        insert_after + ('\r\n' if crlf else '\n') + NEW_TAB,
        1  # only first occurrence
    )

    if new_content == content:
        errors.append(f'{filename}: replacement produced no change (unexpected)')
        return

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        patched.append(filename)
    except Exception as e:
        errors.append(f'{filepath}: write error — {e}')

# Walk the repo root (one level — don't recurse into location/ subfolders
# which have thousands of generated files that share the same template)
for entry in os.listdir(REPO_ROOT):
    if entry.startswith('.'):
        continue
    full = os.path.join(REPO_ROOT, entry)
    if os.path.isfile(full) and os.path.splitext(entry)[1].lower() in EXTENSIONS:
        process_file(full)

# Print summary
print(f'\n✅ Patched ({len(patched)} files):')
for f in sorted(patched):
    print(f'   {f}')

print(f'\n⏭  Already had World Map tab ({len(skipped_guard)} files):')
for f in sorted(skipped_guard):
    print(f'   {f}')

print(f'\n⚠️  Nav anchor not found — skipped ({len(skipped_no_anchor)} files):')
for f in sorted(skipped_no_anchor):
    print(f'   {f}')

if errors:
    print(f'\n❌ Errors ({len(errors)}):')
    for e in errors:
        print(f'   {e}')
else:
    print('\n✔  No errors.')

print('\nDone. Commit and push via GitHub Desktop when ready.')
