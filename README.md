# NoHAL

Visual LinuxCNC HAL editor/import-export application built with Electron, TypeScript, SolidJS, and Konva.

## Current Status

NoHAL is an offline desktop editor for building and editing LinuxCNC HAL networks visually.
It can create/open/save NoHAL projects, import many existing `.hal` files into an editable graph, manage a local component store from `.comp` files, and export HAL text back out.

It is a real offline authoring tool but it is not a full LinuxCNC runtime-integrated IDE yet.

## Docs

- [docs/sheets.md](./docs/sheets.md) - sheet model, hierarchy, ports/labels, and export behavior
- [docs/threads.md](./docs/threads.md) - thread model, addf queue, and HAL thread binding/export

## What Works Today

- Electron desktop app with landing page and recent projects list
- Create blank projects or create a project from imported `.hal`
- Open/save projects as a project directory (not a single JSON file)
- Visual editor with:
  - hierarchical sheets (subsheet nodes)
  - sheet ports (`in` / `out` / `io`)
  - local / global labels
  - text comments
  - direct wiring with validation
  - wire waypoints/routing edits
  - inspector + component settings dialogs
  - sheet `addf` queue editing
  - undo/redo (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Y`, `Cmd+Shift+Z`)
- Component Store:
  - import a single `.comp` file
  - add/scan a directory of `.comp` files (recursive)
  - refresh sources/components
  - link HAL import component groups to stored components
- `.comp` parsing (pragmatic, header/declaration section before `;;`) for:
  - component name, pins, params
  - docs metadata (`description`, `author`, `license`, etc.)
  - options/metadata
- `.hal` import (pragmatic parser) for:
  - `loadrt` (including `count=` / `names=`)
  - `loadusr` instance-name inference for common flag forms (`-W`, `-Wn`, `-n`, `-c`)
  - `addf`
  - `setp`
  - `net` (with common arrow forms)
  - import warnings surfaced in the project creation flow
  - component-link review (store match vs project-local generated component)
  - placement heuristic choices (`related-groups` / `alphabetical`)
- `.hal` export for:
  - `loadrt` (RT components grouped with `names=...`)
  - `addf` (expanded from per-sheet queues; subsheets act as ordered blocks)
  - `setp` (params + pin initial values)
  - `net`
  - runtime summary comments for userspace/unknown components
  - optional export tuning via `project.halExport` (`loadOrder`, per-component rules, addf config)

## Project Format (Current)

Projects are saved as a directory with a manifest plus per-sheet files:

```text
my-project.nohal/
  project.nohal.json
  library.nohal.json
  sheets/
    top__abc123.nohal-sheet.json
    axis-logic__def456.nohal-sheet.json
```

Notes:

- `project.nohal.json` stores manifest/project metadata and sheet file references
- `library.nohal.json` stores project-local/used component definitions
- built-in components are merged in on load

## Known Limitations

- No LinuxCNC runtime introspection/control (offline editor only)
- `loadusr` export is not generated yet (export writes summary comments instead)
- HAL import is pragmatic, not full `halcmd`/LinuxCNC semantics
- Imported HAL currently builds a single top-level visual sheet (no hierarchy reconstruction)
- Array pin expansion (`foo##`-style) is not expanded during export
- Built-in component library is intentionally small; real workflows benefit from populating the Component Store

## `.comp` Parser Scope

The `.comp` parser intentionally extracts useful metadata from the declaration section before `;;` and does not try to fully reproduce `halcompile` behavior/codegen.

Reference grammar used during implementation:

- `linuxcnc/src/hal/utils/halcompile.g`

## Project Layout

- `apps/desktop/` Electron desktop application package
- `apps/desktop/src/main/` Electron main process, project IO, component store, IPC handlers
- `apps/desktop/src/preload/` renderer API bridge (`window.nohal`)
- `apps/desktop/src/renderer/` SolidJS UI, Konva canvas/editor, dialogs, state
- `packages/core/src/` shared project types/schema, HAL import/export, `.comp` parser, validation

## Development

```bash
pnpm install
pnpm dev
```

Useful scripts:

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
