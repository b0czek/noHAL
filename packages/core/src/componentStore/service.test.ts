import { describe, expect, it } from "vitest";
import { customComponentDefinitionEdits } from "../customComponent";
import { createMemoryIo } from "../testUtils/memoryIo";
import {
  createEmptyComponentStore,
  MANUAL_COMPONENT_STORE_SOURCE_ID,
  STORE_MANUAL_COMPONENT_ID_PREFIX,
} from "./index";
import { createComponentStoreService } from "./service";

const STORE_FILE_PATH = "/config/component-store.json";

describe("component store manual components", () => {
  it("creates the singleton manual source in an empty store", async () => {
    const { io } = createMemoryIo();
    const service = createComponentStoreService(io);

    const store = await service.readComponentStoreFile(STORE_FILE_PATH);

    expect(store.sources[MANUAL_COMPONENT_STORE_SOURCE_ID]).toMatchObject({
      id: MANUAL_COMPONENT_STORE_SOURCE_ID,
      kind: "manual",
    });
  });

  it("hydrates the singleton manual source when reading an older store file", async () => {
    const { io } = createMemoryIo();
    const service = createComponentStoreService(io);
    const legacyStore = createEmptyComponentStore();
    delete legacyStore.sources[MANUAL_COMPONENT_STORE_SOURCE_ID];

    await io.fs.makeDir("/config", { recursive: true });
    await io.fs.writeTextFile(
      STORE_FILE_PATH,
      `${JSON.stringify(legacyStore, null, 2)}\n`,
    );

    const store = await service.readComponentStoreFile(STORE_FILE_PATH);

    expect(store.sources[MANUAL_COMPONENT_STORE_SOURCE_ID]).toMatchObject({
      id: MANUAL_COMPONENT_STORE_SOURCE_ID,
      kind: "manual",
    });
  });

  it("adds, updates, and removes manual store components", async () => {
    const { io } = createMemoryIo();
    const service = createComponentStoreService(io);

    const created = await service.addManualComponentToStore(
      STORE_FILE_PATH,
      "store_logic",
    );

    expect(
      created.componentId.startsWith(STORE_MANUAL_COMPONENT_ID_PREFIX),
    ).toBe(true);
    expect(created.sourceRef).toEqual({
      kind: "manual",
      sourceId: MANUAL_COMPONENT_STORE_SOURCE_ID,
    });
    expect(created.parsed.halComponentName).toBe("store_logic");
    expect(created.parsed.parseMeta).toEqual({
      parser: "nohal-manual-v1",
      warnings: [],
    });

    const updatedComponent = structuredClone(created.parsed);
    customComponentDefinitionEdits.halComponentName.update(
      updatedComponent,
      "store_logic_renamed",
    );
    customComponentDefinitionEdits.runtimeKind.update(updatedComponent, "rt");
    customComponentDefinitionEdits.pin.add(updatedComponent);

    const updated = await service.updateManualComponentInStore(
      STORE_FILE_PATH,
      created.componentId,
      updatedComponent,
    );

    expect(updated.parsed.halComponentName).toBe("store_logic_renamed");
    expect(updated.parsed.runtime?.kind).toBe("rt");
    expect(updated.parsed.pins).toHaveLength(1);

    await service.removeManualComponentFromStore(
      STORE_FILE_PATH,
      created.componentId,
    );
    const store = await service.readComponentStoreFile(STORE_FILE_PATH);

    expect(store.components[created.componentId]).toBeUndefined();
    expect(store.sources[MANUAL_COMPONENT_STORE_SOURCE_ID]).toBeDefined();
  });

  it("blocks renaming a manual component to an existing store component name", async () => {
    const { io } = createMemoryIo();
    const service = createComponentStoreService(io);

    await io.fs.makeDir("/components", { recursive: true });
    await io.fs.writeTextFile(
      "/components/demo.comp",
      `
component demo;
pin in bit input;
;;
`,
    );

    await service.saveParsedCompFileToStore(
      STORE_FILE_PATH,
      "/components/demo.comp",
    );
    const created = await service.addManualComponentToStore(
      STORE_FILE_PATH,
      "store_logic",
    );

    const updatedComponent = structuredClone(created.parsed);
    customComponentDefinitionEdits.halComponentName.update(
      updatedComponent,
      "demo",
    );

    await expect(
      service.updateManualComponentInStore(
        STORE_FILE_PATH,
        created.componentId,
        updatedComponent,
      ),
    ).rejects.toThrow("HAL component name already exists: demo");
  });

  it("promotes a project custom component into the manual store with a new id", async () => {
    const { io } = createMemoryIo();
    const service = createComponentStoreService(io);

    const promoted = await service.promoteProjectCustomComponentToStore(
      STORE_FILE_PATH,
      {
        id: "manual:project-custom",
        name: "project_custom",
        halComponentName: "project_custom",
        source: "manual",
        runtime: { kind: "userspace" },
        loadCommand: "loadusr project_custom",
        pins: [{ key: "input", name: "input", direction: "in", type: "bit" }],
        params: [],
      },
    );

    expect(promoted.componentId).not.toBe("manual:project-custom");
    expect(
      promoted.componentId.startsWith(STORE_MANUAL_COMPONENT_ID_PREFIX),
    ).toBe(true);
    expect(promoted.parsed.halComponentName).toBe("project_custom");
    expect(promoted.parsed.loadCommand).toBe("loadusr project_custom");
  });
});
