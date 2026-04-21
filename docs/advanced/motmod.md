# motmod configuration

`motmod` is the LinuxCNC motion module. In NoHAL, the motmod settings are stored in the project and used in two places:

- to export the `loadrt motmod ...` arguments
- to keep the System sheet’s motmod-managed nodes aligned with the configured instance counts

## Where It Lives In The App

Motmod settings are edited in `Project Settings > motmod`.

## Stored Settings

NoHAL stores these motmod-related values in the project:

- `num_joints`
- `num_dio`
- `num_aio`
- `num_spindles`
- `num_misc_error`
- `traj_period_nsec` (0 means “use servo period”)

## Derived From HAL Threads

Some motmod arguments are derived from `Project Settings > HAL Threads`:

- `servo_period_nsec` comes from the `servo-thread` period
- `base_period_nsec` comes from the `base-thread` period
- `base_thread_fp` comes from the `base-thread` float mode (`fp`/`nofp`)

If the project does not define a `servo-thread`, export omits the servo/traj period arguments for motmod and emits a warning.

## System HAL projection (System sheet)

NoHAL maintains a motmod-managed projection on the System sheet. When you change motmod settings, the expected set of System-sheet nodes can change.

The projection covers these motmod-managed families:

- `motion`
- `axis`
- `joint` (LinuxCNC 2.8+)
- `spindle` (LinuxCNC 2.8+)

The counts and instance names are derived from the motmod settings. For example:

- `motion` is always present as `motion`
- `joint` nodes are `joint.0 .. joint.(num_joints-1)`
- `spindle` nodes are `spindle.0 .. spindle.(num_spindles-1)`

The `motion` node also has managed instance configuration values that mirror selected motmod settings (for example `num_dio`, `num_aio`, and `num_misc_error` on LinuxCNC versions that support it). Those values are used to expand the `motion.*` pin set.

The motmod tab shows whether the System HAL projection is in sync. The `Sync now` action reconciles the System sheet by adding/removing/adopting/updating motmod-managed nodes and ensuring the matching system component definitions exist.

