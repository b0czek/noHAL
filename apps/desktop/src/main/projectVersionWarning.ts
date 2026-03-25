import appPackageJson from "../../package.json";

export const NOHAL_APP_VERSION =
  typeof appPackageJson.version === "string" ? appPackageJson.version : "0.0.0";

export interface ProjectVersionWarning {
  title: string;
  message: string;
  detail: string;
}

function parseVersion(value: string): number[] | null {
  const normalized = value.trim().split("-", 1)[0] ?? "";
  if (!normalized) return null;
  const parts = normalized.split(".");
  if (parts.length === 0) return null;

  const parsed: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    parsed.push(Number(part));
  }
  return parsed;
}

export function compareNoHALVersions(
  left: string,
  right: string,
): number | null {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);
  if (!leftParts || !rightParts) return null;

  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart === rightPart) continue;
    return leftPart > rightPart ? 1 : -1;
  }

  return 0;
}

export function getProjectVersionWarning(
  savedWith: string | undefined,
  currentVersion = NOHAL_APP_VERSION,
): ProjectVersionWarning | null {
  if (!savedWith) return null;
  const comparison = compareNoHALVersions(savedWith, currentVersion);
  if (comparison === null || comparison <= 0) return null;

  return {
    title: "Project Saved in Newer NoHAL",
    message: `This project was last saved with NoHAL ${savedWith}.`,
    detail: `You are running NoHAL ${currentVersion}. The project will still open, but newer features or settings may be missing or behave differently in this version.`,
  };
}
