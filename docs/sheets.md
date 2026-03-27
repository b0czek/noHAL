# Sheets

Use sheets when a single canvas stops being a good representation of the machine.

## What Sheets Are For

Sheets help you:

- split a large design into smaller subsystems
- expose cleaner interfaces through ports
- keep scheduling manageable with local thread outputs
- make the root sheet describe structure instead of raw detail

## Root Sheet vs Child Sheets

The root sheet is the top-level graph for the whole project.

Other sheets are only active when they are placed through subsheet nodes. That means child sheets are not free-floating documents. They are part of the project graph when referenced.

## Designing a Good Sheet Boundary

A good sheet boundary has:

- a clear responsibility
- a small set of meaningful ports
- internal details hidden inside the child sheet
- naming that stays understandable after export

If a sheet needs dozens of poorly named ports just to stay connected, it probably does not represent a real subsystem yet.

## Ports on a Sheet

Ports are the sheet interface.

Use:

- `in` when the signal flows into the sheet
- `out` when the signal flows out
- `io` when the boundary is bidirectional

Port direction should reflect how the sheet is meant to be understood, not just what was convenient while drawing.

## Subsheet Instances

Each subsheet instance has its own instance name in the parent sheet.

That matters because export paths and generated references need stable, explicit names. If you place the same child sheet more than once, treat those instances as distinct parts of the machine.

## When to Split a Sheet

Split a sheet when:

- the root canvas is getting hard to scan
- a subsystem has a meaningful interface
- one section needs its own scheduling shape
- you keep re-explaining the same cluster of nodes to yourself

Do not split just because the canvas is physically large. Split when a new boundary improves reasoning.

## Related Pages

- [Core Concepts](/concepts)
- [Threads and addf](/threads-and-addf)
- [Edit Networks](/editing-networks)
