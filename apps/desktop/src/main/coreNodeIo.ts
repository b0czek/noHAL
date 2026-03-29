import {
  access,
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import type { CoreFileSystemApi, CoreIo, CorePathApi } from "@nohal/core/types";

export const nodePathApi: CorePathApi = {
  resolve: (...paths) => path.resolve(...paths),
  join: (...paths) => path.join(...paths),
  dirname: (inputPath) => path.dirname(inputPath),
  basename: (inputPath) => path.basename(inputPath),
  extname: (inputPath) => path.extname(inputPath),
  isAbsolute: (inputPath) => path.isAbsolute(inputPath),
};

export const nodeFileSystemApi: CoreFileSystemApi = {
  exists: async (inputPath) => {
    try {
      await access(inputPath);
      return true;
    } catch {
      return false;
    }
  },
  lstat: async (inputPath) => lstat(inputPath),
  makeDir: async (dirPath, options) => {
    await mkdir(dirPath, { recursive: options?.recursive === true });
  },
  readDir: async (dirPath) => readdir(dirPath, { withFileTypes: true }),
  readTextFile: async (filePath) => readFile(filePath, "utf8"),
  removeFile: async (filePath) => unlink(filePath),
  renamePath: async (fromPath, toPath) => rename(fromPath, toPath),
  writeTextFile: async (filePath, content) =>
    writeFile(filePath, content, "utf8"),
};

export const nodeIo: CoreIo = {
  fs: nodeFileSystemApi,
  path: nodePathApi,
};
