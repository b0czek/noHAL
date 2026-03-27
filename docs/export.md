# Export

This page covers what `Build` should mean in your workflow.

## What Build Does

`Build` generates output from the current NoHAL project state.

Treat that output as generated HAL that you still inspect, especially after:

- imports
- thread changes
- sheet restructuring
- export-stage changes
- component substitutions

## Before You Build

Run this checklist:

1. instance names are stable and readable
2. important signal names are explicit
3. root sheet thread outputs are bound correctly
4. `addf Queue` ordering looks intentional
5. component parameters and pin initial values are reviewed

## Main Questions to Ask After Build

- Did the generated thread definitions match your expectation?
- Did `addf` routing land in the right final threads?
- Did postgui-related behavior end up in the right place?
- Did imported or generated components expand the way you intended?

## Export as a Verification Step

During active editing, export is not only a final delivery step. It is also the fastest way to check whether your current mental model matches the app's model.

Build early when you change:

- scheduling
- sheet boundaries
- import links
- machine-level settings

## Related Pages

- [Quickstart](/quickstart)
- [Threads and addf](/threads-and-addf)
