# Shutdown HAL

NoHAL stores an optional shutdown HAL snippet in the project and exports it as a separate file when non-empty.

## Where It Lives In The App

Shutdown HAL is edited in `Project Settings > Shutdown`.

## Stored Value

The project stores the shutdown text as `project.shutdown` (a plain text field).

## Export behavior

If `project.shutdown` is empty or only whitespace, no shutdown file is generated.

If it is non-empty, export writes a shutdown HAL file containing the text:

- trailing whitespace at the end of the field is trimmed
- a newline is appended

During project build, the shutdown file is written as:

```text
<project slug>-shutdown.hal
```

## INI integration

When NoHAL generates the project INI, it manages the `[HAL]` section entries.

If a shutdown HAL file is generated, NoHAL adds:

```ini
SHUTDOWN = <project slug>-shutdown.hal
```

