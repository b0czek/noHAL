# Component Store

The Component Store is the pool of component definitions available to your project.

It is not the same thing as the current sheet, and it is not the same thing as project-local custom components.

## Built-In LinuxCNC Catalogs

NoHAL ships with built-in component catalogs for the major LinuxCNC versions:

- 2.7
- 2.8
- 2.9
- 2.10

Those catalogs give a strong starting point, but they are not a perfect mirror of every component that might exist in a LinuxCNC install.

## What Is Included and What Is Missing

The built-in store focuses on components NoHAL can parse reliably from source.

In practice that means the store is strong on `.comp`-based components, because those are straightforward to parse into pins, params, functions, docs, and load metadata.

What may be missing:

- custom C-based HAL components that are not represented as `.comp`
- machine-specific components outside the parsed source set
- unusual hand-written runtime pieces that never had a `.comp` definition available

So the built-in store is broad, not exhaustive.

## Manual Definitions for Important Non-`.comp` Cases

NoHAL also ships some manual definitions for important LinuxCNC components that are not sourced from ordinary `.comp` parsing.

## Importing Your Own `.comp` Sources

You can extend the Component Store with your own sources.

Two common paths are supported:

- import a single `.comp` file into the store
- add a whole directory as a component-source directory

Once added, those definitions are merged into the store and become available as placeable components in your projects.

This is the right approach when you have reusable real source definitions and want them to stay part of your working library.

## Refreshing Store Sources

Store sources are refreshable.

Use refresh when the underlying source changed and you want the store to pick up the latest parsed shape.

## Project-Local Custom Components

Every project can also define its own custom components that are not backed by any `.comp` file.

These are useful for:

- userspace programs
- imported machine logic where the original source is gone
- wrappers around existing runtime commands
- awkward legacy pieces you still need to preserve

If you lost the original `.comp`, this is where NoHAL stays practical instead of moralizing about purity.

## What You Can Define on a Custom Component

A project-local custom component can define:

- component name
- runtime kind: `rt`, `userspace`, or `unknown`
- a custom load string
- max instance count
- pins
- params and their default values

That makes custom components useful both as documentation and as real export participants.

## Load Strings and Instance Limits

Custom components can export through a custom load string instead of relying on NoHAL's generated `loadrt` strategy.

That is important for userspace tools and for odd runtime cases that do not fit the usual LinuxCNC component conventions.

You can also define a maximum instance count for components that should exist only once, only a few times, or where the runtime model does not support unlimited instances.

## When To Use Which Tool

Use the Component Store when:

- you have a real reusable `.comp` source
- you want a shared library of components across projects
- you want definitions to stay backed by source files

Use project-local custom components when:

- the component is project-specific
- the backing source is missing
- the runtime shape is real enough to export but not clean enough to parse from `.comp`
- you need a deliberate placeholder for legacy logic

## Capture In App

Good screenshots for this page:

- the component-store view with built-in sources visible
- importing a single `.comp` file
- adding a directory source
- refreshing a directory source
- the project custom-component editor showing runtime kind, load string, pins, params, and max instances
