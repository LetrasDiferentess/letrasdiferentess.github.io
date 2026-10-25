import test from 'node:test';
import assert from 'node:assert/strict';

// Batch 3 data-level regression tests. Unicode code-point values are from
// Unicode Standard 18.0.0, Chapter 22 and the official UCD code charts.
// These are separate from visual font rendering and site-link policy tests.

const hex = text => [...text].map(ch => ch.codePointAt(0).toString(16).toUpperCase());
const norm = (text, form='NFKC') => text.normalize(form);

test('mathematical Latin bold / italic / script starts, BMP script exception', () => {
  assert.deepEqual(hex('𝐀𝐚𝐴𝑨𝒜𝓐'), [
    '1D400', '1D41A', '1D434', '1D468', '1D49C', '1D4D0'
  ]);
  assert.deepEqual(hex('ℬ'), ['212C']); // script B BMP exception
  assert.equal(norm('ℬ'), 'B');
  assert.equal(norm('𝒜', 'NFC'), '𝒜');
  assert.equal(norm('𝒜'), 'A');
});

test('Fraktur and double-struck legacy holes map to BMP', () => {
  const fraktur = {C:'ℭ', H:'ℌ', I:'ℑ', R:'ℜ', Z:'ℨ'};
  const frakturExpected = {C:'212D', H:'210C', I:'2111', R:'211C', Z:'2128'};
  const double = {C:'ℂ',H:'ℍ',N:'ℕ',P:'ℙ',Q:'ℚ',R:'ℝ',Z:'ℤ'};
  const doubleExpected = {C:'2102',H:'210D',N:'2115',P:'2119',Q:'211A',R:'211D',Z:'2124'};
  for (const [key, symbol] of Object.entries(fraktur)) {
    assert.deepEqual(hex(symbol), [frakturExpected[key]]);
    assert.equal(norm(symbol), key);
  }
  for (const [key, symbol] of Object.entries(double)) {
    assert.deepEqual(hex(symbol), [doubleExpected[key]]);
    assert.equal(norm(symbol), key);
  }
  assert.deepEqual(hex('𝔄𝔞𝕬𝔸𝕒𝟘'), [
    '1D504','1D51E','1D56C','1D538','1D552','1D7D8'
  ]);
});

test('circled/enclosed symbols have different compatibility behavior', () => {
  assert.equal(norm('①'), '1');
  assert.equal(norm('⑩'), '10');
  assert.equal(norm('⑳'), '20');
  assert.equal(norm('⓪'), '0');
  assert.equal(norm('Ⓐ'), 'A');
  assert.equal(norm('ⓐ'), 'a');
  assert.equal(norm('⑴'), '(1)');
  assert.equal(norm('⒈'), '1.');
  assert.equal(norm('㉑'), '21');
  assert.equal(norm('⓵'), '⓵'); // double circle atomic
  assert.equal(norm('⓫'), '⓫'); // negative circle atomic
  assert.equal(norm('🅐'), '🅐'); // negative circled capital A
  assert.notEqual(norm('A\u20DD'), norm('Ⓐ')); // not canonically equivalent
});

test('fullwidth, halfwidth Katakana and small forms fold correctly', () => {
  assert.deepEqual(hex('Ａ'), ['FF21']);
  assert.deepEqual(hex('！'), ['FF01']);
  assert.deepEqual(hex('～'), ['FF5E']);
  assert.deepEqual(hex('﹐'), ['FE50']);
  assert.deepEqual(hex('﹫'), ['FE6B']);
  assert.equal(norm('ＡＢＣ１２３'), 'ABC123');
  assert.equal(norm('ｶﾞ'), 'ガ');
  assert.equal(norm('ｶﾞ').length, 1);
  assert.equal(norm('　'), ' ');
  assert.equal(norm('﹐'), ',');
  assert.equal(norm('﹫'), '@');
  assert.equal(norm('Ａ', 'NFC'), 'Ａ');
  function widenAscii(str, space=false) {
    return [...str].map(ch => {
      const cp = ch.codePointAt(0);
      return cp>=0x21 && cp<=0x7E ?
        String.fromCodePoint(cp+0xFEE0) :
        (space && cp===0x20 ? '\u3000' : ch);
    }).join('');
  }
  assert.equal(widenAscii('Hi! 25'), 'Ｈｉ！ ２５');
  assert.equal(widenAscii('A B', true), 'Ａ　Ｂ');
  assert.equal(norm(widenAscii('Hello 42', true)), 'Hello 42');
});

test('all ten superscript and subscript digits are exact', () => {
  const sup=['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹'];
  const sub=['₀','₁','₂','₃','₄','₅','₆','₇','₈','₉'];
  const cps=['2070','B9','B2','B3','2074','2075','2076','2077','2078','2079'];
  for (let i=0;i<10;i++) {
    assert.deepEqual(hex(sup[i]),[cps[i]]);
    assert.deepEqual(hex(sub[i]),[(0x2080+i).toString(16).toUpperCase()]);
    assert.equal(norm(sup[i]), String(i));
    assert.equal(norm(sub[i]), String(i));
  }
  assert.equal(norm('ₓ'), 'x');
  assert.equal(norm('⁻'), '−'); // U+2212, NOT ASCII hyphen-minus
  assert.equal(norm('¹⁰'), '10');
  assert.equal(norm('H₂O'), 'H2O');
});

test('supplementary mathematical glyphs are single scalar but two UTF-16 units', () => {
  for (const sample of ['𝐀','𝔄','𝔸','𝒜']) {
    assert.equal([...sample].length, 1);
    assert.equal(sample.length, 2);
    assert.equal(new TextEncoder().encode(sample).length, 4);
  }
});
