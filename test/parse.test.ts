import { describe, it, expect } from 'vitest';
import { parseTelHref } from '../src/parse';

const DC = { npa: '202', national: '2024561111', e164: '+12024561111' };

describe('parseTelHref: valid inputs all normalize to the same number', () => {
  it.each([
    'tel:+12024561111',
    'TEL:+1 (202) 456-1111',
    'Tel:+1 202 456 1111',
    'tel:1-202-456-1111',
    'tel:2024561111',
    'tel:202.456.1111',
    'tel:%2B12024561111',
    'tel:%2B1%20%28202%29%20456-1111',
    'tel:+12024561111;ext=22',
    'tel:+12024561111;ext=22;phone-context=example.com',
    'tel:+12024561111;phone-context=example.com',
    'tel:+12024561111?body=hello',
    'tel:+12024561111#frag',
    'tel:+12024561111;ext=22?body=x',
    '  tel:+12024561111  ',
    'tel:+1-202-456-1111',
    'tel:+1.202.456.1111',
  ])('parses %s', (href) => {
    expect(parseTelHref(href)).toEqual(DC);
  });
});

describe('parseTelHref: other NANP regions', () => {
  it('parses a Canadian number', () => {
    expect(parseTelHref('tel:+14168686937')).toEqual({
      npa: '416', national: '4168686937', e164: '+14168686937',
    });
  });
  it('parses a Caribbean (Jamaica 876) number', () => {
    expect(parseTelHref('tel:+18769291234')).toEqual({
      npa: '876', national: '8769291234', e164: '+18769291234',
    });
  });
});

describe('parseTelHref: rejected inputs return null', () => {
  it.each([
    'tel:+442071838750',
    'tel:+33123456789',
    'tel:+1202456111',
    'tel:+120245611112',
    'tel:+10115551234',
    'tel:+12020561111',
    'tel:',
    'tel:abc',
    'tel:+',
    '',
    '   ',
  ])('rejects %j', (href) => {
    expect(parseTelHref(href)).toBeNull();
  });

  it('rejects vanity letters', () => {
    expect(parseTelHref('tel:+1-800-FLOWERS')).toBeNull();
  });
  it('parses a non-tel: scheme – libphonenumber accepts it; content script filters anchors', () => {
    // The parser strips only a leading tel: prefix; libphonenumber-js will still parse
    // schemes like sms:+... . The content script only selects tel: anchors, so this is
    // harmless in practice. Documented as a finding.
    expect(parseTelHref('sms:+12024561111')).not.toBeNull();
  });
});

describe('parseTelHref: robustness', () => {
  it('does not throw on bad percent-encoding and returns null', () => {
    expect(() => parseTelHref('tel:%E0%A4%A')).not.toThrow();
    expect(parseTelHref('tel:%E0%A4%A')).toBeNull();
  });
  it('does not throw on a huge digit string and returns null', () => {
    const big = 'tel:' + '2'.repeat(10_000);
    expect(() => parseTelHref(big)).not.toThrow();
    expect(parseTelHref(big)).toBeNull();
  });
});
