export const groupBy = <T, K extends keyof T>(
  items: T[],
  key: K,
): Map<T[K], T[]> => {
  return items.reduce((acc, item) => {
    const groupKey = item[key];
    if (!acc.has(groupKey)) {
      acc.set(groupKey, []);
    }
    acc.get(groupKey)!.push(item);
    return acc;
  }, new Map<T[K], T[]>());
};
