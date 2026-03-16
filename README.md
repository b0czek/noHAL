<p align="center">
  <img src="./apps/desktop/assets/icon.svg" alt="NoHAL icon" width="160" />
</p>

<h1 align="center">NoHAL</h1>

<p align="center">Visual editor for LinuxCNC machine configuration.</p>

NoHAL is an editor for LinuxCNC machine configuration.

It is aimed at people who currently build and maintain LinuxCNC setups by hand in `.hal`, `.ini`, and `.comp`-driven workflows and want a more visual, structured way to do the same work.

The editor is inspired by Blender's node editor for graph editing and KiCad's sheet-based hierarchy for organizing larger designs.

![NoHAL editor screenshot](./docs/imgs/editor.png)

## What You Can Do Today

- Build and edit HAL networks visually instead of managing every connection as raw text
- Import existing `.hal` files into an editable graph
- Work with LinuxCNC configuration concepts such as threads, `addf` ordering, and motmod-managed nodes in a structured way
- Reuse components from `.comp` files through a local Component Store
- Generate HAL output from the edited project
- Organize larger configurations with sheets, ports, labels, comments, and direct wiring

## Current Scope

The goal is to make LinuxCNC machine configuration easier to understand, safer to change, and less dependent on manually editing large text files.

The project is not yet fully integrated and polished enough to cover 100% of the LinuxCNC configuration workflow end to end.

Future opportunity:

- Live runtime visibility of the network, so the editor can show what the machine is doing while it is running
- Subroutine management as part of the machine configuration workflow
- Integrated Mesa Configuration Tool support, so Mesa pins do not have to be defined manually
- An integrated editor for writing `.comp` components

## Development

Requires Node.js 22 and pnpm.

```bash
pnpm install
pnpm dev
```

## Packaging

Desktop packaging is configured with `electron-builder`.

```bash
pnpm dist:linux
```

This produces Linux `AppImage` and `deb` artifacts for the desktop app.

## Docs

Documentation is available in the [`docs/`](./docs/) directory.
