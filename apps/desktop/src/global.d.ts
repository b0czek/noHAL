import type { NoHALApi } from "./preload/api";

declare global {
  interface Window {
    nohal: NoHALApi;
  }
}
