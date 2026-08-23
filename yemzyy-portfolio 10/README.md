# YEMZYY Portfolio — Final Guide

This covers everything: what's built, where the CMS lives, how to manage
content day-to-day, and exactly how to publish.

---

## 1. Publishing — exact steps

### A) Push the site to GitHub
1. In your empty GitHub repo, click **uploading an existing file** (or use
   GitHub Desktop / `git push` if you're comfortable with that).
2. Upload **everything** in this folder, keeping the structure intact:
   - `index.html`
   - `404.html`
   - `styles.css`
   - `script.js`
   - `netlify.toml`
   - `admin/` (folder — contains `index.html` and `config.yml`)
   - `assets/` (folder — contains `logo.png`, `data/`, and your media subfolders)
3. **Before uploading `admin/config.yml`**, open it and replace:
   ```
   repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
   ```
   with your actual GitHub username and repo name, e.g. `repo: adeyemodavid/yemzyy-portfolio`.
4. Commit.

### B) Turn on GitHub Pages (the public website)
1. Repo **Settings** → **Pages**.
2. Branch: `main`, folder: `/ (root)` → **Save**.
3. Your live site appears at `https://your-username.github.io/repo-name/` within a minute.

### C) Connect Netlify (this powers the CMS login)
1. In Netlify, **Add new site → Import an existing project → GitHub** → pick this repo.
2. Build settings: leave blank / use defaults — it's a static site, no build command needed (`netlify.toml` already tells it the whole folder is the publish directory).
3. Deploy. Netlify gives you a URL like `https://yemzyy-portfolio.netlify.app`.
4. Your CMS is now live at **`https://yemzyy-portfolio.netlify.app/admin/`**.
   (The public site can still be the GitHub Pages link — both point at the same repo content. Only the `/admin` path needs to be visited on the Netlify domain for login to work.)

---

## 2. The CMS

**Location:** `https://<your-netlify-site>.netlify.app/admin/`
**Login:** Click "Login with GitHub" and authorize — it uses your real GitHub
account via Netlify's built-in OAuth. There is no separate CMS password to
manage or leak; your GitHub login *is* the security.

**Collections you can manage:**
- Graphic Design Portfolio, Video Editing Portfolio, Vlog Portfolio
- Pricing, Statistics, Reviews

Any change you make and publish in the CMS commits directly to your GitHub
repo, which is what the live site reads from — **that repo is the single
source of truth**, whether you edit through the CMS or by hand in code.
There's no separate database to fall out of sync.

---

## 3. How to do everyday things

**Add a graphic design:** CMS → Graphic Design Portfolio → open the file →
"Add" under Projects → fill in Title, Category, upload the image, toggle
Recent if you want it in the "Recently Added" strip → Save → Publish.

**Add a video:** CMS → Video Editing Portfolio → same idea. Upload a file
*or* paste a video URL (not both), plus optional resolution.

**Add a vlog:** CMS → Vlog Portfolio → same fields, plus pick the Aspect
Ratio (16/9, 4/3, 9/16, or 1/1) — the site adapts the layout automatically,
no cropping or stretching.

**Add client profile photos:** no CMS needed for this one — just drop files
named `avatar-1.jpg` through `avatar-5.jpg` into `assets/clients/` (via
GitHub's "upload file" button, or locally + git push). They appear
automatically in the stacked-circle graphic.

**Replace CapCut / Canva / DaVinci logos:** same drop-in method — add real
logo files to `assets/tools/` (create this folder) named to match, or ask
your assistant in a follow-up to wire in exact filenames if you want the
image-swap pattern like the other assets use.

**Edit website text (headings, FAQ, about, etc.):** the FAQ answers, hero
text, and about paragraphs currently live directly in `index.html` — search
for the text you want to change and edit it there (Ctrl+F is your friend).
Pricing, stats, and reviews text are the ones already CMS-editable (see below).

**Edit pricing:** CMS → Pricing.

**Edit statistics:** CMS → Statistics.

**Manage reviews:** Visitors submit reviews through the on-site form → it
emails you (via Web3Forms) → open CMS → Reviews → add/edit an entry → check
"Approved" → Publish. Only approved reviews show publicly.

**View ratings:** the 1–10 slider ratings arrive as emails (via Web3Forms) —
they aren't stored in the CMS itself, since that would need a live database,
which isn't part of the free static-hosting setup. Check your inbox for
"New portfolio rating" emails.

**Manage "Recent" projects:** toggle "Show as Recent" on/off for any project
in the CMS. It automatically appears/disappears from the Recent strip near
the top of the portfolio — no code changes needed.

---

## 4. Where things live in the code (for manual edits)

- **Design tokens** (colors, fonts, spacing): top of `styles.css`, under `:root`
- **Portfolio fallback data** (used only if the JSON fetch fails, e.g. local
  file:// preview): `script.js`, near the top, `DESIGN_DEFAULT` / `VIDEO_DEFAULT` / `VLOG_DEFAULT`
- **Chatbot Q&A:** `assets/data/chatbot.json`
- **FAQ, About text, Hero copy:** directly in `index.html`
- **Web3Forms key:** search `access_key` in `index.html` and `script.js`

---

## 5. Adding your media (unchanged from before)

Every media slot auto-detects a real file the moment it exists with the
right name — no code editing needed for swapping in real photos/videos.
Naming conventions:
```
assets/phone/          slide-1.mp4 ... slide-4.mp4
assets/about/          portrait.jpg
assets/clients/        avatar-1.jpg ... avatar-5.jpg
assets/design/         design-01.jpg ... design-50.jpg
assets/video/          video-01.mp4 ... video-52.mp4
assets/video/          vlog-01.mp4 ... vlog-07.mp4
```
New projects added via the CMS use whatever filename you upload — the
numbered convention above is just for the original 109 that shipped built-in.

---

## 6. What's intentionally not included, and why

- **Analytics** — removed per your request.
- **A live "view all ratings" dashboard** — free static hosting has no
  database; ratings arrive by email instead (see above).
- **Full CMS text-editing for every heading on the page** — pricing, stats,
  and reviews are CMS-driven; the rest of the copy is plain HTML you edit
  directly, to avoid over-engineering a text-CMS layer that free static
  tooling doesn't naturally support well.


## Adding your real CapCut / Canva / DaVinci Resolve logos

**Folder:** `assets/tools/`

**Exact filenames required:**
```
assets/tools/capcut.png
assets/tools/canva.png
assets/tools/davinci-resolve.png
```

**Accepted formats:** PNG (recommended, especially with a transparent
background) or JPG. If you'd rather use SVG, tell your assistant and the
`<img>` tags can be pointed at `.svg` filenames instead.

**Recommended size:** roughly 128×128 to 512×512px, square, with the logo
mark centered (a transparent PNG works best since the badge already has its
own rounded background). No need to pre-crop tightly — a little padding
around the logo is fine.

**How it works:** just add the three files with those exact names — no code
changes needed. The moment a file exists at that path, the site shows it
automatically in place of the current stylized placeholder icon. If a file
is missing or fails to load, the placeholder stays visible so nothing ever
looks broken.

## Design reference
- Accent: `#7c5cff` (violet) · Secondary: `#ff6b45` (orange)
- Headings: Bebas Neue · Body: Montserrat · Labels/numbers: JetBrains Mono
