// PM first, PD second, then everything else by name
export function sortRoles<T extends { name: string; systemKey?: string | null }>(roles: T[]): T[] {
  const rank = (r: T) => (r.systemKey === "PM" ? 0 : r.systemKey === "PD" ? 1 : 2);
  return [...roles].sort(
    (a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, undefined, { numeric: true })
  );
}
