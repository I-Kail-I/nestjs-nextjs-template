import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class names, resolving conflicts in favor of the last
 * class. Combines `clsx` (conditional class handling) with `tailwind-merge`
 * (conflict resolution).
 *
 * @param inputs - Class names, including conditionals (`false`, `null`,
 * `undefined`) and nested arrays/objects.
 * @returns A single string of merged, de-duplicated class names.
 * @example
 * cn('px-2 py-1', isActive && 'bg-blue-500', ['rounded', { hidden: !isActive }]);
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
