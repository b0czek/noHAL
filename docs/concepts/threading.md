# Threading

NoHAL separates local sheet scheduling from final HAL thread binding.

## Two Layers of Scheduling

There are two different things:

1. NoHAL sheet thread outputs
2. Real HAL threads

They are related, but they are not the same object.

## Real HAL Threads

Real HAL threads are managed in `Project Settings > HAL Threads`.

This is where you define machine-level threads such as:

- `servo-thread`
- `base-thread`

Those are the final exported thread names that `addf` uses.

## Sheet Thread Outputs

Each sheet can define thread outputs in `Sheet Settings > Thread Outputs`.

Think of them as local scheduling lanes inside that sheet. A sheet gets at least one output by default, usually named `main`.

## Root Sheet Binding

The root sheet is where NoHAL thread outputs become real HAL threads.

Each root-sheet thread output can be bound to one project HAL thread. If a root output is not bound, export falls back to the default thread and warns.

## The `addf Queue`

The `addf Queue` is where you decide execution order.

Inside a sheet, the queue lets you:

- place component functions explicitly
- choose which local thread output they belong to
- control how child-sheet outputs expand into the parent

## Why Subsheet Thread Mapping Exists

A child sheet can define its own internal outputs such as:

- `read`
- `logic`
- `write`

But the parent sheet decides how those outputs map upward.

## Example: One Component Can Span Multiple Stages

Suppose a child sheet contains two components:

- component `x`, which has a `read` function and a `write` function
- component `y`, which has a `process` function

The sheet can divide that work into three local outputs:

- `read`
- `process`
- `write`

The parent can map those into one root output that ultimately binds to `servo-thread`, while still preserving the order:

```text
addf x.read servo-thread
addf y.process servo-thread
addf x.write servo-thread
```

## How Expansion Works

At export time, NoHAL walks the root sheet and expands subsheet queue entries recursively.

The final `addf` result depends on:

1. the child sheet output
2. the parent's mapping of that child output
3. the root-sheet binding of the parent output
4. the final project HAL thread name

If exported scheduling looks wrong, inspect those four levels in that order.

## Good Practice

- Keep local sheet outputs meaningful.
- Bind only the root sheet to real HAL threads.
- Review the `addf Queue` after structural edits.
- Inspect generated `addf` output after changing thread mappings.

## Capture In App

Good screenshots for this page:

- `Project Settings > HAL Threads`
- `Sheet Settings > Thread Outputs`
- `Sheet Settings > addf Queue`
- a parent sheet with a subsheet selected and its thread mapping visible
- generated HAL output showing ordered `addf` lines

## Diagram

![Thread mapping](/diagrams/threading-map.svg)
