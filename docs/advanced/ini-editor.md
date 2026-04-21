# INI Editor

The INI Editor stores LinuxCNC INI section/key/value entries in the project and exposes them for two purposes:

- generating an effective project INI file during build
- providing `[SECTION]KEY` reference tokens you can use in component pin initial values and parameter values

## Where It Lives In The App

The editor is in `Project Settings > INI Editor`.

## User-controlled vs NoHAL-controlled entries

The INI Editor shows an “effective” INI view composed of:

- **User-controlled entries**: the sections/keys/values you add and edit in this editor
- **NoHAL-controlled entries**: entries synthesized by NoHAL at build time

NoHAL-controlled entries are read-only in the editor.

## Enforced `[HAL]` entries

NoHAL manages a subset of the `[HAL]` section and enforces these keys:

- `HALUI = halui`
- `HALFILE = <project slug>.hal`

Depending on what the project export generates, NoHAL may also add:

- `POSTGUI_HALFILE = <project slug>-postgui.hal`
- `SHUTDOWN = <project slug>-shutdown.hal`

In the editor, these managed entries show as locked and are not editable.

## What build does with the INI

When building a project, NoHAL produces the final INI by:

- removing any user-provided entries that match managed keys
- adding the managed entries back into the effective INI

## INI references in `setp` values

For component parameters and pin initial values, NoHAL allows INI reference tokens in LinuxCNC form:

```text
[SECTION]KEY
```

These tokens are stored on the node and exported verbatim in generated HAL, so LinuxCNC can substitute them at load time.

The component settings UI provides an INI reference picker and autocomplete sourced from the effective INI (including NoHAL-controlled `[HAL]` entries).

