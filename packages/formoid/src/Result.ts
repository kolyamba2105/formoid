import { Predicate } from "./Predicate";

export type Result<F, S> = Failure<F> | Success<S>;

export type Failure<F> = {
  id: "Failure";
  failure: F;
};

export const failure = <F>(failure: F): Result<F, never> => ({ id: "Failure", failure });

export function isFailure<F, S>(result: Result<F, S>): result is Failure<F> {
  return result.id === "Failure";
}

export type Success<S> = {
  id: "Success";
  success: S;
};

export const success = <S>(success: S): Result<never, S> => ({ id: "Success", success });

export function isSuccess<F, S>(result: Result<F, S>): result is Success<S> {
  return result.id === "Success";
}

export function fromPredicate<F, S>(predicate: Predicate<S>, onFailure: () => F) {
  return (value: S): Result<F, S> => (predicate(value) ? success(value) : failure(onFailure()));
}

export function extract<F, S>(result: Result<F, S>): S {
  if (isFailure(result)) {
    throw new Error(`Cannot extract 'success' from Result - ${JSON.stringify(result)}`);
  }

  return result.success;
}

export function map<F, A, B>(f: (a: A) => B, result: Result<F, A>): Result<F, B> {
  return isSuccess(result) ? success(f(result.success)) : failure(result.failure);
}
