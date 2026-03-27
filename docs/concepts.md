# Core Concepts

This page defines the NoHAL terms that matter when you edit or export a project.

## Project

A project is the full NoHAL workspace.

It contains:

- the root sheet
- other sheets referenced by subsheets
- the component library visible to the project
- project-wide HAL threads
- machine-level settings such as INI and hardware-related configuration

## Sheet

A sheet is a graph container.

Use sheets when one canvas is no longer enough to keep the design readable. A project always has exactly one root sheet. Other sheets become part of the graph when you place them as subsheets.

## Subsheet

A subsheet is a node on a parent sheet that points to another sheet.

Use it to:

- group a subsystem behind a clearer boundary
- reduce clutter on the parent canvas
- route connectivity through defined ports instead of direct long-distance wiring

## Component

A component node represents a HAL component instance. It can expose:

- pins
- parameters
- realtime functions
- per-instance configuration
- export-stage choices such as main HAL or postgui HAL

## Ports and Labels

Ports define the public interface of a sheet.

- `in` means data enters the sheet
- `out` means data leaves the sheet
- `io` means the boundary is bidirectional

Labels are a wiring convenience.

- local labels connect only inside the current sheet
- global labels connect across the project

Use ports for sheet boundaries. Use labels to simplify wiring, not to hide the design.

## Project HAL Threads

Project HAL threads are the real machine threads that appear in exported HAL.

You manage them in `Project Settings` under `HAL Threads`.

Typical examples include:

- `servo-thread`
- `base-thread`

## Sheet Thread Outputs

Sheet thread outputs are local scheduling lanes inside a sheet.

They are not automatically real HAL threads. They become real scheduling targets only after they are mapped upward and, on the root sheet, bound to project HAL threads.

This split is important:

- local outputs keep sheet scheduling manageable
- project HAL threads define the final machine-level export targets

## addf Queue

The `addf Queue` describes execution ordering inside a sheet.

You use it to:

- place component functions in the intended order
- choose the local output lane they run on
- define how subsheet scheduling expands during export

## Build

`Build` is the action that generates output from the current project state.

Treat the build result as generated code that still deserves inspection, especially after imports, structural edits, or thread changes.
