import { describe, expect, it } from "vitest";
import { createEmptyComponentStore } from "../componentStore";
import type { ComponentStore } from "../types";
import { suggestHalImportLinks } from "./links";

function withBuiltinEntry(
  store: ComponentStore,
  componentId: string,
  halComponentName: string,
): ComponentStore {
  store.sources["linuxcnc-builtin:2.10"] = {
    id: "linuxcnc-builtin:2.10",
    kind: "linuxcnc-builtin",
    linuxcncVersion: "2.10",
    revision: "test-revision",
    refName: "test-ref",
    repoPath: "embedded://test",
    createdAt: "2026-03-12T00:00:00.000Z",
    updatedAt: "2026-03-12T00:00:00.000Z",
  };
  store.components[componentId] = {
    componentId,
    sourceRef: {
      kind: "linuxcnc-builtin",
      sourceId: "linuxcnc-builtin:2.10",
      filePath: `linuxcnc:2.10:${halComponentName}`,
    },
    parsed: {
      id: componentId,
      name: halComponentName,
      halComponentName,
      source: "comp",
      pins: [],
      params: [],
      parseMeta: {
        parser: "nohal-comp-v1",
        warnings: [],
      },
    },
    createdAt: "2026-03-12T00:00:00.000Z",
    updatedAt: "2026-03-12T00:00:00.000Z",
  };
  return store;
}

describe("suggestHalImportLinks", () => {
  it("keeps motmod spindle namespaces project-local instead of binding to the generated spindle component", () => {
    const store = withBuiltinEntry(
      createEmptyComponentStore(),
      "linuxcnc:2.10:comp:spindle:spindle",
      "spindle",
    );

    const [suggestion] = suggestHalImportLinks(
      {
        parser: "nohal-hal-v1",
        lineCount: 0,
        componentGroups: [
          {
            id: "group_spindle",
            inferredHalComponentName: "spindle",
            runtimeHint: "unknown",
            instances: [
              {
                instanceName: "spindle.0",
                componentGroupId: "group_spindle",
                pinNames: ["on"],
                paramValues: {},
              },
            ],
            pins: [{ name: "on", observedDirections: ["out"] }],
            params: [],
          },
        ],
        nets: [],
        setps: [],
        addfs: [],
        warnings: [],
      },
      store,
      { linuxcncVersion: "2.10" },
    );

    expect(suggestion).toEqual({
      groupId: "group_spindle",
      selection: { groupId: "group_spindle", mode: "project-local" },
      reason: "system HAL namespace handled by importer",
    });
  });

  it("still links ordinary components to exact store matches", () => {
    const store = withBuiltinEntry(
      createEmptyComponentStore(),
      "linuxcnc:2.10:comp:and2:and2",
      "and2",
    );

    const [suggestion] = suggestHalImportLinks(
      {
        parser: "nohal-hal-v1",
        lineCount: 0,
        componentGroups: [
          {
            id: "group_and2",
            inferredHalComponentName: "and2",
            runtimeHint: "rt",
            instances: [
              {
                instanceName: "and2.0",
                componentGroupId: "group_and2",
                pinNames: ["in0", "out"],
                paramValues: {},
              },
            ],
            pins: [
              { name: "in0", observedDirections: ["in"] },
              { name: "out", observedDirections: ["out"] },
            ],
            params: [],
          },
        ],
        nets: [],
        setps: [],
        addfs: [],
        warnings: [],
      },
      store,
      { linuxcncVersion: "2.10" },
    );

    expect(suggestion).toEqual({
      groupId: "group_and2",
      selection: {
        groupId: "group_and2",
        mode: "store",
        componentId: "linuxcnc:2.10:comp:and2:and2",
      },
      reason: "exact halComponentName match",
    });
  });
});
