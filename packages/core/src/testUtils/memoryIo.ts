import type { CoreDirEntry, CoreIo } from "../types";

function createErrnoError(
  message: string,
  code: string,
): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

function normalizePath(path: string): string {
  const absolute = path.startsWith("/");
  const segments: string[] = [];
  for (const segment of path.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      if (segments.length > 0) segments.pop();
      continue;
    }
    segments.push(segment);
  }
  if (absolute) return segments.length === 0 ? "/" : `/${segments.join("/")}`;
  return segments.length === 0 ? "." : segments.join("/");
}

function createMemoryPathApi(): CoreIo["path"] {
  return {
    resolve: (...paths) => {
      let resolved = "/";
      for (const input of paths) {
        if (!input) continue;
        if (input.startsWith("/")) {
          resolved = input;
          continue;
        }
        resolved = resolved === "/" ? `/${input}` : `${resolved}/${input}`;
      }
      return normalizePath(resolved);
    },
    join: (...paths) => normalizePath(paths.filter(Boolean).join("/")),
    dirname: (inputPath) => {
      const normalized = normalizePath(
        inputPath.startsWith("/") ? inputPath : `/${inputPath}`,
      );
      if (normalized === "/") return "/";
      const index = normalized.lastIndexOf("/");
      if (index <= 0) return "/";
      return normalized.slice(0, index);
    },
    basename: (inputPath) => {
      const normalized = normalizePath(
        inputPath.startsWith("/") ? inputPath : `/${inputPath}`,
      );
      if (normalized === "/") return "";
      const index = normalized.lastIndexOf("/");
      return normalized.slice(index + 1);
    },
    extname: (inputPath) => {
      const base = normalizePath(inputPath).split("/").at(-1) ?? "";
      const dotIndex = base.lastIndexOf(".");
      if (dotIndex <= 0) return "";
      return base.slice(dotIndex);
    },
    isAbsolute: (inputPath) => inputPath.startsWith("/"),
  };
}

export interface MemoryIoHarness {
  io: CoreIo;
  readFile(path: string): Promise<string>;
}

export function createMemoryIo(): MemoryIoHarness {
  const pathApi = createMemoryPathApi();
  const files = new Map<string, string>();
  const directories = new Set<string>(["/"]);

  function ensureDir(path: string): void {
    directories.add(path);
  }

  function ensureDirRecursive(dirPath: string): void {
    const normalized = pathApi.resolve(dirPath);
    ensureDir("/");
    if (normalized === "/") return;
    let current = "/";
    for (const part of normalized.slice(1).split("/")) {
      current = current === "/" ? `/${part}` : `${current}/${part}`;
      ensureDir(current);
    }
  }

  function assertDirExists(dirPath: string): void {
    if (directories.has(dirPath)) return;
    throw createErrnoError(`ENOENT: no such directory '${dirPath}'`, "ENOENT");
  }

  function parentDir(path: string): string {
    return pathApi.dirname(pathApi.resolve(path));
  }

  function toDirEntries(dirPath: string): CoreDirEntry[] {
    const prefix = dirPath === "/" ? "/" : `${dirPath}/`;
    const names = new Set<string>();
    for (const filePath of files.keys()) {
      if (!filePath.startsWith(prefix)) continue;
      const remainder = filePath.slice(prefix.length);
      const immediate = remainder.split("/")[0];
      if (immediate) names.add(immediate);
    }
    for (const maybeDir of directories) {
      if (!maybeDir.startsWith(prefix)) continue;
      const remainder = maybeDir.slice(prefix.length);
      const immediate = remainder.split("/")[0];
      if (immediate) names.add(immediate);
    }
    return Array.from(names)
      .sort()
      .map((name) => {
        const entryPath = pathApi.join(dirPath, name);
        return {
          name,
          isFile: () => files.has(pathApi.resolve(entryPath)),
          isDirectory: () => directories.has(pathApi.resolve(entryPath)),
          isSymbolicLink: () => false,
        };
      });
  }

  const io: CoreIo = {
    fs: {
      exists: async (inputPath) => {
        const normalized = pathApi.resolve(inputPath);
        return files.has(normalized) || directories.has(normalized);
      },
      lstat: async (inputPath) => {
        const normalized = pathApi.resolve(inputPath);
        if (directories.has(normalized)) {
          return { isDirectory: () => true };
        }
        if (files.has(normalized)) {
          return { isDirectory: () => false };
        }
        throw createErrnoError(
          `ENOENT: no such file or directory '${normalized}'`,
          "ENOENT",
        );
      },
      makeDir: async (dirPath, options) => {
        const normalized = pathApi.resolve(dirPath);
        if (options?.recursive) {
          ensureDirRecursive(normalized);
          return;
        }
        assertDirExists(parentDir(normalized));
        ensureDir(normalized);
      },
      readDir: async (dirPath) => {
        const normalized = pathApi.resolve(dirPath);
        assertDirExists(normalized);
        return toDirEntries(normalized);
      },
      readTextFile: async (filePath) => {
        const normalized = pathApi.resolve(filePath);
        const file = files.get(normalized);
        if (file === undefined) {
          throw createErrnoError(
            `ENOENT: no such file '${normalized}'`,
            "ENOENT",
          );
        }
        return file;
      },
      removeFile: async (filePath) => {
        const normalized = pathApi.resolve(filePath);
        if (!files.delete(normalized)) {
          throw createErrnoError(
            `ENOENT: no such file '${normalized}'`,
            "ENOENT",
          );
        }
      },
      renamePath: async (fromPath, toPath) => {
        const normalizedFrom = pathApi.resolve(fromPath);
        const normalizedTo = pathApi.resolve(toPath);
        const file = files.get(normalizedFrom);
        if (file === undefined) {
          throw createErrnoError(
            `ENOENT: no such file '${normalizedFrom}'`,
            "ENOENT",
          );
        }
        assertDirExists(parentDir(normalizedTo));
        files.delete(normalizedFrom);
        files.set(normalizedTo, file);
      },
      writeTextFile: async (filePath, content) => {
        const normalized = pathApi.resolve(filePath);
        assertDirExists(parentDir(normalized));
        files.set(normalized, content);
      },
    },
    path: pathApi,
  };

  return {
    io,
    readFile: async (filePath) => io.fs.readTextFile(filePath),
  };
}
