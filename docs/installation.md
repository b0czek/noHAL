# Installation

The main way to install NoHAL is from the GitHub releases page:

[https://github.com/b0czek/noHAL/releases](https://github.com/b0czek/noHAL/releases)

## Install From A Release

The current repository is set up to produce Linux desktop release artifacts:

- `.deb`
- `AppImage`

Use `.deb` if you are on a Debian-based system such as Debian, Ubuntu, or Linux Mint and you want a normal installed application.

Use `AppImage` if you want a portable build that does not install system-wide or if you are on another Linux distribution that can run AppImages.

### `.deb`

Recommended for Debian-based systems.

Install it with your package manager or desktop software installer. From a terminal, the usual pattern is:

```bash
sudo apt install ./NoHAL-<version>-linux-<arch>.deb
```

Use the actual file name you downloaded from the releases page.

Choose this when you want the application installed in the normal way and integrated with your desktop.

### `AppImage`

Recommended when you want a portable build or do not want to install a package.

An AppImage does not need to be installed. Make it executable and run it:

```bash
chmod +x NoHAL-<version>-linux-<arch>.AppImage
./NoHAL-<version>-linux-<arch>.AppImage
```

## Build From Source Instead

If you are working from the repository rather than a packaged release, you can run NoHAL from source:

```bash
pnpm install
pnpm dev
```

This is also the way to run NoHAL on Windows or macOS, since the release artifacts documented above are Linux-focused.

The current repository expects:

- Node.js 22
- `pnpm`
