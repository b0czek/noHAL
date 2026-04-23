# Core Test Utilities

Check this directory before adding custom test helpers or hand-rolling common assertions in core tests.

- Use `expectOk` and `expectErr` from `result.ts` when asserting `neverthrow` results. They narrow the result type and keep tests readable.
- Use `createMemoryIo` from `memoryIo.ts` for tests that need filesystem-like IO without touching disk.
- Add new helpers here when the same test setup or assertion pattern appears in multiple core test files.

