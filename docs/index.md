---
layout: home

hero:
  name: "NoHAL Manual"
  text: "A practical guide to building LinuxCNC HAL projects visually"
  tagline: "Use NoHAL to import existing machine configurations, organize large HAL graphs with sheets, and export generated HAL with clearer structure."
  image:
    src: /screenshots/editor.png
    alt: NoHAL editor
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: Quickstart
      link: /quickstart
    - theme: alt
      text: Import Existing HAL
      link: /importing-existing-hal

features:
  - title: Start from what you already have
    details: Import a LinuxCNC machine configuration from an INI file plus selected HAL files, then review component linking before creating the project.
  - title: Edit visually, keep HAL concepts intact
    details: Work with components, pins, nets, ports, labels, sheet boundaries, and addf scheduling without losing track of HAL structure.
  - title: Scale beyond a single canvas
    details: Use sheets and local thread outputs to split large configurations into manageable parts while keeping export behavior explicit.
---

<div class="manual-callout">
<strong>Who this manual is for</strong><br>
This guide assumes you already know LinuxCNC and basic HAL concepts. It focuses on how those concepts map into NoHAL's editor, project model, and export flow.
</div>

## What You Can Do in NoHAL

- Create a blank project and build a HAL network visually.
- Import an existing machine configuration from LinuxCNC files.
- Reuse built-in, stored, and project-local components.
- Organize large networks with sheets, ports, labels, and comments.
- Manage HAL threads, sheet thread outputs, and `addf` ordering.
- Export generated HAL and supporting project output files.

## Start Here

<div class="manual-grid">
  <div class="manual-callout">
    <strong>New to NoHAL</strong><br>
    Read <a href="/getting-started">Getting Started</a>, then follow the <a href="/quickstart">Quickstart</a>.
  </div>
  <div class="manual-callout">
    <strong>Bringing in an existing machine</strong><br>
    Go straight to <a href="/importing-existing-hal">Import Existing HAL</a>.
  </div>
  <div class="manual-callout">
    <strong>Trying to understand the model</strong><br>
    Read <a href="/concepts">Core Concepts</a> before making structural changes.
  </div>
  <div class="manual-callout">
    <strong>Preparing for production output</strong><br>
    Review <a href="/threads-and-addf">Threads and addf</a> and <a href="/export">Export</a>.
  </div>
</div>

## Current Scope

NoHAL already covers a useful part of the LinuxCNC configuration workflow, especially around HAL graph editing, import, and export. It is still evolving, so you should expect some features to be more mature than others.

Treat generated output as something you still verify against your machine intent, especially after import, scheduling changes, or larger sheet refactors.
