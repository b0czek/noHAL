# Concepts

This section describes how NoHAL’s editor objects map to the exported HAL output.

## In This Section

- [Component](/concepts/component): component instances, exported instance paths, export namespace/stage, and `setp`.
- [Sheet](/concepts/sheet): root/system sheets, sheet definitions vs instances, ports, and path scope.
- [Wiring](/concepts/wiring): connections, labels, ports, and how `net` names are chosen during export.
- [Threading](/concepts/threading): sheet thread outputs, root binding to project HAL threads, and `addf` expansion order.
- [Component Store](/concepts/component-store): built-in library, manual sources, and custom component definitions.

## Mental Model

Export is assembled from these parts:

1. Components produce exported instance paths and pin paths, plus optional `setp` and `addf`.
2. Sheets provide hierarchy (path prefixes), boundaries (ports), and local scheduling (thread outputs + queue).
3. Wiring produces `net` lines by grouping connected endpoints.
4. Threading produces `addf` lines by expanding each sheet’s queue through subsheets.
5. The Component Store provides the component definitions used by the project (built-in, imported, and custom).
