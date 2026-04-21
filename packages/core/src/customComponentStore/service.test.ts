import { describe, expect, it } from "vitest";
import { customComponentDefinitionEdits } from "../customComponent";
import { createMemoryIo } from "../testUtils/memoryIo";
import { expectOk } from "../testUtils/result";
import { createCustomComponentStoreService } from "./service";
import { STORE_CUSTOM_COMPONENT_ID_PREFIX } from "./shared";

const STORE_FILE_PATH = "/config/custom-component-store.json";

describe("custom component store", () => {
  it("reads an empty custom component store from a missing file", async () => {
    const { io } = createMemoryIo();
    const service = createCustomComponentStoreService(io);

    const store = await service.readCustomComponentStoreFile(STORE_FILE_PATH);

    expect(store.components).toEqual({});
    expect(store.createdAt).toBeTypeOf("string");
    expect(store.updatedAt).toBeTypeOf("string");
  });

  it("adds, updates, and removes custom store components", async () => {
    const { io } = createMemoryIo();
    const service = createCustomComponentStoreService(io);

    const created = await service.addCustomComponentToStore(
      STORE_FILE_PATH,
      "store_logic",
    );

    expect(
      created.componentId.startsWith(STORE_CUSTOM_COMPONENT_ID_PREFIX),
    ).toBe(true);
    expect(created.parsed.halComponentName).toBe("store_logic");
    expect(created.parsed.parseMeta).toEqual({
      parser: "nohal-manual-v1",
      warnings: [],
    });

    const updatedComponent = structuredClone(created.parsed);
    const renamed = customComponentDefinitionEdits.halComponentName.update(
      updatedComponent,
      "store_logic_renamed",
    );
    const runtimeUpdated = customComponentDefinitionEdits.runtimeKind.update(
      updatedComponent,
      "rt",
    );
    const pinAdded = customComponentDefinitionEdits.pin.add(updatedComponent);

    expectOk(renamed);
    expectOk(runtimeUpdated);
    expectOk(pinAdded);

    const updated = await service.updateCustomComponentInStore(
      STORE_FILE_PATH,
      created.componentId,
      updatedComponent,
    );

    expect(updated.parsed.halComponentName).toBe("store_logic_renamed");
    expect(updated.parsed.runtime?.kind).toBe("rt");
    expect(updated.parsed.pins).toHaveLength(1);

    await service.removeCustomComponentFromStore(
      STORE_FILE_PATH,
      created.componentId,
    );
    const store = await service.readCustomComponentStoreFile(STORE_FILE_PATH);

    expect(store.components[created.componentId]).toBeUndefined();
  });

  it("blocks renaming a custom component to an existing store component name", async () => {
    const { io } = createMemoryIo();
    const service = createCustomComponentStoreService(io);

    await service.addCustomComponentToStore(STORE_FILE_PATH, "store_logic");
    const created = await service.addCustomComponentToStore(
      STORE_FILE_PATH,
      "store_logic_two",
    );

    const updatedComponent = structuredClone(created.parsed);
    const renamed = customComponentDefinitionEdits.halComponentName.update(
      updatedComponent,
      "store_logic",
    );

    expectOk(renamed);

    await expect(
      service.updateCustomComponentInStore(
        STORE_FILE_PATH,
        created.componentId,
        updatedComponent,
      ),
    ).rejects.toThrow("HAL component name already exists: store_logic");
  });

  it("promotes a project custom component into the store with a new id", async () => {
    const { io } = createMemoryIo();
    const service = createCustomComponentStoreService(io);

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
      promoted.componentId.startsWith(STORE_CUSTOM_COMPONENT_ID_PREFIX),
    ).toBe(true);
    expect(promoted.parsed.halComponentName).toBe("project_custom");
    expect(promoted.parsed.loadCommand).toBe("loadusr project_custom");
  });
});
