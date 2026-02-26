# Threads in NoHAL

This document describes the current thread model in NoHAL and how it affects
`addf` scheduling and HAL export.

## Concepts

NoHAL now has two thread layers:

1. `Project HAL threads` (real machine threads)
2. `Sheet thread outputs` (local scheduling lanes inside a sheet)

These are intentionally different.

### Project HAL Threads (real)

Stored on the project as `project.halThreads[]`.

Each HAL thread has:

- `id` (stable identity)
- `name` (for example `servo-thread`, `base-thread`)
- `periodNs` (stored, editable, and exported in `loadrt threads`)
- `floatMode` (`fp` or `nofp`)

These are managed in the global `Threads` dialog.

### Sheet Thread Outputs (local / abstract)

Stored on each sheet as `sheet.hal.threadOutputs[]`.

Each sheet thread output has:

- `id` (stable identity inside the sheet)
- `name` (local lane name, default is `main`)
- `halThreadId?` (explicit binding to a project HAL thread; used for root sheet export)

A sheet thread output is not automatically a real HAL thread.

## Queue Model (`addf`)

`sheet.hal.addfQueue` stores queue entries for component instances and
component functions.

Each queue entry can include:

- `sheetThreadOutputId`

This means queue scheduling is expressed in terms of the sheet's local outputs,
not directly in HAL thread names.

In the UI (`Sheet Settings`):

- queue rows are grouped by sheet thread output
- drag within a group reorders within that output
- drag across groups reassigns the row to another output

## Subsheet Scheduling

Subsheet nodes can define a mapping from child sheet outputs to parent sheet
outputs:

- `sheetNode.hal.threadMap[childOutputId] = parentOutputId`

This allows a parent sheet to decide how a child sheet's local scheduling lanes
are integrated:

- one-to-one mapping
- many-to-one mapping (collapse multiple child outputs into one parent output)

The parent does not need to directly edit child queue rows.

## Root Sheet -> HAL Thread Binding

The root sheet is still a normal sheet and still uses sheet thread outputs.

The difference is:

- each root sheet thread output can be explicitly bound to a real project HAL
  thread via `halThreadId`

This binding is configured inline in the root sheet's `Sheet Settings`
(`Sheet Thread Outputs` panel).

Important:

- Export uses the explicit `halThreadId` binding.
- If the binding is missing or invalid, export warns and falls back to the
  default HAL thread.

## Export Behavior (current)

HAL export emits real thread definitions from `project.halThreads` using
`threads(9)` syntax:

- `loadrt threads nameN=... periodN=... fpN=...`
- up to 3 threads per `loadrt threads` line (multiple lines emitted if needed)
- threads are exported fastest-to-slowest (`periodNs` ascending), as required by
  `threads(9)`

HAL export resolves `addf` threads in this order:

1. Queue row `sheetThreadOutputId` (local to current sheet)
2. Subsheet `threadMap` remaps child outputs into parent outputs
3. Root sheet output `halThreadId` resolves to a project HAL thread name
4. Fallback to export default thread if unresolved

Additional details:

- `addf` ordering is preserved per final HAL thread
- `position` values (when enabled) are generated per final HAL thread counter
- component-level `addf` export rules can still disable addf emission or change
  function templates, but thread assignment comes from queue/thread mappings
- Export warns if a component function declared `fp` is scheduled in a HAL
  thread marked `nofp` (when function metadata is available)

## Import Behavior (current)

HAL import:

- parses `addf` thread names
- creates/extends root sheet thread outputs as needed
- assigns imported queue rows to those root outputs
- creates/extends `project.halThreads` for imported thread names
- writes explicit root output `halThreadId` bindings

This preserves imported `addf` thread routing without relying on name matching at
export time.

## Current Limitations

Not implemented yet:

- Explicit validation UI for missing/invalid root bindings (export warns, but no
  dedicated validation panel yet)
- Motion-specific thread parameter integration (for example `motmod`
  `base_thread_fp`/period-related settings) is not generated yet
