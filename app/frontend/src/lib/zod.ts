import * as zod from 'zod';

/**
 * Shared zod instance for all frontend DTOs.
 *
 * @remarks
 * - `z.object` is `z.strictObject`: unknown keys fail validation instead of
 *   being silently stripped.
 * - Everything else is plain zod v4. Import from here, never from 'zod'.
 */
const z = { ...zod, object: zod.strictObject };

namespace z {
  export type infer<T extends zod.ZodType> = zod.infer<T>;
}

export { z };
