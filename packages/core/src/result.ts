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

type FailureBase<
  Code extends FailureCode,
  Cause extends string,
  Detail extends string,
> = [Detail] extends [never]
  ? { code: Code; cause: Cause }
  : { code: Code; cause: Cause; detail: Detail };

export type EmptyMeta = Record<never, never>;

export type Failure<
  Code extends FailureCode = FailureCode,
  Cause extends string = string,
  Detail extends string = never,
  Meta extends object = EmptyMeta,
> = keyof Meta extends never
  ? FailureBase<Code, Cause, Detail>
  : FailureBase<Code, Cause, Detail> & {
      meta: Meta;
    };

export type NotFoundFailure<
  Cause extends string = string,
  Detail extends string = never,
  Meta extends object = EmptyMeta,
> = Failure<"not-found", Cause, Detail, Meta>;
export type InvalidInputFailure<
  Cause extends string = string,
  Detail extends string = never,
  Meta extends object = EmptyMeta,
> = Failure<"invalid-input", Cause, Detail, Meta>;
export type ConflictFailure<
  Cause extends string = string,
  Detail extends string = never,
  Meta extends object = EmptyMeta,
> = Failure<"conflict", Cause, Detail, Meta>;
export type ForbiddenFailure<
  Cause extends string = string,
  Detail extends string = never,
  Meta extends object = EmptyMeta,
> = Failure<"forbidden", Cause, Detail, Meta>;
export type UnsupportedFailure<
  Cause extends string = string,
  Detail extends string = never,
  Meta extends object = EmptyMeta,
> = Failure<"unsupported", Cause, Detail, Meta>;
export type InUseFailure<
  Cause extends string = string,
  Detail extends string = never,
  Meta extends object = EmptyMeta,
> = Failure<"in-use", Cause, Detail, Meta>;

export type EmptyNameFailure<
  Cause extends string = string,
  Meta extends object = EmptyMeta,
> = InvalidInputFailure<Cause, "empty-name", Meta>;
export type DuplicateNameFailure<
  Cause extends string = string,
  Meta extends object = EmptyMeta,
> = ConflictFailure<Cause, "duplicate-name", Meta>;

export interface FailureLike {
  code: FailureCode;
  cause: string;
  detail?: string;
  meta?: object;
}

type FailureMatcherLeaf<E extends FailureLike, R> = ((error: E) => R) | R;

function resolveFailureMatcherLeaf<E extends FailureLike, R>(
  entry: FailureMatcherLeaf<E, R>,
  error: E,
): R {
  return typeof entry === "function"
    ? (entry as (currentError: E) => R)(error)
    : entry;
}

type FailureMatcherByDetail<Error extends FailureLike, R> = Partial<
  {
    [Detail in Extract<Error["detail"], string>]: FailureMatcherLeaf<
      Extract<Error, { detail: Detail }>,
      R
    >;
  } & {
    _: FailureMatcherLeaf<Error, R>;
  }
>;

type FailureMatcherByCause<Error extends FailureLike, R> = Partial<
  {
    [Cause in Extract<Error["cause"], string>]: FailureMatcherByDetail<
      Extract<Error, { cause: Cause }>,
      R
    >;
  } & {
    _: FailureMatcherLeaf<Error, R>;
  }
>;

export type FailureMatcher<Error extends FailureLike, R> = Partial<{
  [Code in Error["code"]]: FailureMatcherByCause<
    Extract<Error, { code: Code }>,
    R
  >;
}> & {
  _?: FailureMatcherLeaf<Error, R>;
};

type StrictFailureMatcherByDetail<Error extends FailureLike, R> = Partial<
  {
    [Detail in Extract<Error["detail"], string>]: (
      error: Extract<Error, { detail: Detail }>,
    ) => R;
  } & {
    _: (error: Error) => R;
  }
>;

type StrictFailureMatcherByCause<Error extends FailureLike, R> = Partial<
  {
    [Cause in Extract<Error["cause"], string>]: StrictFailureMatcherByDetail<
      Extract<Error, { cause: Cause }>,
      R
    >;
  } & {
    _: (error: Error) => R;
  }
>;

type StrictFailureMatcher<Error extends FailureLike, R> = Partial<{
  [Code in Error["code"]]: StrictFailureMatcherByCause<
    Extract<Error, { code: Code }>,
    R
  >;
}> & {
  _?: (error: Error) => R;
};

export function matchFailure<E extends FailureLike, R>(
  error: E,
  matcher: StrictFailureMatcher<E, R>,
): R | undefined;
export function matchFailure<E extends FailureLike, R>(
  error: E,
  matcher: FailureMatcher<E, R>,
): R | undefined;
export function matchFailure<E extends FailureLike, R>(
  error: E,
  matcher: FailureMatcher<E, R>,
): R | undefined {
  const codeEntry = matcher[error.code as E["code"]];
  if (codeEntry) {
    const causeEntry = (codeEntry as Record<string, unknown>)[error.cause];
    if (causeEntry) {
      const detailEntry =
        error.detail !== undefined
          ? (causeEntry as Record<string, unknown>)[error.detail]
          : undefined;
      if (detailEntry !== undefined) {
        return resolveFailureMatcherLeaf(
          detailEntry as FailureMatcherLeaf<E, R>,
          error,
        );
      }
      if ((causeEntry as Record<string, unknown>)._ !== undefined) {
        return resolveFailureMatcherLeaf(
          (causeEntry as Record<string, unknown>)._ as FailureMatcherLeaf<E, R>,
          error,
        );
      }
    }
    if ((codeEntry as Record<string, unknown>)._ !== undefined) {
      return resolveFailureMatcherLeaf(
        (codeEntry as Record<string, unknown>)._ as FailureMatcherLeaf<E, R>,
        error,
      );
    }
  }
  return matcher._ === undefined
    ? undefined
    : resolveFailureMatcherLeaf(matcher._, error);
}
