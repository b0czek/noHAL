# AGENTS

- After each completed job that meaningfully modified the code, run the relevant lint and test commands and fix any issues before finishing.
- use remeda when it improves the shape of the code, keep native methods when they are already the clearest form
- for new interfaces that model success/failure, use `neverthrow` as the default approach unless there is a clear reason not to
- when using `neverthrow` for new result-style interfaces, prefer `Result<Change<T>, Failure<...>>` with object errors using `code`; see `packages/core/src/types/base.ts` for the shared `Change` and `Failure` types, and avoid string errors and ad-hoc wrapper abstractions around `neverthrow`
