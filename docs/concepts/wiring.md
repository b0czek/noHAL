# Wiring

In NoHAL, a wire is a visual representation of HAL connectivity. The exported truth is still the HAL net.

- show connection intent clearly on the canvas
- resolve that intent into valid exported signal names and pin paths

## Wire = Net, But Not Every Drawn Thing Is the Same Kind of Object

Three concepts are easy to confuse:

- a wire
- a label
- an anchor

They are related, but they are not interchangeable.

## Wires

A wire is a direct drawn connection between endpoints on the sheet.

In export terms, that connection participates in a HAL `net` line.

If you explicitly name a direct connection, that name has the highest priority for the exported signal name.

## Labels

Labels are named signal references.

NoHAL supports:

- local labels
- global labels

Local labels only connect within the current sheet. Global labels connect across the project.

They are there to simplify layout and reduce unnecessary long wires, not to hide design intent.

## Anchors

An anchor is the attachment point between a label and a real endpoint.

That is the important distinction:

- the wire represents direct connectivity
- the label represents a named signal reference
- the anchor connects a label to a specific endpoint

So an anchor is not another kind of net. It is a connection from an endpoint to a label-based naming mechanism.

## Ports at Sheet Boundaries

Ports are the deliberate wiring surface of a sheet.

When a child sheet is instantiated, its ports become the parent-facing connection points on the subsheet node. Internally, those same ports connect to the child sheet contents.

This is why ports are the right tool for crossing sheet boundaries and labels are the right tool for simplifying a sheet internally.

## How NoHAL Chooses Exported Net Names

NoHAL resolves signal names from hints in roughly this order:

1. explicit connection name on a drawn wire
2. global label name
3. boundary-derived sheet signal name
4. local label name
5. fallback `auto_net_N`

## Pathing Rules for Names

When a signal name is derived from a sheet boundary or a local label, NoHAL prefixes it with the sheet-instance path.

Examples:

- root-sheet local label `enable` can export as `enable`
- local label `enable` inside a subsheet instance `spindle` can export as `spindle.enable`
- the same label inside `panel.estop` can export as `panel.estop.enable`

One nuance is worth stating explicitly:

- system-managed component pin paths export as bare instance names such as `motion.*`
- but sheet-local naming inside the system sheet can still produce names prefixed by the system sheet instance path

So the special behavior applies to system component instance paths, not to every signal name that happens to pass through the system sheet.

## Valid HAL Still Wins

NoHAL still validates the export.

Examples of things that will fail or warn:

- invalid HAL signal names
- mixed signal types on one resolved net
- multiple output pins on the same signal
- invalid pin paths

The editor helps you, but the final contract is still HAL correctness.

## Wire Appearance in the Editor

Wire style is a project-level visual choice in `Project Settings`.

You can choose whether wires are:

- right-angle
- straight
- curved

You can also choose whether they draw above or below components.

That changes readability in the editor only. It does not change export semantics.

## Good Wiring Practice

- Use direct wires when the connection is local.
- Use labels to shorten cluttered runs, not to make logic mysterious.
- Use ports for sheet boundaries.
- Name important nets on purpose when the exported HAL should stay readable.

## Capture In App

Good screenshots for this page:

- a direct wire with a visible signal name
- a local label and a global label on one sheet
- a label anchor visibly attached to a label and a component pin
- a subsheet node with ports connected from the parent sheet
- project settings showing wire style options

## Diagram

![Wiring model](/diagrams/wiring-model.svg)
