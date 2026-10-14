# Kudoshelf

Self-hosted testimonial wall: collect, approve and embed customer testimonials. Static files only, free hosting on GitHub Pages, no monthly fee. An independent alternative to subscription testimonial tools; not affiliated with any of them.

## Setup (10 minutes)
1. Use this template, then in Settings → Pages set Source to **GitHub Actions**.
2. Edit `OWNER_EMAIL` in `collect.html`.
3. Share `collect.html` with customers. They get a `KUDO1.` code to email you.
4. Open `admin.html`, load, paste codes, approve, download `testimonials.json`, commit it.
5. Embed on any site:
```html
<script src="https://YOU.github.io/REPO/kudoshelf.js"></script>
<div data-kudoshelf="https://YOU.github.io/REPO/testimonials.json" data-limit="6" data-tag="" data-sort="rating"></div>
```
Tests: `npm test`. All output is HTML-escaped; only https links/avatars are allowed.
