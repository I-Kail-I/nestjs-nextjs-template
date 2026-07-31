import { z } from 'zod';

export function date() {
  const schema = z.date();
  Object.defineProperty(schema._zod, 'toJSONSchema', {
    value: () => ({ type: 'string', format: 'date-time' }),
    configurable: true,
  });
  return schema;
}
