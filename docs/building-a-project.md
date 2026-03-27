# Build a Project

This page covers how to create and structure a NoHAL project after the initial entry point.

## Starting Blank

Blank projects are the cleanest way to learn the model.

When you create a blank project, start by deciding:

- what the root sheet should represent
- whether you already know the major subsystems
- which HAL threads the project will need

Do not over-partition the design on the first pass. It is usually easier to sketch the root sheet first, then split it into subsheets when the graph becomes hard to reason about.

## Naming Conventions

Use explicit names early.

Prioritize:

- project name that matches the machine or variant
- component instance names that still make sense after export
- sheet names that describe a subsystem, not a layout region
- port names that describe the signal role

Clear names make the generated HAL easier to trust.

## Suggested Structure

For larger projects, a useful pattern is:

- root sheet for machine-wide structure
- one sheet per subsystem
- ports for boundary signals
- local labels inside a sheet
- global labels only where cross-project wiring is genuinely clearer

## Settings to Review Early

Before the project grows, review:

- `Project Settings > HAL Threads`
- `Project Settings > motmod`
- `Project Settings > Mesa`
- `Sheet Settings > Thread Outputs`
- `Sheet Settings > addf Queue`

Those settings are easier to establish early than retrofit later.

## Save Discipline

NoHAL projects deserve the same discipline as source code.

Recommended practice:

- make one structural change at a time
- save after each meaningful milestone
- build after changes that affect scheduling or export boundaries
- keep a known-good export for comparison during early adoption
