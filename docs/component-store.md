# Component Store

The Component Store is where NoHAL gathers reusable component definitions outside the current sheet.

## What the Store Is For

Use the store to:

- browse available components
- import LinuxCNC `.comp` files
- add directory sources for reusable definitions
- review what sources a component came from

This is especially useful when you want repeatable reuse instead of one-off project-local generated components.

## Source Types You Will See

Depending on the project state, you may see components from:

- the built-in library
- manual directory sources
- direct `.comp` file imports

Those sources appear together in the store so you can review what is available before placing components in a sheet.

## When to Use the Store vs Project-Local Components

Use the Component Store when:

- a component should be reusable across projects
- you have a real `.comp` definition to import
- you want a consistent shared source for a family of machines

Use a project-local generated component when:

- the import flow created a one-off local definition
- the component only exists to preserve a project-specific shape
- reuse would create more confusion than value

## Good Practice

- prefer stable source definitions over repeated local copies
- name imported sources clearly
- refresh sources after changes
- inspect warnings before trusting a definition
