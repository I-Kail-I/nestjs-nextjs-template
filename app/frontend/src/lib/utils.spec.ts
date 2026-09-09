import { describe, expect, it } from 'bun:test';
import { cn } from './utils';

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('resolves conflicting tailwind classes, last win', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('ignores falsy conditional values', () => {
    expect(cn('base', false && 'hidden', undefined, null, 'shown')).toBe('base shown');
  });

  it('supports object and array syntax', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
    expect(cn(['a', ['b', { c: true }]])).toBe('a b c');
  });

  it('returns empty string with no inputs', () => {
    expect(cn()).toBe('');
  });
});
