const test = require('node:test'); const assert = require('node:assert');
const K = require('../kudoshelf.js');
const good = { name: 'Ana', text: 'Great service, fast delivery.', rating: 5, consent: true, approved: true, date: '2026-10-01', tags: 'Agency, web' };
test('validate requires name, text, consent', () => {
  assert.deepStrictEqual(K.validate(good), []);
  assert.strictEqual(K.validate({ text: 'short' }).length, 3);
});
test('normalize clamps rating and tags', () => {
  const n = K.normalize({ name: 'x', rating: 9, tags: ' A ,b,' });
  assert.strictEqual(n.rating, 5); assert.deepStrictEqual(n.tags, ['a', 'b']); assert.strictEqual(n.approved, false);
});
test('renderCard escapes HTML (no XSS)', () => {
  const h = K.renderCard({ ...good, name: '<script>x</script>', text: '"><img onerror=1>' });
  assert.ok(!h.includes('<script>')); assert.ok(!h.includes('<img onerror')); assert.ok(h.includes('&lt;script&gt;'));
});
test('safeUrl only allows https', () => {
  assert.strictEqual(K.safeUrl('javascript:alert(1)'), ''); assert.strictEqual(K.safeUrl('http://a.com'), '');
  assert.strictEqual(K.safeUrl('https://a.com/p.png'), 'https://a.com/p.png');
});
test('submission code round-trips and forces unapproved', () => {
  const code = K.encodeSubmission({ ...good, text: 'Ünïcode works — 👍 really well' });
  assert.ok(code.startsWith('KUDO1.'));
  const t = K.decodeSubmission('Hi! here is my code: ' + code + ' thanks');
  assert.strictEqual(t.name, 'Ana'); assert.strictEqual(t.text, 'Ünïcode works — 👍 really well'); assert.strictEqual(t.approved, false);
  assert.throws(() => K.decodeSubmission('nope'));
});
test('select filters approved, tag, rating, sorts, limits', () => {
  const list = [good, { ...good, name: 'B', rating: 3, date: '2026-10-05' }, { ...good, name: 'C', approved: false }, { ...good, name: 'D', tags: 'saas', date: '2026-09-01' }];
  assert.deepStrictEqual(K.select(list).map(t => t.name), ['B', 'Ana', 'D']);
  assert.deepStrictEqual(K.select(list, { tag: 'agency' }).map(t => t.name), ['B', 'Ana']);
  assert.deepStrictEqual(K.select(list, { minRating: 4 }).map(t => t.name), ['Ana', 'D']);
  assert.deepStrictEqual(K.select(list, { sort: 'rating', limit: 1 }).map(t => t.name), ['Ana']);
  assert.strictEqual(K.averageRating(list), 4.3);
});
test('renderWall empty state', () => { assert.match(K.renderWall([]), /No testimonials yet/); });
