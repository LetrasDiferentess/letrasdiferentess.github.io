import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { auditLink, validateManifest, validateRepository } from './check-unicode-library-links.mjs';

const manifest = JSON.parse(fs.readFileSync('data/unicode-library-96.lock.json', 'utf8'));
const entries = validateManifest(manifest);
const first = entries[0].url;
const second = entries[1].url;
const common = {
  siteOrigin: manifest.siteOrigin,
  libraryHub: manifest.libraryHub,
  moneyPage: manifest.moneyPage,
  sourceUrl: first,
  allowedUrls: new Set(entries.map(x => x.url)),
  publishedUrls: new Set([first])
};

test('canonical registry contains exactly 96 URLs with expected categories', () => {
  assert.equal(entries.length, 96);
  assert.equal(new Set(entries.map(x => x.url)).size, 96);
  assert.equal(entries.every(x => x.status === 'PLANNED'), true);
});

test('valid internal URLs and category anchors are accepted', () => {
  assert.deepEqual(auditLink('/us/library/#unicode-characters', '', common), []);
  assert.deepEqual(auditLink('/us/', '', common), []);
  assert.deepEqual(auditLink(first, '', common), []);
  assert.deepEqual(auditLink('#usage-notes', '', common), []);
});

test('unknown internal paths and unpublished articles are rejected', () => {
  assert.match(auditLink('/us/unplanned-article/', '', common).join(' '), /unapproved/);
  assert.match(auditLink(second, '', common).join(' '), /PLANNED/);
});

test('GPT and marketing tracking parameters are rejected', () => {
  assert.match(auditLink(first + '?utm_source=chatgpt.com', '', common).join(' '), /tracking|query parameters/);
  assert.match(auditLink('https://unicode.org/versions/latest/?utm_source=chatgpt.com', 'nofollow', common).join(' '), /tracking/);
  assert.match(auditLink('https://unicode.org/?ref=chatgpt', 'nofollow', common).join(' '), /tracking/);
  assert.match(auditLink(first + '?arbitrary=value', '', common).join(' '), /query parameters/);
});

test('every external link requires rel nofollow', () => {
  assert.match(auditLink('https://unicode.org/reports/tr15/', '', common).join(' '), /nofollow/);
  assert.deepEqual(auditLink('https://unicode.org/reports/tr15/', 'nofollow noopener noreferrer', common), []);
  assert.deepEqual(auditLink('https://www.w3.org/TR/', 'NOFOLLOW', common), []);
  assert.match(auditLink('javascript:alert(1)', 'nofollow', common).join(' '), /disallowed/);
});

test('repository currently validates with 96 planned articles', () => {
  assert.equal(validateRepository(), true);
});
