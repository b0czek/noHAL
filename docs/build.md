# Build outputs

Build runs export and writes the generated outputs into a `build/` directory under the project folder.

## What build writes

Build always writes:

- `<project slug>.hal`
- an INI file

Build conditionally writes:

- `<project slug>-postgui.hal` (only when there are any postgui nets or `setp`)
- `<project slug>-shutdown.hal` (only when the Shutdown field is non-empty)

The INI file name uses the imported INI name when available; otherwise it falls back to `<project slug>.ini`.

## Managed INI `[HAL]` entries

When generating the INI, NoHAL also manages the `[HAL]` entries that point at the generated files.

## Cleanup of old outputs

Build writes a small manifest listing the files it generated:

```text
.nohal-build-manifest.json
```

On the next build, NoHAL uses the manifest to remove stale previously-generated files that are no longer part of the current output set.

## Warnings

Build warnings include export warnings, plus warnings about imported machine config sources that are not reproduced as separate build outputs (for example missing or skipped HAL source references).

