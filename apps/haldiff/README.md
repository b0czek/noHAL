# haldiff

`haldiff` compares the HAL network structure of two LinuxCNC machine configs.

It loads HAL files from each `.ini` using the same file-selection flow as the noHAL importer, builds an internal graph of components, pins, and signals, then reports whether the two configs are structurally equivalent.

This is meant for cases like:

- checking whether a generated config is equivalent to a hand-written one
- verifying that a refactor renamed signals or instances without changing wiring
- spotting missing or extra HAL connections between two machine configs

## What it compares

`haldiff` compares structure, not raw text.

It can treat configs as equivalent even when:

- signal names changed
- component instance names changed

It reports differences when the actual connection graph changes, for example:

- a component exists only on one side
- a signal group loses or gains endpoints
- the wiring around a matched component is different

## Usage

From the repo root:

```sh
pnpm haldiff -- path/to/before.ini path/to/after.ini
```

You can also run the package directly:

```sh
pnpm --filter @nohal/haldiff haldiff -- path/to/before.ini path/to/after.ini
```

Named path aliases are supported:

```sh
pnpm haldiff -- --left path/to/before.ini --right path/to/after.ini
pnpm haldiff -- --before path/to/before.ini --after path/to/after.ini
```

## Flags

- `--fail-on-diff`: return exit code `1` when the compared networks are not equivalent
- `--debug`: include internal structural invariant diagnostics in the report
- `--help`: print CLI usage

## Exit codes

- `0`: the command ran successfully
- `1`: differences were found and `--fail-on-diff` was enabled
- `2`: usage error or config-loading failure

## Output

The report starts with a short summary:

```text
Equivalent: yes|no
Before: <component count> components, <signal count> signals
After: <component count> components, <signal count> signals
```

Depending on the comparison result, `haldiff` may also print:

- `Matched components`
- `Unmatched before components`
- `Unmatched after components`
- `Differing signal groups`
- `Unmatched before signal groups`
- `Unmatched after signal groups`
- `Warnings`

With `--debug`, it also prints:

- `Structural invariant differences`

## Typical workflow

Use plain comparison when you want a readable report:

```sh
pnpm haldiff -- compare/before/machine.ini compare/after/machine.ini
```

Use `--fail-on-diff` in scripts or CI:

```sh
pnpm haldiff -- compare/before/machine.ini compare/after/machine.ini --fail-on-diff
```

## Under the hood

`haldiff` does not diff HAL files line by line. It first parses each config into an import draft, then builds a bipartite graph:

- component nodes keyed by HAL instance name
- signal nodes keyed by `net` name
- attachments connecting a component pin to a signal

Repeated `net` lines for the same signal are merged into one signal node, so the graph represents connectivity rather than source-file layout.

After graph construction, `haldiff` tries to match components between the two sides. It prefers exact structural matches, using component type information when available, and falls back to heuristics based on shared pin sets and instance-name similarity when the structure is less distinctive.

Once components are matched, each signal is normalized into a sorted set of `<component, pin>` connections using the resolved component mapping. That is what lets `haldiff` treat renamed signals and renamed component instances as equivalent while still reporting real wiring changes.
