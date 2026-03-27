# Installation

This page covers the practical setup needed to run NoHAL today.

## Supported Delivery

The repository currently packages the desktop app with `electron-builder`.

The release process in this repo produces Linux artifacts:

- `AppImage`
- `deb`

If you are using GitHub releases, download the artifact that matches your system and install it the same way you would install other Linux desktop applications.

## Running from Source

If you are working from the repository instead of a packaged build, use:

```bash
pnpm install
pnpm dev
```

The current repo expects:

- Node.js 22
- `pnpm`

## First Launch Checklist

After opening NoHAL:

1. Confirm the window opens with the landing page.
2. Choose the target LinuxCNC version you want the project to follow.
3. Create a blank project or import a machine configuration.
4. Open `General Settings` if you need to adjust interface scale.

## If You Are Evaluating the Tool

For a first pass, do not start with your most complex machine.

Use one of these:

- a small real machine configuration
- a reduced copy of a larger config
- a scratch project for testing sheets, ports, and scheduling

That will let you verify the NoHAL model before you commit to a migration path.
