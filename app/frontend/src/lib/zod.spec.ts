import { describe, expect, test } from 'bun:test';
import { z } from './zod';

describe('zod wrapper', () => {
  test('z.object rejects unknown keys', () => {
    const schema = z.object({ name: z.string() });

    expect(schema.safeParse({ name: 'a' }).success).toBe(true);
    expect(schema.safeParse({ name: 'a', extra: 1 }).success).toBe(false);
  });

  test('non-object helpers still work', () => {
    expect(z.string().safeParse('a').success).toBe(true);
    expect(z.array(z.string()).safeParse(['a']).success).toBe(true);
  });
});
