import type { Dirent } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import type { CoreDirEntry, CoreIo } from "@nohal/core";

function toCoreDirEntry(entry: Dirent): CoreDirEntry {
  return {
    name: entry.name,
    isFile: () => entry.isFile(),
    isDirectory: () => entry.isDirectory(),
    isSymbolicLink: () => entry.isSymbolicLink(),
  };
}

export function createNodeIo(currentWorkingDirectory = process.cwd()): CoreIo {
  return {
    fs: {
      exists: async (filePath) => {
        try {
          await fs.access(filePath);
          return true;
        } catch {
          return false;
        }
      },
      lstat: async (filePath) => fs.lstat(filePath),
      makeDir: async (dirPath, options) => {
        await fs.mkdir(dirPath, options);
      },
      readDir: async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        return entries.map(toCoreDirEntry);
      },
      readTextFile: async (filePath) => fs.readFile(filePath, "utf8"),
      removeFile: async (filePath) => {
        await fs.unlink(filePath);
      },
      renamePath: async (fromPath, toPath) => {
        await fs.rename(fromPath, toPath);
      },
      writeTextFile: async (filePath, content) => {
        await fs.writeFile(filePath, content, "utf8");
      },
    },
    path: {
      resolve: (...paths) => path.resolve(currentWorkingDirectory, ...paths),
      join: (...paths) => path.join(...paths),
      dirname: (filePath) => path.dirname(filePath),
      basename: (filePath) => path.basename(filePath),
      extname: (filePath) => path.extname(filePath),
      isAbsolute: (filePath) => path.isAbsolute(filePath),
    },
  };
}
