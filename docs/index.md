---
layout: home

hero:
  name: "NoHAL"
  text: "Visual editor for LinuxCNC machine configuration"
  tagline: "The way to build HAL"
  image:
    src: /screenshots/node.png
    alt: Example NoHAL component graph
  actions:
    - theme: brand
      text: Get Started
      link: /installation
    - theme: alt
      text: Quickstart
      link: /quickstart
    - theme: alt
      text: Import Existing HAL
      link: /importing-existing-hal

features:
  - title: Create or import a project
    details: Start with a blank project or import a machine configuration from an `.ini` file and the `.hal` files you want to bring in.
  - title: Edit HAL as a graph
    details: Place components, connect pins, add ports, labels, comments, and split larger designs into subsheets.
  - title: Export build files
    details: Export the finished project when your graph is ready to use.
---

<div class="manual-callout">
<strong>Before you proceed</strong><br>
This guide assumes you already know LinuxCNC and basic HAL concepts. It focuses on how NoHAL maps those concepts into the editor and build output.
</div>

## What Saves Time in NoHAL

- Import an existing LinuxCNC machine configuration from an `.ini` file and the `.hal` files you choose, instead of rebuilding the project from scratch.
- Start from a built-in component library generated for LinuxCNC 2.7, 2.8, 2.9, and 2.10, and expand the store with your own components when needed.
- Configure Mesa cards and work from their generated signals in the graph instead of wiring everything by hand in raw HAL.
- Turn repeated machine logic into reusable subsheets so common patterns can be dropped into larger projects quickly.
- Control HAL threads and `addf` ordering in one place before export when timing and execution order matter.

## Current Limits

- Import is centered on `.ini` plus `.hal` files. `LIB:` references and non-`.hal` entries such as Tcl or HalTcl sources are not auto-loaded into the project.
- NoHAL is still in an early stage of development. Verify generated output carefully and do not trust it blindly for a real machine.
