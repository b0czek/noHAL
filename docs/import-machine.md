# Import a machine

Machine import creates a NoHAL project from an existing LinuxCNC configuration (INI + HAL files).

## What you select

Import starts from an INI file. NoHAL reads the INI to:

- parse INI contents for later use in the INI Editor
- find `[HAL]` file references and suggest `.hal` files to include

You then choose which HAL files to import. The import UI is a list of file paths; you can add/remove rows and browse for files.

## Resolving INI substitutions in HAL

Each selected HAL file has a `Resolve INI` toggle.

When enabled, NoHAL replaces INI substitution tokens inside that HAL file before parsing it. Supported token forms:

- `[SECTION]KEY`
- `[SECTION](KEY)`

Unresolved substitutions are left as-is and reported as warnings.

## What NoHAL parses from HAL

Selected HAL text is parsed into an import draft containing:

- component groups (instances grouped by inferred HAL component name)
- nets
- `setp` lines
- `addf` lines
- warnings

If the INI references both `HALFILE` and `POSTGUI_HALFILE`, NoHAL also tracks instances that only appear in POSTGUI sources so they can be treated as postgui-only during project creation.

## Mesa detection step

If the import draft looks like it references Mesa / HostMot2 (`hostmot2` / `hm2_eth` and `hm2_*` instance/pin paths), NoHAL switches to a Mesa step before component linking.

In this step you must configure the Mesa host(s) and attached cards explicitly. NoHAL uses that configuration to generate the expected Mesa system projection and to resolve Mesa-related imports against it.

## Component linking step

Import does not assume every component in the HAL sources exists in NoHAL’s library. Instead, each detected component group is linked to one of:

- a **System** definition (for recognized LinuxCNC system components)
- a **Store** component (from the built-in library or your Component Store sources)
- a **Project-local** generated component definition (when no existing definition is selected)

For groups left project-local, the importer generates a component definition you can edit (pins/params/runtime/load string) before creating the final project.

Some system groups may require review when the imported shape does not match the expected system-managed definition; those are treated as system overrides so non-standard members are preserved.

## Placement heuristic

When generating the initial root sheet layout, you can choose a placement heuristic:

- **Related groups**: clusters connected items to reduce long wires
- **Alphabetical**: places groups in a stable alphabetical order

## What the import creates

When you finish the linking step, NoHAL creates a new project with:

- a root sheet populated with imported nodes and wiring
- a System sheet containing any system-managed nodes (and Mesa/motmod projections when applicable)
- project custom components for any groups you kept local
- the imported INI data available in the INI Editor

Import warnings are shown as part of the flow and are attached to the created project status.

## Current limitations

Import is intentionally limited to INI + `.hal` files:

- `LIB:` references are not auto-resolved
- non-`.hal` sources (for example Tcl/HalTcl entries) are detected but not imported

