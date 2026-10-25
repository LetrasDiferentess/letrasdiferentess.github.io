import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryFile = path.join(root, 'data/unicode-library-96.lock.json');
const PINNED_URLS_SHA256 = '59d5a23d48ee7631c0653afe313444fdea2ff45cd6049b38e4076c7e0aa0e5ec';
const EXPECTED_CATEGORY_COUNTS = [8, 8, 8, 10, 8, 10, 9, 9, 6, 7, 5, 8];

export function validateManifest(manifest) {
  assert.equal(manifest.schemaVersion, 1, 'registry schema version');
  assert.equal(manifest.siteOrigin, 'https://letrasdiferentess.github.io', 'fixed website origin');
  assert.equal(manifest.libraryHub, manifest.siteOrigin + '/us/library/', 'fixed library hub');
  assert.equal(manifest.moneyPage, manifest.siteOrigin + '/us/', 'fixed US money page');
  assert.equal(manifest.lockedCount, 96, 'fixed URL count');
  assert.equal(manifest.categories.length, 12, '12 virtual-silo categories');
  const seenIds = new Set();
  const entries = [];
  for (const [i, cat] of manifest.categories.entries()) {
    assert.equal(cat.order, i + 1, 'category sequence');
    assert.ok(/^[a-z0-9-]+$/.test(cat.id), 'category id');
    assert.ok(!seenIds.has(cat.id), 'duplicate category id');
    seenIds.add(cat.id);
    assert.equal(cat.articles.length, EXPECTED_CATEGORY_COUNTS[i], 'category ' + cat.id + ' article count');
    for (const entry of cat.articles) {
      assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug), 'invalid slug: ' + entry.slug);
      assert.equal(entry.url, manifest.siteOrigin + '/us/' + entry.slug + '/', 'canonical URL mismatch');
      assert.ok(['PLANNED', 'PUBLISHED'].includes(entry.status), 'invalid publication status');
      entries.push({ ...entry, categoryId: cat.id });
    }
  }
  assert.equal(entries.length, 96, 'must contain exactly 96 articles');
  const urls = entries.map(x => x.url);
  assert.equal(new Set(urls).size, 96, 'duplicate URL');
  const fingerprint = createHash('sha256').update(urls.join('\n') + '\n', 'utf8').digest('hex');
  assert.equal(manifest.canonicalUrlsSha256, PINNED_URLS_SHA256, 'manifest URL fingerprint changed');
  assert.equal(fingerprint, PINNED_URLS_SHA256, 'canonical URL list has changed or reordered');
  return entries;
}

const trackingKey = /^(utm_.+|gclid|dclid|fbclid|msclkid|igshid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|gpt|chatgpt|ai_source)$/i;
const trackingValue = /(?:chatgpt|openai|(?:^|[\W_])gpt(?:$|[\W_]))/i;

export function auditLink(href, rel, context) {
  const issues = [];
  if (!href || !href.trim()) return ['empty href'];
  const raw = href.trim().replace(/&amp;/gi, '&');
  let target;
  try {
    target = new URL(raw, context.sourceUrl);
  } catch {
    return ['malformed URL: ' + href];
  }
  if (['mailto:', 'tel:'].includes(target.protocol)) return issues;
  if (!['http:', 'https:'].includes(target.protocol)) return ['disallowed URL scheme: ' + target.protocol];
  for (const [key, value] of target.searchParams) {
    if (trackingKey.test(key) || (/^(source|ref|referrer|via|campaign)$/i.test(key) && trackingValue.test(value))) {
      issues.push('tracking parameter not allowed: ' + key);
    }
  }
  if (target.origin !== context.siteOrigin) {
    const tokens = (rel || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.includes('nofollow')) issues.push('external link missing rel="nofollow": ' + href);
    return issues;
  }
  if (target.search) issues.push('internal links must have no query parameters: ' + href);
  const canonical = target.origin + target.pathname;
  if (canonical !== context.libraryHub && canonical !== context.moneyPage && !context.allowedUrls.has(canonical)) {
    issues.push('unapproved internal URL: ' + href);
  }
  if (context.allowedUrls.has(canonical) && !context.publishedUrls.has(canonical)) {
    issues.push('internal link points to a PLANNED/404 article: ' + href);
  }
  return issues;
}

function getAttribute(tag, name) {
  const pattern = new RegExp('(?:\\s)' + name + '\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27|([^\\s>]+))', 'i');
  const match = tag.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

function validateArticleLinks(html, url, context) {
  const problems = [];
  const anchorTags = html.match(/<a\b[^>]*>/gi) || [];
  for (const tag of anchorTags) {
    const href = getAttribute(tag, 'href');
    const rel = getAttribute(tag, 'rel');
    for (const problem of auditLink(href, rel, { ...context, sourceUrl: url })) {
      problems.push(url + ': ' + problem);
    }
  }
  return problems;
}

export function validateRepository() {
  const manifest = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  const entries = validateManifest(manifest);
  const allowedUrls = new Set(entries.map(x => x.url));
  const publishedUrls = new Set(entries.filter(x => x.status === 'PUBLISHED').map(x => x.url));
  const problems = [];
  const hubHtml = fs.readFileSync(path.join(root, 'us/library/index.html'), 'utf8');
  for (const cat of manifest.categories) {
    if (!hubHtml.includes('id="' + cat.id + '"')) problems.push('library hub missing category anchor: #' + cat.id);
  }
  for (const entry of entries) {
    const articleFile = path.join(root, 'us', entry.slug, 'index.html');
    const exists = fs.existsSync(articleFile);
    if (entry.status === 'PUBLISHED' && !exists) problems.push(entry.url + ': marked PUBLISHED but index.html is missing');
    if (entry.status === 'PLANNED' && exists) problems.push(entry.url + ': file exists but still marked PLANNED; verify publication first');
    if (!exists) continue;
    const html = fs.readFileSync(articleFile, 'utf8');
    problems.push(...validateArticleLinks(html, entry.url, {
      siteOrigin: manifest.siteOrigin,
      libraryHub: manifest.libraryHub,
      moneyPage: manifest.moneyPage,
      allowedUrls, publishedUrls
    }));
    if (!hubHtml.includes(entry.url) && !hubHtml.includes('/us/' + entry.slug + '/')) {
      problems.push(entry.url + ': published article is not linked from the virtual-silo hub');
    }
  }
  if (problems.length) {
    console.error('UNICODE LIBRARY POLICY VIOLATIONS (' + problems.length + '):');
    for (const error of problems) console.error(' - ' + error);
    return false;
  }
  console.log('PASS: 12 categories, 96 fixed canonical URLs, SHA-256 ' + PINNED_URLS_SHA256);
  console.log('PASS: ' + publishedUrls.size + ' published article(s) verified, ' + (96 - publishedUrls.size) + ' planned, no invented/tracked/nofollow-violating links');
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!validateRepository()) process.exitCode = 1;
  } catch (error) {
    console.error('FAIL: ' + String(error));
    process.exitCode = 1;
  }
}
