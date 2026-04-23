import type { FailureLike, FailureMatcher } from "@nohal/core";
import { matchFailure } from "@nohal/core";
import type { Result } from "neverthrow";
import type { TranslationKey } from "../../../i18n";
import type { ActionStatusParams, EditorStoreActionContext } from "./types";

type AnyFn = (...args: never[]) => unknown;
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type FailureOfResult<R> =
  R extends Result<unknown, infer E>
    ? E extends FailureLike
      ? E
      : never
    : never;

/**
 * Extracts the union of `neverthrow` failure types from an object tree.
 */
export type ExtractActionFailuresDeep<T> = T extends AnyFn
  ? FailureOfResult<UnwrapPromise<ReturnType<T>>>
  : T extends object
    ? {
        [K in keyof T]: ExtractActionFailuresDeep<T[K]>;
      }[keyof T]
    : never;

export type ActionStatusUpdate =
  | TranslationKey
  | readonly [key: TranslationKey, params: ActionStatusParams];

type ActionFailureReporterContext = Pick<
  EditorStoreActionContext,
  "setState" | "t"
>;

export function applyActionStatusUpdate(
  deps: ActionFailureReporterContext,
  update: ActionStatusUpdate | undefined,
): void {
  if (!update) return;
  if (typeof update === "string") {
    deps.setState("status", deps.t(update));
    return;
  }
  deps.setState("status", deps.t(update[0], update[1]));
}

export function createFailureReporter<E extends FailureLike>(
  deps: ActionFailureReporterContext,
  matcher: FailureMatcher<E, ActionStatusUpdate>,
): (error: E) => void {
  return (error) => {
    const update = matchFailure(
      error as FailureLike,
      matcher as unknown as FailureMatcher<FailureLike, ActionStatusUpdate>,
    );
    applyActionStatusUpdate(deps, update);
  };
}
