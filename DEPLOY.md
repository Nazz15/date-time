# Deployment Guide — Cloudflare Pages (NOT Workers)

## ⚠️ Important
Deploy to **Cloudflare Pages**, NOT Cloudflare Workers.
- Workers = serverless JS functions (not for static sites)
- Pages = static site hosting (what you need)

---

## Method 1: Direct Upload (Fastest — no GitHub needed)

1. Go to: https://dash.cloudflare.com
2. Click **Pages** in the left sidebar
3. Click **Create a project**
4. Click **Upload assets** (NOT "Connect to Git")
5. Name your project (e.g. `worldclock`)
6. Drag and drop the entire `wc3/` folder contents
   — or click to browse and select all files
7. Click **Deploy site**
8. Your site goes live at: `worldclock.pages.dev`

---

## Method 2: GitHub (Recommended for ongoing updates)

1. Create a GitHub repo (free): https://github.com/new
2. Upload all files from `wc3/` to the repo root
3. Go to: https://dash.cloudflare.com → Pages
4. Click **Create a project** → **Connect to Git**
5. Select your GitHub repo
6. Settings:
   - Build command: (leave EMPTY)
   - Build output directory: `/` (or leave empty)
   - Root directory: `/` (leave as is)
7. Click **Save and Deploy**
8. Every `git push` auto-deploys in ~30 seconds

---

## Method 3: Wrangler CLI

```bash
npm install -g wrangler
wrangler login
# From inside the wc3/ folder:
npx wrangler pages deploy . --project-name worldclock
```

---

## Custom Domain (after deploying)

1. Pages → your project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain: `yourdomain.com`
4. Cloudflare handles SSL automatically
5. If domain is at another registrar, point nameservers to:
   - `aiden.ns.cloudflare.com`
   - `tina.ns.cloudflare.com`

---

## Verify it's working

After deploy, check these URLs work:
- `https://yoursite.pages.dev/`
- `https://yoursite.pages.dev/css/main.css` (should show CSS)
- `https://yoursite.pages.dev/js/util.js` (should show JS)
- `https://yoursite.pages.dev/converter`
- `https://yoursite.pages.dev/weather`

If CSS loads, everything is working.
