const HAL_NAME_RE = /^[A-Za-z_][A-Za-z0-9_.-]*$/;

export const DEFAULT_HAL_NAME_LEN = 41;
export const MIN_HAL_NAME_LEN = 2;

export function normalizeHalNameLen(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(`${value ?? ""}`.trim(), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_HAL_NAME_LEN;
  return Math.max(MIN_HAL_NAME_LEN, Math.round(parsed));
}

export function maxUsableHalNameLength(halNameLen: number): number {
  return Math.max(1, normalizeHalNameLen(halNameLen) - 1);
}

export function getHalNameLengthWarning(
  kind: "HAL name" | "HAL signal name",
  value: string,
  halNameLen: number,
): string | null {
  const configuredHalNameLen = normalizeHalNameLen(halNameLen);
  const maxUsableLength = maxUsableHalNameLength(configuredHalNameLen);
  if (value.length <= maxUsableLength) return null;
  return `${kind} '${value}' is ${value.length} characters long, exceeding the configured limit of ${maxUsableLength} (HAL_NAME_LEN=${configuredHalNameLen})`;
}

export function isValidHalName(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!HAL_NAME_RE.test(trimmed)) return false;
  if (trimmed.startsWith(".") || trimmed.endsWith(".")) return false;
  if (trimmed.includes("..")) return false;
  return true;
}
