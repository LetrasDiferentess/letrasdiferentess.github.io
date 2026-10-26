import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hub = fs.readFileSync('us/library/index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('data/unicode-library-96.lock.json', 'utf8'));
const rows = manifest.categories.flatMap(category => category.articles);

test('Reader-first hub keeps the exact 96 locked articles and 12 live topic sections', () => {
  assert.equal(manifest.categories.length, 12);
  assert.equal(rows.length, 96);
  assert.ok(rows.every(row => row.status === 'PUBLISHED'));
  assert.equal((hub.match(/<section class="topic"/g) || []).length, 12);
  assert.equal((hub.match(/<div class="topic-heading">/g) || []).length, 12);
  assert.equal((hub.match(/<h4>Articles in this topic<\/h4>/g) || []).length, 12);
  for (const category of manifest.categories) {
    const marker = '<section class="topic" id="' + category.id + '"';
    const start = hub.indexOf(marker);
    assert.ok(start >= 0, category.id + ': category section');
    const stop = hub.indexOf('</section>', start);
    assert.ok(stop > start, category.id + ': category closing tag');
    const section = hub.slice(start, stop);
    assert.ok(section.includes('>' + category.articles.length + ' articles</span>'), category.id + ': reader-oriented count');
    const links = [...section.matchAll(/<li><a href="([^"]+)"/g)].map(hit => hit[1]);
    assert.deepEqual(links, category.articles.map(row => '/us/' + row.slug + '/'), category.id + ': exact links and order');
  }
  assert.ok(!hub.includes('total ·'));
  assert.ok(!hub.includes('Published technical references'));
  assert.ok(!hub.includes('Catalogued articles'));
  assert.ok(!hub.includes('planned articles'));
  assert.ok(!hub.includes('keyword targets'));
  assert.ok(!hub.includes('virtual silo'));
});

test('Library header is navigable, accessible, and locale list has no fabricated URLs', () => {
  assert.ok(hub.includes('<link rel="canonical" href="https://letrasdiferentess.github.io/us/library/">'));
  assert.ok(hub.includes('<a class="skip-link" href="#browse">'));
  assert.ok(hub.includes('aria-label="Library navigation"'));
  assert.ok(hub.includes('href="#areas"'));
  assert.ok(hub.includes('href="#about"'));
  assert.ok(hub.includes('<details class="tool-menu">'));
  assert.ok(hub.includes('href="/us/" lang="en-US"'));
  assert.ok(hub.includes('href="/" lang="pt-BR"'));
  assert.ok(hub.includes('href="/mx/" lang="es-MX"'));
  assert.equal((hub.match(/data-locale="/g) || []).length, 3);
  assert.ok(hub.includes('toolLinks.length>6'));
  assert.ok(hub.includes('max-height:min(50vh,390px)'));
  assert.ok(hub.includes('@media(max-width:700px)'));
  assert.ok(hub.includes('How to use this library'));
  assert.ok(hub.includes('href="/us/styled-unicode-text-vs-fonts/"'));
});
