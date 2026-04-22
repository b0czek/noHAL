# AGENTS

- After each completed job that meaningfully modified the code, run the relevant lint and test commands and fix any issues before finishing.
- use remeda when it improves the shape of the code, keep native methods when they are already the clearest form
- for new interfaces that model success/failure, use `neverthrow` as the default approach unless there is a clear reason not to
- when using `neverthrow` for new result-style interfaces, prefer `Result<Change<T>, Failure<...>>` with object errors using `code`; see `packages/core/src/result.ts` for the shared `Change`, `Failure`, and `matchFailure` helpers. For methods that won't fail, you can use just the Change<T>, without forcing the use of Result. We shouldn't ignore failures returned from an function and handle all of them, at least with the default case.