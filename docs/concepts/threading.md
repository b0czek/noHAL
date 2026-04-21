# Threading

Threading in NoHAL is represented by two related layers:

- per-sheet scheduling lanes (“Sheet Thread Outputs”)
- project-level HAL threads used for `addf` during export (“HAL Threads”)

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

Each sheet can define thread outputs in `Sheet Settings > Thread Outputs`. These are local scheduling lanes used by that sheet’s `addf Queue`.

Each sheet has at least one output.

## Root Sheet Binding

The root sheet is where sheet thread outputs can be bound to project HAL threads.

Each root output can be bound to one project HAL thread. When a binding is missing, export uses the project default thread.

## The `addf Queue`

The `addf Queue` is where you set execution order at sheet scope.

Inside a sheet, the queue lets you:

- include component functions (when function metadata exists)
- include whole components (as a shorthand for “default” function, when applicable)
- include subsheet outputs (which expand into the child sheet’s own queue during export)
- assign each queue row to a local sheet thread output

## Why Subsheet Thread Mapping Exists

A child sheet can define its own internal outputs such as:

- `read`
- `logic`
- `write`

The parent sheet controls how child outputs map into its own outputs using “Subsheet Thread Mappings”. If a mapping is not set, export can fall back to inheriting the row’s assigned lane.

## How Expansion Works

At export time, NoHAL walks the root sheet and expands subsheet queue entries recursively.

The final `addf` result depends on:

1. the child sheet output
2. the parent's mapping of that child output
3. the root-sheet binding of the parent output
4. the project HAL thread name used for the resolved binding
