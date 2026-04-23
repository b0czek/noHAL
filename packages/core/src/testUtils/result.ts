import type { Result } from "neverthrow";
import { expect } from "vitest";

export function expectOk<T, E>(result: Result<T, E>): T {
  expect(result.isOk()).toBe(true);
  if (result.isErr()) throw new Error("expected ok result");
  return result.value;
}

export function expectErr<T, E>(result: Result<T, E>): E {
  expect(result.isErr()).toBe(true);
  if (result.isOk()) throw new Error("expected err result");
  return result.error;
}
