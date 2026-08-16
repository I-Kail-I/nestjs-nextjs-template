export function getPaginationParams(currentPage: number) {
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;

  return {
    skip,
    take: pageSize,
  };
}
