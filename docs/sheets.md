# Sheets in NoHAL

This document describes how sheets work today in NoHAL and how they map to HAL
export.

## What a Sheet Is

A sheet is a graph container with:

- nodes (component instances and subsheet instances)
- sheet ports (`in` / `out` / `io`)
- direct connections
- labels (`local`, `global`)
- comments

The project has exactly one root sheet (`project.rootSheetId`). Any other sheet
is used by placing a subsheet node that points to it.

## Nodes

There are two node kinds:

1. `component` node
2. `sheet` node (subsheet instance)

Each placed node has its own `instanceName`, so export paths remain explicit and
stable.

Component nodes can also carry:

- `paramValues` (exported as `setp instance.param value`)
- `pinInitialValues` (exported as `setp instance.pin value`)
- `exportStage` (`main` or `postgui`)

`exportStage=postgui` means this instance's `setp` and any nets touching it are
emitted in postgui output.

## Subsheet Boundaries

Subsheet nodes expose the child sheet's ports as pins on the parent sheet.

Conceptually:

- child `in` port appears as an output on the parent-side subsheet pin
- child `out` port appears as an input on the parent-side subsheet pin
- child `io` remains bidirectional

This allows direct wiring between parent components and subsheet boundaries.

## Ports and Labels

### Sheet Ports

Sheet ports are the explicit interface of a sheet.

- `in` ports represent data entering the sheet
- `out` ports represent data leaving the sheet
- `io` ports are bidirectional

### Labels

- `local`: connects label anchors only inside the current sheet
- `global`: joins anchors with the same name across the full project graph

## Direct Connections and Signal Names

Connections join two endpoints (node pin or sheet port). A connection can
optionally have `signalName`; if absent, export creates an `auto_net_*` name.

Connections are type-checked during editing/export and warnings are produced for
mixed endpoint types or multi-writer nets.

## Threading and `addf`

Sheets own local scheduling lanes via `sheet.hal.threadOutputs` and queue items
via `sheet.hal.addfQueue`.

Subsheets map child thread outputs into parent outputs using:

- `sheetNode.hal.threadMap[childOutputId] = parentOutputId`

Full details are documented in [threads.md](./threads.md).

## Export Mapping

During export:

1. The full sheet hierarchy is traversed from root.
2. Sheet boundary bridges and label scopes are resolved into connectivity
   groups.
3. Nets are emitted from resolved groups.
4. `setp` lines are emitted from node parameter/pin initial values.
5. `addf` is emitted from per-sheet queue expansion plus thread mapping.

For `exportStage`:

- `main` (default): `setp` and nets go to main HAL output
- `postgui`: `setp` and nets touching postgui instances go to generated
  postgui HAL output

Runtime loading (`loadrt`/custom load) remains in the main HAL output.

## Import Behavior (Current)

When importing from a LinuxCNC machine config:

- instances seen only in `POSTGUI_HALFILE` sources are auto-marked
  `exportStage=postgui`
- instances also present in main `HALFILE` sources stay `main`

