# Nochal

Visual LinuxCNC HAL IDE prototype (Electron + TypeScript + SolidJS).

## What This MVP Does

- Creates and saves a visual HAL project (`.nochal.json`)
- Offline-only editing (no LinuxCNC runtime introspection)
- Hierarchical sheets (subsheet nodes)
- Sheet edge ports (`in`/`out`/`io`) with editable names/types/sides
- Local / hierarchical / global net labels
- Direct endpoint wiring with type + direction validation
- `.comp` import (pragmatic parser for declaration block before `;;`)
- `.hal` export focused on:
  - `net`
  - `setp`
  - component instance summary comments

## What It Does Not Do Yet

- `loadrt` / `loadusr` / `addf` generation (still manual)
- Runtime HAL introspection
- Import existing `.hal` text into diagrams
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
cd nochal
npm install
npm run dev
```

## Notes On Local Typecheck In This Environment

The current workspace did not have the app dependencies installed, so local `tsc`
checks here were limited by missing type packages/modules (`solid-js`, `node` types).
The code was still patched against the real logic/type issues found during partial checks.
