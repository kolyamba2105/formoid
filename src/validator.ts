import { NonEmptyArray, isNonEmpty, of } from "./Array";
import { Predicate, Refinement } from "./Predicate";
import {
  Result,
  failure,
  isFailure,
  isSuccess,
  map,
  fromPredicate as resultFromPredicate,
  success,
} from "./Result";

export type Validator<I, O> = (input: I) => Promise<Result<NonEmptyArray<string>, O>>;

export function fromPredicate<A, B extends A>(
  predicate: Refinement<A, B>,
  message: string,
): Validator<A, B>;

export function fromPredicate<A>(predicate: Predicate<A>, message: string): Validator<A, A>;

export function fromPredicate<A>(predicate: Predicate<A>, message: string) {
  return function (input: A) {
    return Promise.resolve(resultFromPredicate(predicate, () => of(message))(input));
  };
}

export function tryCatch<I, A, O>(
  action: (input: I) => Promise<A>,
  { onFailure, onSuccess }: { onFailure: (value: unknown) => string; onSuccess: (value: A) => O },
): Validator<I, O> {
  return async function (input: I) {
    try {
      return success(onSuccess(await action(input)));
    } catch (issue) {
      return failure(of(onFailure(issue)));
    }
  };
}

export function transform<I, A, B>(f: (a: A) => B): (validator: Validator<I, A>) => Validator<I, B>;

export function transform<I, A, B>(f: (a: A) => B, validator: Validator<I, A>): Validator<I, B>;

export function transform<I, A, B>(f: (a: A) => B, validator?: Validator<I, A>) {
  if (validator !== undefined) {
    return async (input: I) => Promise.resolve(map(f, await validator(input)));
  }

  return (validator: Validator<I, A>) => transform(f, validator);
}

function flatMap<A, B>(result: ReturnType<Validator<unknown, A>>, f: Validator<A, B>) {
  return result.then((r) => (isSuccess(r) ? f(r.success) : failure(r.failure)));
}

export function chain<I, A, O>(ao: Validator<A, O>): (ia: Validator<I, A>) => Validator<I, O> {
  return (ia) => (input) => flatMap(ia(input), ao);
}

/**
 * Sequence
 *
 * Fast-failing validation - returns a `NonEmptyArray<string>` once some
 * validation fails
 */
export function sequence<I, A, O>(a: Validator<I, A>, b: Validator<A, O>): Validator<I, O>;

export function sequence<I, A, B, O>(
  a: Validator<I, A>,
  b: Validator<A, B>,
  c: Validator<B, O>,
): Validator<I, O>;

export function sequence<I, A, B, C, O>(
  a: Validator<I, A>,
  b: Validator<A, B>,
  c: Validator<B, C>,
  d: Validator<C, O>,
): Validator<I, O>;

export function sequence<I, A, B, C, D, O>(
  a: Validator<I, A>,
  b: Validator<A, B>,
  c: Validator<B, C>,
  d: Validator<C, D>,
  e: Validator<D, O>,
): Validator<I, O>;

export function sequence<I, A, B, C, D, E, O>(
  a: Validator<I, A>,
  b: Validator<A, B>,
  c: Validator<B, C>,
  d: Validator<C, D>,
  e: Validator<D, E>,
  f: Validator<E, O>,
): Validator<I, O>;

export function sequence<I, A, B, C, D, E, F, O>(
  a: Validator<I, A>,
  b: Validator<A, B>,
  c: Validator<B, C>,
  d: Validator<C, D>,
  e: Validator<D, E>,
  f: Validator<E, F>,
  g: Validator<F, O>,
): Validator<I, O>;

export function sequence<I, A, B, C, D, E, F, G, O>(
  a: Validator<I, A>,
  b: Validator<A, B>,
  c: Validator<B, C>,
  d: Validator<C, D>,
  e: Validator<D, E>,
  f: Validator<E, F>,
  g: Validator<F, G>,
  h: Validator<G, O>,
): Validator<I, O>;

export function sequence<I, A, B, C, D, E, F, G, H, O>(
  a: Validator<I, A>,
  b: Validator<A, B>,
  c: Validator<B, C>,
  d: Validator<C, D>,
  e: Validator<D, E>,
  f: Validator<E, F>,
  g: Validator<F, G>,
  h: Validator<G, H>,
  i: Validator<H, I>,
): Validator<I, O>;

export function sequence(
  ...validators: NonEmptyArray<Validator<unknown, unknown>>
): Validator<unknown, unknown> {
  return function (input) {
    return validators.reduce(
      flatMap,
      Promise.resolve(success(input)) as ReturnType<Validator<unknown, unknown>>,
    );
  };
}

/**
 * Parallel
 *
 * Applies validators in parallel and collects all validation errors
 */
export function parallel<I, O>(a: Validator<I, O>, b: Validator<I, O>): Validator<I, O>;

export function parallel<I, O>(
  a: Validator<I, O>,
  b: Validator<I, O>,
  c: Validator<I, O>,
): Validator<I, O>;

export function parallel<I, O>(
  a: Validator<I, O>,
  b: Validator<I, O>,
  c: Validator<I, O>,
  d: Validator<I, O>,
): Validator<I, O>;

export function parallel<I, O>(
  a: Validator<I, O>,
  b: Validator<I, O>,
  c: Validator<I, O>,
  d: Validator<I, O>,
  e: Validator<I, O>,
): Validator<I, O>;

export function parallel<I, O>(
  a: Validator<I, O>,
  b: Validator<I, O>,
  c: Validator<I, O>,
  d: Validator<I, O>,
  e: Validator<I, O>,
  f: Validator<I, O>,
): Validator<I, O>;

export function parallel<I, O>(
  a: Validator<I, O>,
  b: Validator<I, O>,
  c: Validator<I, O>,
  d: Validator<I, O>,
  e: Validator<I, O>,
  f: Validator<I, O>,
  g: Validator<I, O>,
): Validator<I, O>;

export function parallel<I, O>(
  a: Validator<I, O>,
  b: Validator<I, O>,
  c: Validator<I, O>,
  d: Validator<I, O>,
  e: Validator<I, O>,
  f: Validator<I, O>,
  g: Validator<I, O>,
  h: Validator<I, O>,
): Validator<I, O>;

export function parallel<I, O>(
  a: Validator<I, O>,
  b: Validator<I, O>,
  c: Validator<I, O>,
  d: Validator<I, O>,
  e: Validator<I, O>,
  f: Validator<I, O>,
  g: Validator<I, O>,
  h: Validator<I, O>,
  i: Validator<I, O>,
): Validator<I, O>;

export function parallel<I, O>(
  ...validators: NonEmptyArray<Validator<I, O>>
): Validator<I, unknown> {
  return async function (input) {
    const failures = (await Promise.all(validators.map((validator) => validator(input)))).flatMap(
      (result) => (isFailure(result) ? result.failure : []),
    );

    return isNonEmpty(failures) ? failure(failures) : success(input);
  };
}

/**
 * NonNullable
 */
function isNonNullable<A>(value: A): value is NonNullable<A> {
  return value !== null && value !== undefined;
}

export function defined<A>(message: string): Validator<A, NonNullable<A>> {
  return fromPredicate(isNonNullable, message);
}

/**
 * Apply validator if predicate/refinement returns true, otherwise treat value as valid
 *
 * Example:
 * Validate whether value's length is >= 5 only if value is a non-blank string,
 * otherwise treat value as valid
 *
 * const result = validator.validateIf(isNonBlankString, validator.minLength(5));
 */
export function validateIf<A, B extends A, O>(
  refinement: Refinement<A, B>,
  innerValidator: Validator<B, O>,
): Validator<A, A | O>;

export function validateIf<I, O>(
  predicate: Predicate<I>,
  innerValidator: Validator<I, O>,
): Validator<I, I | O>;

export function validateIf<I, O>(predicate: Predicate<I>, innerValidator: Validator<I, O>) {
  return (input: I) => (predicate(input) ? innerValidator(input) : Promise.resolve(success(input)));
}

/**
 * Basic validators
 */
export function min<T extends number>(min: number, message: string): Validator<T, T> {
  return fromPredicate((value: T) => value >= min, message);
}

export function max<T extends number>(max: number, message: string): Validator<T, T> {
  return fromPredicate((value: T) => value <= max, message);
}

export function range<T extends number>(
  min: number,
  max: number,
  message: string,
): Validator<T, T> {
  return fromPredicate((value: T) => value >= min && value <= max, message);
}

export function minLength<T extends string>(min: number, message: string): Validator<T, T> {
  return fromPredicate((value: T) => value.trim().length >= min, message);
}

export function maxLength<T extends string>(max: number, message: string): Validator<T, T> {
  return fromPredicate((value: T) => value.trim().length <= max, message);
}

export function lengthRange<T extends string>(
  min: number,
  max: number,
  message: string,
): Validator<T, T> {
  return fromPredicate(
    (value: T) => value.trim().length >= min && value.trim().length <= max,
    message,
  );
}

export function match<T extends string>(pattern: RegExp, message: string): Validator<T, T> {
  return fromPredicate((value: T) => pattern.test(value), message);
}
