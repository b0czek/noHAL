/// <reference types="vite/client" />

import type { NoHALApi } from "./preload/api";

declare module "*.svg" {
  const src: string;
  export default src;
}

declare global {
  interface Window {
    nohal: NoHALApi;
  }
}
