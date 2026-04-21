import type { Result } from "neverthrow";

export interface Change<T> {
  data: T;
  changed: boolean;
}

export type ChangeResult<T, E = never> = Result<Change<T>, E>;

export type FailureCode =
  | "not-found"
  | "invalid-input"
  | "conflict"
  | "forbidden"
  | "unsupported"
  | "in-use"
  | "other";

export type Failure<
  C extends FailureCode = FailureCode,
  D extends string = never,
> = [D] extends [never] ? { code: C } : { code: C; detail: D };

export type NotFoundFailure<D extends string = never> = Failure<"not-found", D>;
export type InvalidInputFailure<D extends string = never> = Failure<
  "invalid-input",
  D
>;
export type ConflictFailure<D extends string = never> = Failure<"conflict", D>;
export type ForbiddenFailure<D extends string = never> = Failure<
  "forbidden",
  D
>;
export type UnsupportedFailure<D extends string = never> = Failure<
  "unsupported",
  D
>;
export type InUseFailure<D extends string = never> = Failure<"in-use", D>;

export type EmptyNameFailure = InvalidInputFailure<"empty-name">;
export type DuplicateNameFailure = ConflictFailure<"duplicate-name">;

export interface FailureLike {
  code: FailureCode;
  detail?: string;
}

type FailureMatcherByDetail<
  E extends FailureLike,
  C extends E["code"],
  R,
> = Partial<Record<string | "_", (error: Extract<E, { code: C }>) => R>>;

type FailureMatcherEntry<E extends FailureLike, C extends E["code"], R> =
  | ((error: Extract<E, { code: C }>) => R)
  | FailureMatcherByDetail<E, C, R>;

export type FailureMatcher<E extends FailureLike, R> = Partial<{
  [C in E["code"]]: FailureMatcherEntry<E, C, R>;
}> & {
  _?: (error: E) => R;
};

export function matchFailure<E extends FailureLike, R>(
  error: E,
  matcher: FailureMatcher<E, R>,
): R | undefined {
  const entry = matcher[error.code as E["code"]];
  if (typeof entry === "function") {
    return (entry as (error: E) => R)(error);
  }
  if (entry) {
    const handlers = entry as Record<string, (error: E) => R>;
    if (error.detail) {
      const detailHandler = handlers[error.detail];
      if (detailHandler) {
        return detailHandler(error);
      }
    }
    if (handlers._) {
      return handlers._(error);
    }
  }
  return matcher._?.(error);
}
