# Component

A component node is a placed instance of a component definition from the project library.

## What You Are Actually Placing

When you place a component on a sheet, the node stores instance-specific state:

- an instance name
- a component definition reference (HAL component name, pins/params/functions metadata, runtime kind, constraints)
- per-instance pin visibility and pin order
- per-instance initial values for writable pins
- per-instance parameter values
- optional per-instance configuration values (from “Instance Configuration”, when the definition supports it)
- export stage selection (Main HAL File vs Postgui HAL File), when allowed by the definition
- export namespace selection (Global namespace vs sheet-prefixed), when allowed by the definition

## Pins and Pin Paths

Pins are the endpoints you can connect to wiring. During export, each connected pin becomes a HAL pin path:

```text
<exported instance path>.<pin name>
```

The exported instance path is derived from:

- the sheet instance hierarchy (`sheet.instanceName` prefixes), unless the instance is exported in the global namespace
- the node’s instance name
- component definition constraints (for example, fixed instance names on system-managed components)

## Placement and Naming

Instance names are used as part of exported paths and must be valid HAL names after path joining.

Examples:

- `debounce_panel.filter.in`
- `spindle.pid.command`

On the root sheet there is no sheet prefix, so a root component can export like:

- `pid.command`
- `and2.0.out`

## Export Namespace (Global vs Sheet-Prefixed)

Each component instance has an export namespace setting:

- **Global namespace**: the instance path omits sheet prefixes.
- **Sheet-prefixed**: the instance path includes sheet instance names as prefixes.

Some components lock this setting via definition/runtime constraints.

## System-Managed Components

Some component definitions are system-managed and not manually placeable. They are represented on the System sheet, and their exported instance paths are constrained by their system naming rules.

Examples of exported instance paths that are fixed by system constraints:

- `motion.command-handler-time`
- `halui.machine.is-on`

## Pins, Params, and `setp`

NoHAL exports per-instance initial values for:

- writable pins (from “Pin Initial Values (setp)”)
- parameters (from “Parameters”)

At export time, those become `setp` lines:

```hal
setp debounce.0.delay 5
setp pid.x.maxoutput 10
```

`setp` export is split by export stage. Instances exported to the Postgui HAL File contribute their `setp` lines to the postgui output; everything else contributes to the main output.

## Customizable Components and Personality

Some definitions expose per-instance configuration fields that change the resolved pins for that instance. Pins are resolved from the component definition plus the instance configuration values stored on the node.

### Example: `debounce` (channels)

The built-in `debounce` definition is a manually modeled LinuxCNC component with grouped canonical instances (`debounce.0` … `debounce.7`) and a per-instance config field:

- `channels` (integer): the number of channels exported by that canonical instance

Changing `channels` expands the pins for the instance using indexed templates. For example, with `channels = 2`, the instance exports pins like:

- `0.in`, `0.out`
- `1.in`, `1.out`

## Realtime Functions and `addf`

If a component definition includes realtime function metadata, those functions can appear in a sheet’s `addf Queue`. The queue determines ordering, and thread selection is derived from the local “Sheet Thread Outputs” and any parent/child mapping.

## Current Limitations

Component definitions can declare array pins (for example, pins containing `#`). Export currently does not expand array pins into concrete indexed pin paths, and export emits a warning when such pins are present on an instance.

## Component vs Component Definition

The library definition answers:

- what this thing is
- what pins and params it can expose
- how it loads
- whether export stage / export namespace / instance naming are constrained

The placed instance answers:

- what this one is called
- where it lives in sheet hierarchy
- what values it starts with
- which local sheet thread output its functions are scheduled on (via the sheet’s queue)
