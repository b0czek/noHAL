---
layout: home

hero:
  name: "NoHAL"
  text: "Visual editor for LinuxCNC machine configuration"
  tagline: "A clearer way to build HAL"
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
    details: Start with a blank project or import a machine configuration from one `.ini` file and the HAL files you choose to include.
  - title: Edit HAL as a graph
    details: Place components, connect pins, add ports, labels, comments, and split larger designs into subsheets.
  - title: Control scheduling before build
    details: Define project HAL threads, sheet thread outputs, and per-sheet `addf` queues before generating output files.
---

<div class="manual-callout">
<strong>Before you proceed</strong><br>
This guide assumes you already know LinuxCNC and basic HAL concepts. It focuses on how NoHAL maps those concepts into the editor and build output.
</div>

## What You Can Do in NoHAL

- Create a blank project or open an existing NoHAL project.
- Import a LinuxCNC machine configuration from an `.ini` file and selected `.hal` files.
- Use built-in components, component-store entries, and project-local custom components.
- Organize the graph with sheets, subsheets, ports, labels, and comments.
- Manage project HAL threads, sheet thread outputs, and `addf` ordering.
- Build generated `.hal`, optional `-postgui.hal` and `-shutdown.hal`, and `.ini` files into the project's `build/` directory.

## Current Limits

- Import is centered on `.ini` plus `.hal` files. `LIB:` references and non-`.hal` entries such as Tcl or HalTcl sources are not auto-loaded into the project.
- Build output is generated from the current NoHAL project state. Review it after import, thread changes, or larger sheet refactors before treating it as machine-ready.
