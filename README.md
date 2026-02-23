# NoHAL

Visual LinuxCNC HAL IDE prototype (Electron + TypeScript + SolidJS).

## What This MVP Does

- Creates and saves a visual HAL project (`.nohal.json`)
- New Project flow supports:
  - blank project creation
  - importing an existing `.hal` file
  - component-link verification against the Component Store before project creation
- Offline-only editing (no LinuxCNC runtime introspection)
- Hierarchical sheets (subsheet nodes)
- Sheet edge ports (`in`/`out`/`io`) with editable names/types/sides
- Local / hierarchical / global net labels
- Direct endpoint wiring with type + direction validation
- `.comp` import (pragmatic parser for declaration block before `;;`)
- `.hal` export focused on:
  - `loadrt` (RT components; grouped with `names=...`)
  - `addf` (per-sheet queue ordering; subsheets expand as ordered blocks)
  - `net`
  - `setp`
  - userspace/unknown runtime summary comments
- `.hal` import (pragmatic parser) for:
  - `loadrt` (names/count inference)
  - `net`
  - `setp`
  - `addf` (mapped into top-sheet addf queue when function names match instances)
  - unresolved components become project-local component definitions in the imported `.nohal.json`

## What It Does Not Do Yet

- `loadusr` generation (still manual flags/args)
- Full-fidelity `.hal` import (the importer is pragmatic and currently builds a single top-level sheet)
- `loadusr` parsing/linking is partial during import (net/setp-driven reconstruction still works for many files)
- Array pin expansion (`foo##` style pins are detected but not expanded)
- Full visual editor uses a custom HAL scene on top of Konva (schematic-oriented UX)

## Why The `.comp` Parser Is Hybrid/Pragmatic

LinuxCNC `.comp` files are parsed from the declaration section before `;;`.
This implementation extracts:

- `component`
- `pin`
- `param`
- docs (`description`, `author`, `license`, etc.)
- `option` flags (stored as metadata)

It intentionally does not attempt full `halcompile` behavior or codegen semantics.

Reference used from the provided LinuxCNC tree:
- `linuxcnc/src/hal/utils/halcompile.g`

## Project Layout

- `src/main/` Electron main process + IPC
- `src/preload/` secure renderer API bridge
- `src/renderer/` Solid UI (Konva-based schematic scene + inspector/toolbars)
- `src/shared/` project schema, `.comp` parser, validation, HAL exporter

## Run (after installing dependencies)

```bash
cd nohal
npm install
npm run dev
```

