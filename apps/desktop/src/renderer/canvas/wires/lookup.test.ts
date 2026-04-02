import { createEmptyProject } from "@nohal/core/project";
import { describe, expect, it } from "vitest";
import { clearSheetLookupCache, getSheetLookup } from "./lookup";

const TEST_COMPONENT_ID = "comp:test-and2";

describe("sheet wire lookup cache", () => {
  it("rebuilds cached sheet lookups after the cache is cleared", () => {
    clearSheetLookupCache();
    const project = createEmptyProject("Lookup Cache Fixture");
    project.library.components[TEST_COMPONENT_ID] = {
      id: TEST_COMPONENT_ID,
      name: "Test AND",
      halComponentName: "and2",
      source: "comp",
      sourcePath: "tests/and2.comp",
      runtime: { kind: "rt" },
      pins: [{ key: "in0", name: "in0", direction: "in", type: "bit" }],
      params: [],
    };

    const sheet = project.sheets[project.rootSheetId];
    sheet.labels.push({
      id: "label_existing",
      name: "sig_existing",
      scope: "local",
      position: { x: 40, y: 60 },
    });

    const initialLookup = getSheetLookup(project, sheet);
    expect(initialLookup.labelsById.has("label_existing")).toBe(true);

    sheet.nodes.push({
      id: "node_component",
      kind: "component",
      componentId: TEST_COMPONENT_ID,
      instanceName: "and2.0",
      position: { x: 120, y: 80 },
      paramValues: {},
    });
    sheet.labels.push({
      id: "label_restored",
      name: "sig_restored",
      scope: "local",
      position: { x: 180, y: 60 },
    });

    const staleLookup = getSheetLookup(project, sheet);
    expect(staleLookup.nodesById.has("node_component")).toBe(false);
    expect(staleLookup.labelsById.has("label_restored")).toBe(false);

    clearSheetLookupCache();

    const refreshedLookup = getSheetLookup(project, sheet);
    expect(refreshedLookup.nodesById.has("node_component")).toBe(true);
    expect(refreshedLookup.labelsById.has("label_restored")).toBe(true);
    expect(
      refreshedLookup.nodePinSidesById.get("node_component")?.get("in0"),
    ).toBe("left");
  });
});
