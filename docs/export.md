# Export (HAL output)

NoHAL export generates HAL text from the current project graph. It does not write files; build writes files.

Export produces up to three HAL texts:

- **Main HAL**
- **Postgui HAL** (only when needed)
- **Shutdown HAL** (only when the shutdown field is non-empty)

## What export includes

Export output is assembled from:

- runtime load lines (for example `loadrt` / `loadusr`)
- ordered `addf` lines (from the configured queues and thread bindings)
- `setp` lines from per-instance pin initial values and parameter values
- `net` lines derived from resolved wiring connectivity

Some output is split by export stage:

- **Main**: nets and `setp` for instances exported to the Main HAL File
- **Postgui**: nets and `setp` for instances exported to the Postgui HAL File

## Validation and export abort

Export runs validation before rendering output. If validation produces fatal errors, export:

- returns an empty main HAL output
- returns warnings describing the validation failure

Fatal validation includes:

- forced-singleton sheet expanded more than once
- duplicate exported instance paths

## Warnings

Export can emit warnings for cases such as:

- invalid HAL signal names (signal name falls back to `auto_net_N`)
- missing component definitions referenced by nodes
- HAL name length warnings when `HAL_NAME_LEN` is configured in Project Settings

