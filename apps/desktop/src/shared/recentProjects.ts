import type { LinuxCncVersion } from "@nohal/core/linuxcncVersion";

export interface RecentProjectEntry {
  projectPath: string;
  name?: string;
  linuxCncVersion?: LinuxCncVersion;
  lastOpenedAt: string;
}
