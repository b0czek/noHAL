# Sheet

A sheet is a graph container, but in NoHAL it is more than a larger canvas.

A sheet is also:

- a naming scope
- a wiring boundary
- a scheduling scope
- a reusable definition

## The Three Sheet Roles You Need to Keep Straight

There are three related but different things:

1. The root sheet
2. The system sheet
3. An ordinary child-sheet definition used through subsheet instances

## Root Sheet

Every project has exactly one root sheet.

This is the top-level graph. It is the place where:

- the machine structure is visible at the highest level
- child sheets are instantiated
- root thread outputs are finally bound to real HAL threads

The root sheet is a definition, not a placed reference. Nothing contains it.

## System Sheet

NoHAL also keeps a dedicated system sheet for LinuxCNC-managed system components.

Important detail:

- the system sheet is represented in the root sheet as a sheet node, just like other subsheets
- system-managed component instance paths themselves still export as bare names like `motion.*` or `halui.*`

So the system sheet behaves like a structural container, not a renaming wrapper around those components.

## Sheet Definition vs Sheet Instance

This distinction matters a lot.

A sheet definition is the reusable internal graph.

A sheet instance is the node placed on a parent sheet that points to that definition.

If you place the same sheet definition twice, you do not get one shared object in two places. You get two instances of the same structure, each with its own place in the parent graph and its own exported path.

## Why a Sheet Can Be Thought of as a Higher-Level Component

A well-designed sheet behaves like a component because it has:

- internal implementation
- a public interface made of ports
- local scheduling
- a stable place in the parent hierarchy

If a child sheet has no meaningful boundary and no coherent purpose, it is probably just hidden clutter rather than a real subsystem.

## Ports Are the Sheet Interface

Ports are how a sheet definition exposes itself to the outside world.

Use them when a signal should cross a sheet boundary deliberately.

- `in` means the signal enters the sheet
- `out` means the signal leaves the sheet
- `io` means it is bidirectional

## Naming Through Sheet Hierarchy

For ordinary components, sheet hierarchy becomes part of the exported instance path.

A component inside a child sheet exports differently than the same component on the root sheet.

The price is that sheet-instance names matter. A vague instance name like `part1` leaks directly into exported naming and becomes noise later.

## Capture In App

Good screenshots for this page:

- the sidebar showing root, system, and at least one ordinary child sheet
- the root sheet with a subsheet node selected
- the child sheet definition opened, with its ports visible
- the same sheet definition placed more than once, if available

## Diagram

![Sheet as higher-level component](/diagrams/sheet-structure.svg)
