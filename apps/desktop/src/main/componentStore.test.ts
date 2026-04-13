import { access, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { appSettings } from "./appSettings";
import { componentStore } from "./componentStore";

const mockState = vi.hoisted(() => ({
  userDataDir: "",
}));

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => mockState.userDataDir),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
}));

const tempDirs: string[] = [];

async function makeTempDir(prefix = "nohal-component-store-test-") {
  const dir = await mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0, tempDirs.length)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
  mockState.userDataDir = "";
});

describe("custom component store path resolution", () => {
  it("uses the default userData custom store file when no override is set", async () => {
    const userDataDir = await makeTempDir("nohal-user-data-");
    mockState.userDataDir = userDataDir;

    const info = await componentStore.getCustomComponentStorePathInfo();
    const expectedPath = path.join(userDataDir, "custom-component-store.json");

    expect(info).toEqual({
      path: expectedPath,
      defaultPath: expectedPath,
      isDefault: true,
    });

    await componentStore.addManualComponentToStore("store_logic_default");

    const saved = JSON.parse(await readFile(expectedPath, "utf8")) as {
      components?: Record<
        string,
        { parsed?: { halComponentName?: string } | undefined }
      >;
    };
    expect(
      Object.values(saved.components ?? {}).some(
        (entry) => entry.parsed?.halComponentName === "store_logic_default",
      ),
    ).toBe(true);
    expect(
      (await readdir(userDataDir)).some((name) => name.includes(".tmp-")),
    ).toBe(false);
  });

  it("writes the custom component store to the configured override path", async () => {
    const userDataDir = await makeTempDir("nohal-user-data-");
    const sharedDir = await makeTempDir("nohal-shared-store-");
    mockState.userDataDir = userDataDir;
    const customStorePath = path.join(sharedDir, "team-store.json");

    await appSettings.write({
      canvasGridResolution: 0,
      customComponentStoreFilePath: customStorePath,
      interfaceScale: 1,
      locale: "en",
    });

    const info = await componentStore.getCustomComponentStorePathInfo();
    expect(info).toEqual({
      path: customStorePath,
      defaultPath: path.join(userDataDir, "custom-component-store.json"),
      isDefault: false,
    });

    await componentStore.addManualComponentToStore("store_logic_shared");

    const saved = JSON.parse(await readFile(customStorePath, "utf8")) as {
      components?: Record<
        string,
        { parsed?: { halComponentName?: string } | undefined }
      >;
    };
    expect(
      Object.values(saved.components ?? {}).some(
        (entry) => entry.parsed?.halComponentName === "store_logic_shared",
      ),
    ).toBe(true);
    await expect(
      access(path.join(userDataDir, "custom-component-store.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(
      (await readdir(sharedDir)).some((name) => name.includes(".tmp-")),
    ).toBe(false);
  });
});
