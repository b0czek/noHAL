import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseNoHALProject } from "../shared/project";
import type { NoHALProject } from "../shared/types";

export async function readProjectFile(filePath: string): Promise<{ project: NoHALProject; filePath: string }> {
  const normalizedFilePath = path.resolve(filePath);
  const content = await readFile(normalizedFilePath, "utf8");
  const project = parseNoHALProject(content);
  return { project, filePath: normalizedFilePath };
}
