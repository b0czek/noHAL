# Concepts

This section is the theory layer of the manual.

It explains how NoHAL maps HAL concepts into editor objects, sheet structure, scheduling, and exported files.

Read these pages before starting to build anything in NoHAL. More advanced concepts will be added later.

## In This Section

- [Component](/concepts/component): what a component instance is, how NoHAL names it, what can be configured per instance, and what changes at export.
- [Sheet](/concepts/sheet): root sheet, system sheet, sheet definitions, sheet instances, and why a sheet can behave like a higher-level component.
- [Wiring](/concepts/wiring): wires, HAL nets, ports, labels, anchors, and how signal names are derived during export.
- [Threading](/concepts/threading): sheet thread outputs, root-thread binding, subsheet thread mapping, and how NoHAL expands `addf`.
- [Component Store](/concepts/component-store): built-in LinuxCNC catalogs, imported `.comp` sources, and project-local custom components.

## Mental Model

NoHAL has five layers:

1. Components are the executable leaves. They become HAL instances, pins, params, and functions.
2. Sheets are graph containers. They become structure, boundaries, and scheduling scopes.
3. Wiring connects endpoints. It becomes HAL nets and `setp` lines.
4. Threading decides when realtime functions run. It becomes exported `addf`.
5. The Component Store decides what kinds of components are available to place in the project.
