/**
 * Calculates database pagination parameters based on a 1-indexed page number.
 *
 * @param currentPage - The target page number (1-indexed).
 * @returns An object containing `skip` (offset) and `take` (limit) values for ORM queries.
 *
 * @example
 * getPaginationParams(1) // { skip: 0, take: 10 }
 * getPaginationParams(3) // { skip: 20, take: 10 }
 */
export function getPaginationParams(currentPage: number) {
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;

  return {
    skip,
    take: pageSize,
  };
}
