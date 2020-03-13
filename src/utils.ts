/* Utils */

/**
 * Determines whether a value is null.
 * @param v
 */
export function notNull<T>(v: T | null): v is T {
  return v !== null
}

/**
 * Flattens an array of arrays to a single array.
 * @param xss
 */
export function flatten<T>(xss: T[][]): T[] {
  return xss.reduce((acc, xs) => acc.concat(xs), [])
}

/**
 * Creates an object from entries.
 * @param entries
 */
export function objectFromEntries<T>(
  entries: [string, T][],
): { [key: string]: T } {
  return entries.reduce((acc, [key, value]) => {
    return {
      ...acc,
      [key]: value,
    }
  }, {})
}
