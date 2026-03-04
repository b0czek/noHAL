export const SUPPORTED_LINUXCNC_VERSIONS = [
  "2.7",
  "2.8",
  "2.9",
  "2.10",
] as const;

export type LinuxCncVersion = (typeof SUPPORTED_LINUXCNC_VERSIONS)[number];

const SUPPORTED_VERSION_SET = new Set<string>(SUPPORTED_LINUXCNC_VERSIONS);

export function isLinuxCncVersion(value: string): value is LinuxCncVersion {
  return SUPPORTED_VERSION_SET.has(value.trim());
}

export function normalizeLinuxCncVersion(value: unknown): LinuxCncVersion {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (isLinuxCncVersion(trimmed)) return trimmed;
    if (trimmed.startsWith("2.10")) return "2.10";
    if (trimmed.startsWith("2.9")) return "2.9";
    if (trimmed.startsWith("2.8")) return "2.8";
    if (trimmed.startsWith("2.7")) return "2.7";
  }
  return "2.10";
}
