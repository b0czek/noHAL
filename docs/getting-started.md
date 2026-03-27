# Getting Started

This page is a short orientation to the actual NoHAL workflow before you start editing.

## What NoHAL Is For

NoHAL is a visual editor for LinuxCNC machine configuration, centered on HAL structure.

You use it to work with:

- HAL components and instances
- pins, parameters, and pin initial values
- connections, signal names, labels, and sheet ports
- subsheets for larger designs
- project HAL threads, sheet thread outputs, and `addf` ordering
- generated build output

It is not a generic node editor. The model, settings, and export behavior are tied to LinuxCNC concepts.

## Opening Your First Project

Use the landing page according to what you are trying to do:

- `Create Blank`
  Starts a new unsaved NoHAL project for the selected LinuxCNC version.
- `Import Machine Configuration`
  Starts the machine import flow from an `.ini` file and the HAL files you choose.
- `Open Project`
  Opens an existing NoHAL project from disk.
- `Recent Projects`
  Reopens a project that NoHAL has tracked locally.

## The Editor At A Glance

![NoHAL editor overview](/screenshots/editor.png)

Once a project is open, most work happens in five places:

- Top bar for save, build, placement tools, and project-level dialogs
- Left sidebar for moving between sheets
- Canvas for placing nodes and wiring the graph
- Right inspector for quick edits to the current selection
- Bottom status bar for save state and status messages

Project-wide configuration such as HAL threads, shutdown HAL, Mesa, custom components, and the INI editor lives in dialogs opened from the top bar.

## What To Do First In A Blank Project

For a first blank project, the useful order is:

1. Create the project from the landing page.
2. Place a few components on the root sheet.
3. Connect pins and give important connections explicit signal names.
4. Review `Project Settings`, especially `General` and `HAL Threads`.
5. Open `Sheet Settings` for the root sheet and review `Thread Outputs` and `addf Queue`.
6. Save the project.
7. Run `Build` and inspect the generated output.

Do not start with heavy sheet restructuring. It is easier to sketch the root sheet first and split it later.

## Save And Build Behavior

Two behaviors matter early:

- A new blank project starts unsaved.
- `Build` requires a project folder. If the project has not been saved yet, NoHAL asks you to save it first.

After build, review the generated files before treating them as machine-ready, especially after import or scheduling changes.

## Read Next

After this page, the next useful pages are:

- [Quickstart](/quickstart)
- [Core Concepts](/concepts)
- [Import Existing HAL](/importing-existing-hal)
- [Build a Project](/building-a-project)
