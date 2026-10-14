/* Kudoshelf core. Original code (c) Jeremy Hodges. Self-hosted testimonial wall. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Kudoshelf = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var MAX_TEXT = 1200;
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    return /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : '';
  }
  function normalize(t) {
    t = t || {};
    var rating = Math.round(Number(t.rating));
    return {
      id: String(t.id || ('k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6))),
      name: String(t.name || '').trim().slice(0, 80),
      role: String(t.role || '').trim().slice(0, 120),
      text: String(t.text || '').trim().slice(0, MAX_TEXT),
      rating: rating >= 1 && rating <= 5 ? rating : 5,
      avatar: safeUrl(t.avatar),
      link: safeUrl(t.link),
      tags: (Array.isArray(t.tags) ? t.tags : String(t.tags || '').split(','))
        .map(function (x) { return String(x).trim().toLowerCase(); }).filter(Boolean).slice(0, 8),
      date: /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : new Date().toISOString().slice(0, 10),
      approved: t.approved === true,
      consent: t.consent === true
    };
  }
  function validate(t) {
    var e = [];
    if (!t || !String(t.name || '').trim()) e.push('name is required');
    if (!t || String(t.text || '').trim().length < 10) e.push('testimonial must be at least 10 characters');
    if (t && String(t.text || '').length > MAX_TEXT) e.push('testimonial is too long');
    if (!t || t.consent !== true) e.push('consent to publish is required');
    return e;
  }
  // Submission code: what a customer sends the owner (email/copy). base64url JSON.
  function b64enc(str) {
    if (typeof Buffer !== 'undefined') return Buffer.from(str, 'utf8').toString('base64');
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64dec(str) {
    if (typeof Buffer !== 'undefined') return Buffer.from(str, 'base64').toString('utf8');
    return decodeURIComponent(escape(atob(str)));
  }
  function encodeSubmission(t) {
    return 'KUDO1.' + b64enc(JSON.stringify(normalize(t))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeSubmission(code) {
    var m = /KUDO1\.([A-Za-z0-9_-]+)/.exec(String(code || ''));
    if (!m) throw new Error('not a Kudoshelf submission code');
    var s = m[1].replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var t = normalize(JSON.parse(b64dec(s)));
    t.approved = false; // owner must approve
    return t;
  }
  function select(list, opts) {
    opts = opts || {};
    var out = (list || []).map(normalize).filter(function (t) { return t.approved; });
    if (opts.tag) out = out.filter(function (t) { return t.tags.indexOf(String(opts.tag).toLowerCase()) >= 0; });
    if (opts.minRating) out = out.filter(function (t) { return t.rating >= opts.minRating; });
    out.sort(function (a, b) { return opts.sort === 'rating' ? (b.rating - a.rating) || (b.date < a.date ? -1 : 1) : (b.date < a.date ? -1 : b.date > a.date ? 1 : 0); });
    if (opts.limit) out = out.slice(0, opts.limit);
    return out;
  }
  function stars(n) { return '\u2605\u2605\u2605\u2605\u2605'.slice(0, n) + '\u2606\u2606\u2606\u2606\u2606'.slice(0, 5 - n); }
  function renderCard(t) {
    t = normalize(t);
    var name = escapeHtml(t.name);
    var who = t.link ? '<a href="' + escapeHtml(t.link) + '" rel="nofollow noopener" target="_blank">' + name + '</a>' : name;
    var av = t.avatar ? '<img class="ks-av" src="' + escapeHtml(t.avatar) + '" alt="" loading="lazy">'
      : '<span class="ks-av ks-ini">' + escapeHtml(t.name.charAt(0).toUpperCase()) + '</span>';
    return '<figure class="ks-card"><div class="ks-stars" aria-label="' + t.rating + ' out of 5">' + stars(t.rating) +
      '</div><blockquote>' + escapeHtml(t.text).replace(/\n/g, '<br>') + '</blockquote><figcaption>' + av +
      '<span><b>' + who + '</b>' + (t.role ? '<small>' + escapeHtml(t.role) + '</small>' : '') + '</span></figcaption></figure>';
  }
  function averageRating(list) {
    var s = select(list); if (!s.length) return 0;
    return Math.round(s.reduce(function (a, t) { return a + t.rating; }, 0) / s.length * 10) / 10;
  }
  function renderWall(list, opts) {
    var s = select(list, opts);
    if (!s.length) return '<p class="ks-empty">No testimonials yet.</p>';
    return '<div class="ks-wall">' + s.map(renderCard).join('') + '</div>';
  }
  var CSS = '.ks-wall{columns:300px;column-gap:16px}.ks-card{break-inside:avoid;margin:0 0 16px;padding:18px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;font:15px/1.5 system-ui,sans-serif;color:#111}' +
    '.ks-stars{color:#f59e0b;letter-spacing:2px}.ks-card blockquote{margin:8px 0 12px}.ks-card figcaption{display:flex;gap:10px;align-items:center}' +
    '.ks-av{width:36px;height:36px;border-radius:50%;object-fit:cover}.ks-ini{display:inline-flex;align-items:center;justify-content:center;background:#6d28d9;color:#fff;font-weight:700}' +
    '.ks-card small{display:block;color:#6b7280}.ks-card a{color:inherit}';
  // Browser embed: <div data-kudoshelf="testimonials.json" data-tag="" data-limit="6"></div>
  function mount(el) {
    var src = el.getAttribute('data-kudoshelf') || 'testimonials.json';
    return fetch(src).then(function (r) { return r.json(); }).then(function (list) {
      el.innerHTML = renderWall(list, { tag: el.getAttribute('data-tag'), limit: Number(el.getAttribute('data-limit')) || 0, sort: el.getAttribute('data-sort') });
    });
  }
  if (typeof document !== 'undefined') {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.addEventListener('DOMContentLoaded', function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-kudoshelf]'), mount);
    });
  }
  return { normalize: normalize, validate: validate, escapeHtml: escapeHtml, safeUrl: safeUrl, encodeSubmission: encodeSubmission,
    decodeSubmission: decodeSubmission, select: select, renderCard: renderCard, renderWall: renderWall, averageRating: averageRating, mount: mount, CSS: CSS };
});
