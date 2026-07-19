r"""
inject_favicon.py
Replaces the old emoji favicon and WorldClock logo with the new
TimezoneBudy SVG favicon + updated wordmark nav logo.

Run from the repo root:
  cd C:\Users\manka\OneDrive\Documents\GitHub\date-time
  python inject_favicon.py
"""

import os, re

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))

# ── New favicon head block ────────────────────────────────────────────────────
NEW_FAVICON_BLOCK = '''<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0d2240">'''

# ── New nav logo (replaces the emoji + WorldClock text) ───────────────────────
NEW_LOGO = (
    '<a class="logo" href="/">'
    '<svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    '<defs>'
    '<linearGradient id="lg" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">'
    '<stop offset="0%" stop-color="#3b82f6"/>'
    '<stop offset="100%" stop-color="#1e3a8a"/>'
    '</linearGradient>'
    '<clipPath id="lc"><circle cx="32" cy="32" r="26"/></clipPath>'
    '</defs>'
    '<circle cx="32" cy="32" r="26" fill="url(#lg)"/>'
    '<g clip-path="url(#lc)" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1">'
    '<ellipse cx="32" cy="32" rx="10" ry="26"/>'
    '<line x1="6" y1="32" x2="58" y2="32"/>'
    '</g>'
    '<path d="M32 6 A26 26 0 0 1 32 58 A17 26 0 0 0 32 6" fill="rgba(0,8,32,0.38)"/>'
    '<circle cx="32" cy="32" r="30" fill="none" stroke="#1d4ed8" stroke-width="2.8"/>'
    '<path d="M32 2 A30 30 0 0 1 62 32" fill="none" stroke="#f59e0b" stroke-width="3.8" stroke-linecap="round"/>'
    '<line x1="32" y1="32" x2="32" y2="17" stroke="white" stroke-width="2.4" stroke-linecap="round"/>'
    '<line x1="32" y1="32" x2="43" y2="39" stroke="white" stroke-width="2" stroke-linecap="round"/>'
    '<circle cx="32" cy="32" r="2.4" fill="white"/>'
    '</svg>'
    '<span class="logo-name">Timezone<em>Budy</em></span>'
    '</a>'
)

# Old favicon patterns to remove
OLD_FAVICON_PATTERNS = [
    r'<link rel="icon"[^>]*>',
    r'<link rel="apple-touch-icon"[^>]*>',
    r'<link rel="manifest"[^>]*>',
    r'<meta name="theme-color"[^>]*>',
]

# Old logo pattern
OLD_LOGO_RE = re.compile(
    r'<a class="logo"[^>]*>.*?</a>',
    re.DOTALL
)

GUARD = 'inject_favicon_done'

patched_favicon = []
patched_logo    = []
skipped         = []
errors          = []

def process_file(filepath):
    rel = os.path.relpath(filepath, REPO_ROOT)
    try:
        content = open(filepath, 'r', encoding='utf-8', errors='replace').read()
    except Exception as e:
        errors.append(rel + ': ' + str(e)); return

    if GUARD in content:
        skipped.append(rel); return

    original = content
    changed_favicon = False
    changed_logo    = False

    # 1. Remove old favicon tags
    for pat in OLD_FAVICON_PATTERNS:
        new_content, n = re.subn(pat, '', content, flags=re.IGNORECASE)
        if n: content = new_content

    # 2. Inject new favicon block before </head>
    if '</head>' in content:
        content = content.replace(
            '</head>',
            f'<!-- {GUARD} -->\n{NEW_FAVICON_BLOCK}\n</head>',
            1
        )
        changed_favicon = True

    # 3. Replace old logo (WorldClock / emoji globe) with new SVG logo
    new_content, n = OLD_LOGO_RE.subn(NEW_LOGO, content, count=2)
    if n:
        content = new_content
        changed_logo = True

    if content == original:
        skipped.append(rel); return

    try:
        open(filepath, 'w', encoding='utf-8').write(content)
    except Exception as e:
        errors.append(rel + ': write error: ' + str(e)); return

    if changed_favicon: patched_favicon.append(rel)
    if changed_logo:    patched_logo.append(rel)

# Walk all HTML files in repo root + subdirectories
SKIP_DIRS = {'node_modules', '.git', '__pycache__'}
for dirpath, dirnames, filenames in os.walk(REPO_ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    for fname in filenames:
        if fname.endswith('.html'):
            process_file(os.path.join(dirpath, fname))

print(f'Favicon injected: {len(patched_favicon)} files')
print(f'Logo updated:     {len(patched_logo)} files')
print(f'Skipped:          {len(skipped)} files')
if errors:
    print(f'Errors:           {len(errors)}')
    for e in errors: print(' ', e)
else:
    print('No errors.')
print('\nNext steps:')
print('1. Copy /icons/ folder (icon-192.png, icon-512.png, apple-touch-icon.png) to your repo root')
print('2. Copy favicon.svg and favicon.ico to your repo root')
print('3. Copy manifest.json to your repo root (replaces existing)')
print('4. Delete this script, then commit everything via GitHub Desktop')
