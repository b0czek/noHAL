import { createEmptyComponentStore } from "@nohal/core/componentStore";
import { CUSTOM_COMPONENT_STORE_SOURCE_ID } from "@nohal/core/customComponentStore";
import { createEmptyProject } from "@nohal/core/project";
import type {
  ComponentStoreEntry,
  ComponentStoreManualSource,
  ImportedComponentDefinition,
} from "@nohal/core/types";
import { describe, expect, it } from "vitest";
import type { NoHALApi } from "../../../../preload/api";
import { createEditorStore } from "../../store";

const MANUAL_SOURCE: ComponentStoreManualSource = {
  id: CUSTOM_COMPONENT_STORE_SOURCE_ID,
  kind: "manual",
  createdAt: "2026-04-10T00:00:00.000Z",
  updatedAt: "2026-04-10T00:00:00.000Z",
};

function createManualEntry(
  componentId: string,
  component: ImportedComponentDefinition,
): ComponentStoreEntry {
  return {
    componentId,
    sourceRef: {
      kind: "manual",
      sourceId: MANUAL_SOURCE.id,
    },
    parsed: component,
    createdAt: "2026-04-10T00:00:00.000Z",
    updatedAt: "2026-04-10T00:00:00.000Z",
  };
}

function installNoHALMock(overrides: Partial<NoHALApi>) {
  (globalThis as { window?: { nohal: NoHALApi } }).window = {
    nohal: overrides as NoHALApi,
  };
}

describe("component store actions", () => {
  it("reconciles project nodes immediately after a manual store edit", async () => {
    const project = createEmptyProject("Store Edit Sync");
    const componentId = "store-custom:test";
    const initialComponent: ImportedComponentDefinition = {
      id: componentId,
      name: "store_component",
      halComponentName: "store_component",
      source: "manual",
      runtime: { kind: "unknown" },
      pins: [{ key: "pin", name: "pin", direction: "in", type: "bit" }],
      params: [],
      parseMeta: { parser: "nohal-manual-v1", warnings: [] },
    };
    const updatedComponent: ImportedComponentDefinition = {
      ...structuredClone(initialComponent),
      pins: [],
    };
    const entry = createManualEntry(componentId, initialComponent);
    const updatedEntry = createManualEntry(componentId, updatedComponent);

    project.library.components[componentId] = initialComponent;
    project.sheets[project.rootSheetId].nodes.push({
      id: "node_component",
      kind: "component",
      componentId,
      instanceName: "store_component.0",
      position: { x: 100, y: 120 },
      paramValues: {},
      pinInitialValues: {
        pin: "1",
      },
    });

    installNoHALMock({
      updateManualComponentInStore: async () => updatedEntry,
    });

    const store = createEditorStore(project, (key) => key);
    const componentStore = createEmptyComponentStore();
    componentStore.sources[MANUAL_SOURCE.id] = MANUAL_SOURCE;
    componentStore.components[componentId] = entry;
    store.setState("componentStore", componentStore);

    await store.actions.removeStoreCustomComponentPin(componentId, "pin");

    expect(
      store.state.componentStore.components[componentId]?.parsed.pins,
    ).toEqual([]);
    expect(store.state.project.library.components[componentId]?.pins).toEqual(
      [],
    );
    const node = store.state.project.sheets[project.rootSheetId].nodes.find(
      (candidate) => candidate.kind === "component",
    );
    expect(node?.kind).toBe("component");
    if (node?.kind === "component") {
      expect(node.pinInitialValues).toBeUndefined();
    }
  });

  it("promotes a project custom component and repoints existing nodes", async () => {
    const project = createEmptyProject("Store Promote");
    const oldComponentId = "manual:project-custom";
    const newComponentId = "store-custom:promoted";
    const projectComponent = {
      id: oldComponentId,
      name: "project_custom",
      halComponentName: "project_custom",
      source: "manual" as const,
      runtime: { kind: "unknown" as const },
      pins: [
        {
          key: "pin",
          name: "pin",
          direction: "in" as const,
          type: "bit" as const,
        },
      ],
      params: [],
    };
    const promotedEntry = createManualEntry(newComponentId, {
      ...projectComponent,
      id: newComponentId,
      parseMeta: { parser: "nohal-manual-v1", warnings: [] },
    });

    project.library.components[oldComponentId] = projectComponent;
    project.sheets[project.rootSheetId].nodes.push({
      id: "node_component",
      kind: "component",
      componentId: oldComponentId,
      instanceName: "project_custom.0",
      position: { x: 40, y: 60 },
      paramValues: {},
    });

    installNoHALMock({
      promoteProjectCustomComponentToStore: async (component) => {
        structuredClone(component);
        return promotedEntry;
      },
    });

    const store = createEditorStore(project, (key) => key);

    const promotedId =
      await store.actions.promoteCustomComponentToStore(oldComponentId);

    expect(store.state.componentStore.sources[MANUAL_SOURCE.id]).toMatchObject({
      id: MANUAL_SOURCE.id,
      kind: "manual",
    });
    expect(store.state.componentStore.components[newComponentId]).toEqual(
      promotedEntry,
    );
    expect(
      store.state.project.library.components[oldComponentId],
    ).toBeUndefined();
    expect(store.state.project.library.components[newComponentId]).toEqual(
      promotedEntry.parsed,
    );
    const node = store.state.project.sheets[project.rootSheetId].nodes.find(
      (candidate) => candidate.kind === "component",
    );
    expect(node?.kind).toBe("component");
    if (node?.kind === "component") {
      expect(node.componentId).toBe(newComponentId);
    }
    expect(promotedId).toBe(newComponentId);
    expect(store.state.isDirty).toBe(true);
    expect(store.state.canUndo).toBe(false);
  });
});
