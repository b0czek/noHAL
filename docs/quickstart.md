# Quickstart

This walkthrough is the fastest way to get from an empty editor to generated HAL.

## What You Will Do

You will:

1. create or import a project
2. place or review components on the canvas
3. connect the graph
4. check project and sheet settings
5. run `Build`

## Option A: Start Blank

Use this if you want to learn the editor without import complexity.

### Steps

1. Open NoHAL.
2. On the landing page, click `Create Blank`.
3. In the top bar, open the component picker and place a few components.
4. Add wires between compatible pins.
5. Add text or labels if the graph needs explanation.
6. Open `Project Settings` and review `HAL Threads`.
7. Open `Sheet Settings` for the root sheet and review `Thread Outputs` and `addf Queue`.
8. Click `Build`.

### What to Check

- Your components have sensible instance names.
- Pins and parameters that need defaults are configured.
- The `addf Queue` has the intended order.
- Root sheet thread outputs are bound to the intended HAL threads.

## Option B: Import an Existing LinuxCNC Configuration

Use this if your goal is migration rather than exploration.

### Steps

1. On the landing page, click `Import Machine Configuration`.
2. Pick the machine `.ini` file.
3. Review the detected HAL files and add or remove rows if needed.
4. If Mesa hardware is detected, configure the actual board layout before continuing.
5. Review component linking.
6. Decide which unmatched groups should become project-local generated components.
7. Create the imported project.
8. Review the imported sheet, then open `Project Settings` and `Sheet Settings`.
9. Click `Build`.

### What to Check

- Auto-linked component groups match the components you expect.
- Project-local generated components are named clearly.
- Imported sheet structure is readable before you start cleanup.
- Warnings from import are understood before you trust the output.

## Next Pages

If the quickstart worked, continue with:

- [Core Concepts](/concepts)
- [Edit Networks](/editing-networks)
- [Export](/export)
