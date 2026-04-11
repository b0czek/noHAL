import type { CoreIo } from "../types";

const ATOMIC_WRITE_RANDOM_SUFFIX_RADIX = 36;
const ATOMIC_WRITE_RANDOM_SUFFIX_START = 2;
const ATOMIC_WRITE_RANDOM_SUFFIX_END = 10;

let atomicWriteCounter = 0;

function atomicTempPathFor(filePath: string): string {
  atomicWriteCounter += 1;
  const randomSuffix = Math.random()
    .toString(ATOMIC_WRITE_RANDOM_SUFFIX_RADIX)
    .slice(ATOMIC_WRITE_RANDOM_SUFFIX_START, ATOMIC_WRITE_RANDOM_SUFFIX_END);
  return `${filePath}.tmp-${Date.now()}-${atomicWriteCounter}-${randomSuffix}`;
}

export async function writeFileAtomic(
  io: CoreIo,
  filePath: string,
  content: string,
): Promise<void> {
  const tempPath = atomicTempPathFor(filePath);
  try {
    await io.fs.writeTextFile(tempPath, content);
    await io.fs.renamePath(tempPath, filePath);
  } catch (error) {
    try {
      await io.fs.removeFile(tempPath);
    } catch {
      // Best-effort cleanup only; original error should be preserved.
    }
    throw error;
  }
}
