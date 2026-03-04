export interface CorePathApi {
  resolve(...paths: string[]): string;
  join(...paths: string[]): string;
  dirname(path: string): string;
  basename(path: string): string;
  extname(path: string): string;
  isAbsolute(path: string): boolean;
}

export interface CoreFileStat {
  isDirectory(): boolean;
}

export interface CoreDirEntry {
  name: string;
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
}

export interface CoreFileSystemApi {
  exists(path: string): Promise<boolean>;
  lstat(path: string): Promise<CoreFileStat>;
  makeDir(dirPath: string, options?: { recursive?: boolean }): Promise<void>;
  readDir(dirPath: string): Promise<CoreDirEntry[]>;
  readTextFile(filePath: string): Promise<string>;
  removeFile(filePath: string): Promise<void>;
  renamePath(fromPath: string, toPath: string): Promise<void>;
  writeTextFile(filePath: string, content: string): Promise<void>;
}

export interface CoreIo {
  fs: CoreFileSystemApi;
  path: CorePathApi;
}
