export function randomizeOrder<T extends {weight?: number}>(items: T[]) {
  let remaining = items.slice();
  const result = [];
  while (remaining.length > 1) {
    const item = randomWeighted(remaining)!;
    result.push(item);
    remaining = remaining.filter((anItem) => anItem !== item);
  }
  result.push(...remaining);
  return result;
}

export function randomWeighted<T extends {weight?: number}>(objects: T[], defaultWeight = 1) {
  const totalWeight = objects.reduce((agg, object) => agg + (object.weight ?? defaultWeight), 0);

  const randomNumber = Math.random() * totalWeight;

  let weightSum = 0;
  for (const object of objects) {
    weightSum += object.weight ?? defaultWeight;
    if (randomNumber <= weightSum) return object;
  }
  return undefined;
}
