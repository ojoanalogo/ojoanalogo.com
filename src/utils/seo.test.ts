import { describe, expect, it } from 'vitest';
import { absoluteUrl, formatTitle } from './seo';

describe('formatTitle', () => {
  it('uses the brand alone on the home page', () => {
    expect(formatTitle()).toBe('Alfonso Reyes');
    expect(formatTitle('Alfonso Reyes')).toBe('Alfonso Reyes');
  });

  it('joins a page title to the brand', () => {
    expect(formatTitle('Quién soy')).toBe('Quién soy · Alfonso Reyes');
  });
});

describe('absoluteUrl', () => {
  it('leaves absolute URLs untouched', () => {
    expect(absoluteUrl('https://cdn.example/me.jpg', 'https://ojoanalogo.com')).toBe(
      'https://cdn.example/me.jpg',
    );
  });

  it('resolves a site path against the base', () => {
    expect(absoluteUrl('/me.jpg', 'https://ojoanalogo.com')).toBe('https://ojoanalogo.com/me.jpg');
  });
});
