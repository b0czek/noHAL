# Getting Started

This page gives you the shortest possible orientation before you open NoHAL.

## What NoHAL Edits

NoHAL is a visual editor for LinuxCNC machine configuration, with a strong focus on HAL structure.

In practice, that means you use it to work with:

- HAL components and instances
- pins, parameters, and `setp`
- nets and signal naming
- sheet structure for larger designs
- `addf` scheduling and thread routing
- generated HAL output

NoHAL is not a generic node editor. The UI is designed around LinuxCNC concepts and export rules.

## What You See First

The landing page gives you three main entry points:

- `Create Blank` to start a new project
- `Import Machine Configuration` to bring in an existing LinuxCNC setup
- `Open Project` to reopen a saved NoHAL project

You can also choose the target LinuxCNC version before creating or importing a project.

## Main Areas of the App

Once the editor is open, most work happens in these areas:

- Top bar
  Use this for build/export, project settings, general settings, and placement tools.
- Tree
  Use the sheet tree to move between the root sheet and nested sheets.
- Canvas
  Place components, subsheets, text, ports, labels, and wires here.
- Inspector and dialogs
  Use settings dialogs to edit component details, sheet settings, project settings, and the Component Store.

## Recommended First Workflow

If you are evaluating NoHAL for the first time:

1. Open the [Quickstart](/quickstart).
2. Create a blank project or import a small existing HAL setup.
3. Place a few components and wires.
4. Review `Project Settings`, `Sheet Settings`, and `Build`.
5. Export and inspect the generated output.

## Before You Make Structural Changes

Read these pages first if you are about to reorganize a project:

- [Core Concepts](/concepts)
- [Sheets](/sheets)
- [Threads and addf](/threads-and-addf)

Those pages explain the model that drives export behavior. That matters more than the visual layout alone.
