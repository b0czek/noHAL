# Wiring

Wiring objects describe connectivity between endpoints. Export turns each resolved connectivity group into one or more HAL `net` lines.

## Objects Involved

The editor uses a few related objects:

- **Connections**: direct endpoint-to-endpoint connections drawn on a sheet.
- **Labels**: named signal references with a scope (`local` or `global`).
- **Label anchors**: the attachment that ties a label to a specific endpoint.
- **Ports**: sheet boundary endpoints. When a sheet definition is instantiated, its ports become pins on the subsheet node in the parent sheet.

## Exported `net` Lines

Export collects all endpoints and unions them into connectivity groups using:

- direct connections
- label anchors
- sheet boundary connections (ports between parent and child sheets)

Each connectivity group produces:

- **no `net` output** if the group has no exported component pins
- **no `net` output** if the group has only one exported component pin and no label is involved
- **a `net` line** if the group has two or more exported component pins
- **a `net` line** if the group has a single exported component pin and the group has a local/global label hint

Export splits nets by export stage:

If a connectivity group contains pins from both stages, export emits:

- one `net <name> ...` line in the main output for main-stage pins
- one `net <name> ...` line in the postgui output for postgui-stage pins

## Ports at Sheet Boundaries

Ports create named boundary endpoints. During export, each port contributes a boundary hint whose name is derived from the sheet instance path plus the port name.

## How NoHAL Chooses Exported Net Names

When a connectivity group is exported, its net name is chosen from available hints in this priority order:

1. connection signal name (a named direct connection)
2. global label name
3. sheet boundary-derived name (from ports / sheet instance path)
4. local label name
5. fallback `auto_net_N`

## Validation and Fallbacks

Export validates:

- signal names (invalid names fall back to `auto_net_N` with a warning)
- net topology (type consistency, single-driver constraints)
- pin paths
