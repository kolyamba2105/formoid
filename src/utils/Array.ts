/**
 * NonEmptyArray
 */
export type NonEmptyArray<A> = [A, ...Array<A>];

export function map<A, B>(ab: (a: A) => B, as: NonEmptyArray<A>): NonEmptyArray<B> {
  return as.map(ab) as NonEmptyArray<B>;
}

export function isNonEmpty<A>(as: Array<A>): as is NonEmptyArray<A> {
  return as.length > 0;
}

export function isOutOfBound<A>(index: number, as: Array<A>): boolean {
  return index < 0 || index >= as.length;
}

export function append<A>(a: A, as: Array<A>): Array<A> {
  return [...as, a];
}

export function modifyAt<A>(index: number, fn: (a: A) => A, as: Array<A>): Array<A> | null {
  if (isOutOfBound(index, as)) {
    return null;
  }

  const result = as.slice();

  result[index] = fn(result[index]);

  return result;
}

export function deleteAt<A>(index: number, as: Array<A>): Array<A> | null {
  if (isOutOfBound(index, as)) {
    return null;
  }

  const result = as.slice();

  result.splice(index, 1);

  return result;
}
