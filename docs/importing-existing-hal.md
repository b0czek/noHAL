# Import Existing HAL

This page explains the practical import flow for an existing LinuxCNC machine configuration.

## What the Import Starts From

The import flow begins with:

- one LinuxCNC `.ini` file
- one or more HAL files

The app uses the INI as the anchor and lets you confirm which HAL files should be included before component linking happens.

## Import Flow

### 1. Pick the INI file

Start from the landing page and choose `Import Machine Configuration`, then pick the machine `.ini` file.

NoHAL reads the machine configuration setup first so it can:

- prefill likely HAL file references
- inspect INI values
- detect import warnings early

### 2. Review HAL files

On the machine-files step, confirm which HAL files should be included.

Use this stage to:

- remove files that should not be part of the imported graph
- add missing files manually
- decide whether INI substitutions should be resolved

Do not rush this step. A clean import depends on choosing the right source set.

### 3. Configure Mesa hardware when required

If the import detects Mesa or HostMot2 usage, NoHAL stops and asks you to configure the actual board layout.

That is deliberate. The app does not try to guess physical hardware details when the configuration needs an explicit declaration.

### 4. Review component linking

The linking stage compares imported groups with known components from:

- built-in definitions
- stored components
- generated project-local components

You should review every auto-match that looks ambiguous.

### 5. Create the imported project

Once the links look correct, create the project and review the imported sheet in the editor.

## What to Verify After Import

- Imported components map to the expected runtime definitions.
- Project-local generated components are only used where needed.
- The graph layout is understandable enough to continue editing safely.
- Project HAL threads and root sheet bindings still make sense.
- Parser warnings are understood before you export anything important.

## When Import Works Best

Import works best when:

- the source HAL files are already reasonably structured
- component identities are consistent
- the machine uses recognizable system and store components
- thread usage is not hidden behind too much textual indirection

## When You Should Expect Cleanup

Plan time for cleanup when:

- the original HAL is large and organic
- component naming is inconsistent
- the project mixes main and postgui behavior heavily
- hardware-specific details were implied rather than stated clearly

After import, the next useful pages are [Build a Project](/building-a-project), [Edit Networks](/editing-networks), and [Export](/export).
