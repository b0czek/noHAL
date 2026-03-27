# Edit Networks

This page focuses on day-to-day canvas work.

## Place Items from the Top Bar

The editor top bar lets you place:

- components
- subsheets
- text
- sheet ports
- labels

Use the top bar when you are intentionally adding new structure. Use context actions when you are already refining existing structure.

## Wiring Strategy

When editing a graph, optimize for readability first and density second.

Good practice:

- keep related components physically close
- use ports for real boundaries
- use local labels to shorten awkward routes
- keep comments near the logic they explain

Bad practice:

- hiding design problems behind too many global labels
- using sheets only as visual folders with no clean interface
- leaving anonymous or accidental-looking signal names in important paths

## Component Settings

Open `Component Settings` when you need to adjust:

- instance name
- export stage
- realtime functions
- parameters
- pin initial values
- pin visibility

Review these settings before export any time you add a new instance or replace a linked component.

## Text, Labels, and Ports

Use each tool for a specific purpose:

- text explains design intent for humans
- labels simplify local connectivity
- ports define interfaces between sheets

When a connection crosses a sheet boundary, prefer ports over clever label-based shortcuts.

## Search and Navigation

Use project and sheet search when:

- the graph is too large to inspect visually
- you need to find a specific component or port quickly
- you are tracing naming consistency across sheets

## After Editing

After a meaningful editing pass:

1. review changed instance names and port names
2. check `addf Queue` if realtime behavior changed
3. build and inspect the output

That loop is the safest way to catch model mistakes before they accumulate.
