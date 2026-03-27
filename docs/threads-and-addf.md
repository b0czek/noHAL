# Threads and addf

This page explains the user-facing scheduling model in NoHAL.

## Two Scheduling Layers

NoHAL separates scheduling into two layers:

1. project HAL threads
2. sheet thread outputs

That separation is intentional.

## Project HAL Threads

Project HAL threads are the real exported machine threads.

You manage them in `Project Settings > HAL Threads`.

Use that page to control:

- thread name
- period in nanoseconds
- float support

These settings define the final thread targets that exported `addf` calls will use.

## Sheet Thread Outputs

Each sheet can define local thread outputs in `Sheet Settings > Thread Outputs`.

These outputs act like scheduling lanes inside that sheet. They let you describe how component functions should be grouped before everything is resolved into final HAL threads.

On the root sheet, local outputs can be explicitly bound to project HAL threads.

## addf Queue

The `addf Queue` is where execution order becomes explicit.

Use it to:

- group realtime functions by local output lane
- reorder functions within a lane
- decide how subsheet scheduling expands into the parent

If the runtime behavior matters, the queue deserves deliberate review. Do not leave it as an accidental byproduct of editing order.

## Subsheet Thread Mapping

When a child sheet is used as a subsheet, the parent sheet decides how the child's thread outputs map upward.

This lets you:

- keep child scheduling local and readable
- collapse multiple child outputs into one parent output when needed
- preserve intent without editing child internals for every parent use

## Practical Review Checklist

After changing scheduling:

1. confirm project HAL thread names and periods
2. review root-sheet bindings
3. review every changed `addf Queue` lane
4. inspect the generated `addf` output after build

## Common Failure Pattern

The most common mistake is assuming a sheet thread output is already a real HAL thread. It is not. The final result depends on mapping and root binding.

If export does not match your expectation, inspect the chain in this order:

1. child sheet output
2. parent mapping
3. root sheet binding
4. final exported thread name
