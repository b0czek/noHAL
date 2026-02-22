import type { NochalApi } from "./preload/api";

declare global {
  interface Window {
    nochal: NochalApi;
  }
}

export {};
