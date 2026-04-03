# Component

A component in NoHAL is a placed instance of a HAL-capable building block.

- the component definition in the library
- the placed instance on a sheet
- the exported HAL names produced from that instance

## What You Are Actually Placing

When you drop a component on a sheet, you are not placing a generic symbol. You are placing one HAL instance with:

- an instance name
- a component type
- visible pins
- optional parameters
- optional realtime functions
- optional instance configuration

## How Components Look in NoHAL

In the editor, a component is a node with pins on its sides.

- Pins are connection points for nets.
- Parameters are configuration values that export as `setp`.
- Some components expose one function, some expose several, and some expose none.
- Some components change shape depending on instance configuration.

## Placement and Naming

Instance names must be stable, HAL-safe names.

For most ordinary components, the exported pin path is:

```text
<sheet path>.<instance name>.<pin name>
```

Examples:

- `debounce_panel.filter.in`
- `spindle.pid.command`

On the root sheet there is no sheet prefix, so a root component can export like:

- `pid.command`
- `and2.0.out`

System-managed components are special. Their exported instance paths are bare instance names such as:

- `motion.command-handler-time`
- `halui.machine.is-on`

## Pins, Params, and `setp`

NoHAL lets you assign initial values to both parameters and writable pins on an instance.

At export time, those become `setp` lines:

```hal
setp debounce.0.delay 5
setp pid.x.maxoutput 10
```

Use this for values that are configuration, not live signal flow.

## Customizable Components and Personality

Some components are configurable at placement time and can change their exposed pins.

The classic example is `debounce`:

- the component uses grouped canonical instances
- each instance can declare how many channels it needs
- NoHAL expands the visible pins from that configuration

Other LinuxCNC components use a `personality` or similar load-time option to change how many pins, params, or functions exist. NoHAL models those cases when the component metadata supports it.

## System Components

Some components are managed by NoHAL as LinuxCNC system components rather than ordinary user-placed library parts.

Examples include:

- `motion`
- `halui`
- `iocontrol`
- `joint`
- `spindle`
- `ini`

On LinuxCNC 2.8 and newer, part of that system projection depends on your `motmod` configuration in `Project Settings`.

Change values such as:

- `num_joints`
- `num_dio`
- `num_aio`
- `num_spindles`

and the system-side projection changes with it. Some system components are derived from machine-level settings rather than placed manually like ordinary library components.

## Component vs Component Definition

The library definition answers:

- what this thing is
- what pins and params it can expose
- how it loads
- whether naming is constrained

The placed instance answers:

- what this one is called
- where it lives in sheet hierarchy
- what values it starts with
- which thread lane its functions run in

## Capture In App

Good screenshots for this page:

- a normal component with pins visible and the inspector open on the Instance tab
- a configurable component such as `debounce` with instance configuration visible
- a component with pin initial values and parameter values visible in the inspector

## Diagram

![Component anatomy](/diagrams/component-anatomy.svg)
