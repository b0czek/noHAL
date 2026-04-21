# Mesa / HostMot2 configuration

NoHAL stores a Mesa Ethernet hardware description in the project and uses it to:

- export HostMot2 load lines (`loadrt hostmot2` / `loadrt hm2_eth ...`)
- export required `setp` for raw GPIO direction
- keep a generated Mesa projection on the System sheet aligned with the configured hardware

## Where It Lives In The App

Mesa settings are edited in `Project Settings > Mesa`.

## Stored Configuration

Mesa configuration is stored as a list of hosts. Each host includes:

- host kind (currently `7i92t`)
- IP address
- per-connector assignments for DB25 peripheral cards, or “Raw GPIO”
- Smart-Serial assignments (direct Smart-Serial ports on the host, and/or Smart-Serial ports exposed through a DB25 connector card)

### DB25 connector cards

Assigning a DB25 card to a connector selects a predefined HostMot2 profile for that connector. Compatibility is validated against the chosen host and connector.

### Raw GPIO

If a connector supports Raw GPIO, you can expose it as direct HostMot2 GPIO and choose which lines are outputs. Export uses that to emit:

```hal
setp <hm2 instance>.gpio.<NNN>.is_output 1
```

## Derived Topology

NoHAL derives a “topology” from the Mesa config. The topology includes:

- a set of system-managed nodes (host nodes plus derived nodes for things like encoders, stepgens, GPIO, and Smart-Serial peripherals, depending on the configured hardware)
- per-host runtime data (instance name, validated IP address, config string, and read/write function names)
- validation issues (warnings and fatals)

The set of generated Mesa node definitions is incomplete. If you run into missing pieces or incorrect pin/param metadata, contributions are welcome.

## Exported HostMot2 runtime

If the topology produces at least one host runtime entry, export emits:

- `loadrt hostmot2`
- `loadrt hm2_eth board_ip=... config="..."` (one board IP and config string per host)

If topology validation reports fatal issues, export records a fatal error and does not generate HAL output.

## Supported transports

NoHAL currently exports Ethernet HostMot2 (`hm2_eth`). Other HostMot2 transports are not implemented yet; contributions are welcome.

## System HAL projection (System sheet)

NoHAL maintains a Mesa-generated projection on the System sheet. This projection is derived from the current Mesa config and includes non-placeable, system-managed nodes with fixed instance names.

The Mesa tab shows whether the System HAL projection is in sync. The `Sync now` action reconciles the System sheet by adding/removing/renaming Mesa-managed nodes and ensuring the matching system component definitions exist.

