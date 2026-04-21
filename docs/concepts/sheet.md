# Sheet

A sheet definition is a reusable graph. A sheet instance is a placed reference to that definition inside a parent sheet.

## The Three Sheet Roles You Need to Keep Straight

Projects use three sheet roles:

1. The root sheet
2. The system sheet
3. An ordinary child-sheet definition used through subsheet instances

## Root Sheet

Every project has exactly one root sheet.

The root sheet is the top-level definition and has no parent. It is also where top-level thread outputs can be bound to project HAL threads (see Threading).

## System Sheet

NoHAL maintains a dedicated System sheet definition with role `system`. In the root sheet, it appears as a subsheet instance (the instance name is chosen to avoid collisions, typically `system`).

System-managed components are represented as nodes on the System sheet. Their exported instance paths are constrained by their component definitions (for example, fixed instance names like `motion` and `iocontrol`) rather than by the System sheet instance path.

## Sheet Definition vs Sheet Instance

This distinction matters a lot.

A sheet definition is the reusable internal graph.

A sheet instance is the node placed on a parent sheet that points to that definition.

If you place the same sheet definition twice, you do not get one shared object in two places. You get two instances of the same structure, each with its own place in the parent graph and its own exported path.

## Singleton constraint

Some sheets are required to be instantiated at most once in a project (“forced singleton”).

A sheet becomes forced-singleton if it contains any node that exports into the global namespace (i.e. a node whose exported instance path is not prefixed by the sheet instance path). The root sheet and the System sheet are also treated as singleton sheets.

Export validates this: if a forced-singleton sheet is reachable through more than one sheet instance path, export reports a fatal validation error and produces no HAL output.

## Ports Are the Sheet Interface

Ports are how a sheet definition exposes itself to the outside world.

Ports are the only endpoints that intentionally cross a sheet boundary.

When you place a sheet definition as a subsheet instance:

- the subsheet node in the parent sheet exposes the child definition’s ports as pins
- wiring to those pins connects into the child sheet through the matching port

Each port has:

- a name
- a direction (`in`, `out`, `io`)
- a type (`bit`, `float`, `s32`, etc.)

## Naming Through Sheet Hierarchy

For ordinary components, sheet hierarchy becomes part of the exported instance path.

A component inside a child sheet exports differently than the same component on the root sheet.

Exported instance paths are computed from:

- the sheet instance path (the chain of subsheet instance names from the root to the current sheet instance)
- the node’s instance name
- any component definition constraints (for example, system-managed fixed names)
