export function getTotalPages(totalItems: number, itemsPerPage: number): number {
  if (itemsPerPage <= 0) return 0;
  return Math.ceil(totalItems / itemsPerPage);
}

export function sliceByPage<T>(items: T[], currentPage: number, itemsPerPage: number): T[] {
  const page = Math.max(1, currentPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return items.slice(startIndex, endIndex);
}
