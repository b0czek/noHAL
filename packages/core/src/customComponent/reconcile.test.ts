import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../project";
import { applyComponentDefinitionToProject } from "./reconcile";

describe("custom component reconciliation helpers", () => {
  it("applies a component definition to the project and reconciles placed nodes", () => {
    const project = createEmptyProject("Apply Component Definition");
    const root = project.sheets[project.rootSheetId];

    project.library.components["comp:test"] = {
      id: "comp:test",
      name: "Test Component",
      halComponentName: "test_comp",
      source: "comp",
      runtime: { kind: "rt" },
      pins: [
        {
          key: "legacy_pin",
          name: "legacy-pin",
          direction: "out",
          type: "bit",
        },
      ],
      params: [
        { key: "legacy_param", name: "legacy", direction: "rw", type: "bit" },
      ],
    };

    root.nodes.push({
      id: "node_component",
      kind: "component",
      componentId: "comp:test",
      instanceName: "test_comp.0",
      position: { x: 40, y: 60 },
      paramValues: {
        legacy_param: "1",
      },
      pinInitialValues: {
        legacy_pin: "1",
      },
      hiddenPinKeys: ["legacy_pin"],
      pinOrder: ["legacy_pin"],
    });

    const definition = {
      id: "comp:test",
      name: "Test Component",
      halComponentName: "test_comp",
      source: "comp" as const,
      sourcePath: "/tmp/test.comp",
      parseMeta: {
        parser: "nohal-comp-v1" as const,
        warnings: [],
      },
      runtime: { kind: "rt" as const },
      pins: [
        {
          key: "next_pin",
          name: "next-pin",
          direction: "out" as const,
          type: "bit" as const,
        },
      ],
      params: [
        {
          key: "next_param",
          name: "next",
          direction: "rw" as const,
          type: "bit" as const,
          defaultValue: "0",
        },
      ],
    };

    applyComponentDefinitionToProject(project, definition.id, definition);

    expect(project.library.components[definition.id]).toEqual(definition);
    const node = root.nodes.find(
      (
        candidate,
      ): candidate is (typeof root.nodes)[number] & {
        kind: "component";
      } => candidate.id === "node_component" && candidate.kind === "component",
    );
    expect(node).toEqual(
      expect.objectContaining({
        kind: "component",
        paramValues: {
          next_param: "0",
        },
      }),
    );
    expect(node?.pinInitialValues).toBeUndefined();
    expect(node?.hiddenPinKeys).toBeUndefined();
    expect(node?.pinOrder).toBeUndefined();
  });
});
