import type { LinuxCncVersion } from "@nohal/core/src/types";

export interface RecentProjectEntry {
  projectPath: string;
  name?: string;
  linuxCncVersion?: LinuxCncVersion;
  lastOpenedAt: string;
}
