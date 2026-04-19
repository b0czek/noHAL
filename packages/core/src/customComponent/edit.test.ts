import { describe, expect, it } from "vitest";
import { createId } from "../id";
import { createEmptyProject } from "../project";
import type { ComponentDefinition, ComponentNode } from "../types";
import { customComponentDefinitionEdits, customComponentEdits } from "./edit";

describe("custom component edits", () => {
  it("removes custom component pins and prunes node pin values", () => {
    const project = createEmptyProject("Custom Component Edit");
    const root = project.sheets[project.rootSheetId];
    const componentId = "manual:test";

    project.library.components[componentId] = {
      id: componentId,
      name: "test",
      halComponentName: "test",
      source: "manual",
      runtime: { kind: "unknown" },
      pins: [{ key: "pin", name: "pin", direction: "in", type: "bit" }],
      params: [],
    };

    const node: ComponentNode = {
      id: createId("node"),
      kind: "component",
      componentId,
      instanceName: "test_0",
      position: { x: 100, y: 100 },
      paramValues: {},
      pinInitialValues: {
        pin: "1",
      },
      pinOrder: ["pin"],
    };
    root.nodes.push(node);

    const removed = customComponentEdits.pin.remove(
      project,
      componentId,
      "pin",
    );

    expect(removed.isOk()).toBe(true);
    if (removed.isErr()) throw new Error("expected ok result");
    expect(removed.value.data.pinName).toBe("pin");
    expect(project.library.components[componentId]?.pins).toEqual([]);
    const updatedNode = root.nodes.find(
      (candidate) =>
        candidate.kind === "component" && candidate.componentId === componentId,
    );
    expect(updatedNode?.kind).toBe("component");
    if (updatedNode?.kind === "component") {
      expect(updatedNode.pinInitialValues).toBeUndefined();
      expect(updatedNode.pinOrder).toBeUndefined();
    }

    const added = customComponentEdits.pin.add(project, componentId);
    expect(added.isOk()).toBe(true);
    if (added.isErr()) throw new Error("expected ok result");
    expect(added.value.data.pin.name).toBe("pin");
    expect(added.value.data.pin.key).toBe("pin");
  });

  it("edits standalone component definitions for import flows", () => {
    const UPDATED_MAX_INSTANCES = 4;
    const component: ComponentDefinition = {
      id: "manual:test",
      name: "test",
      halComponentName: "test",
      source: "manual",
      runtime: { kind: "unknown" },
      pins: [{ key: "pin", name: "pin", direction: "in", type: "bit" }],
      params: [{ key: "param", name: "param", direction: "rw", type: "float" }],
    };

    customComponentDefinitionEdits.halComponentName.update(
      component,
      " imported_comp ",
    );
    customComponentDefinitionEdits.runtimeKind.update(component, "rt");
    customComponentDefinitionEdits.maxInstances.update(
      component,
      UPDATED_MAX_INSTANCES,
    );
    customComponentDefinitionEdits.loadCommand.update(
      component,
      "loadrt imported_comp count=%{count}",
    );
    const addedPin = customComponentDefinitionEdits.pin.add(component);
    const addedParam = customComponentDefinitionEdits.param.add(component);

    expect(component.halComponentName).toBe("imported_comp");
    expect(component.name).toBe("imported_comp");
    expect(component.runtime).toMatchObject({
      kind: "rt",
      instanceNaming: {
        strategy: "free",
        maxInstances: UPDATED_MAX_INSTANCES,
      },
    });
    expect(component.loadCommand).toBe("loadrt imported_comp count=%{count}");
    expect(addedPin.name).toBe("pin_2");
    expect(addedPin.key).toBe("pin_2");
    expect(addedParam.name).toBe("param_2");
    expect(addedParam.key).toBe("param_2");
  });

  it("edits realtime functions on custom components", () => {
    const project = createEmptyProject("Custom Component Functions");
    const componentId = "manual:test";

    project.library.components[componentId] = {
      id: componentId,
      name: "test",
      halComponentName: "test",
      source: "manual",
      runtime: { kind: "rt" },
      pins: [],
      params: [],
    };

    const added = customComponentEdits.function.add(project, componentId);
    expect(added.isOk()).toBe(true);
    if (added.isErr()) throw new Error("expected ok result");
    expect(added.value.data.fn.declaredName).toBe("function");
    expect(added.value.data.fn.halSuffix).toBe("function");
    expect(added.value.data.fn.floatMode).toBe("fp");

    const updatedName = customComponentEdits.function.name.update(
      project,
      componentId,
      added.value.data.fn.key,
      "servo",
    );
    expect(updatedName.isOk()).toBe(true);
    if (updatedName.isErr()) throw new Error("expected ok result");
    expect(updatedName.value.data.functionName).toBe("servo");
    expect(project.library.components[componentId]?.functions).toMatchObject([
      {
        declaredName: "servo",
        halSuffix: "servo",
        floatMode: "fp",
      },
    ]);

    const updatedFloatMode = customComponentEdits.function.floatMode.update(
      project,
      componentId,
      project.library.components[componentId]?.functions?.[0]?.key ?? "",
      "nofp",
    );
    expect(updatedFloatMode.isOk()).toBe(true);
    if (updatedFloatMode.isErr()) throw new Error("expected ok result");
    expect(updatedFloatMode.value.data.functionName).toBe("servo");
    expect(
      project.library.components[componentId]?.functions?.[0]?.floatMode,
    ).toBe("nofp");

    const removed = customComponentEdits.function.remove(
      project,
      componentId,
      project.library.components[componentId]?.functions?.[0]?.key ?? "",
    );
    expect(removed.isOk()).toBe(true);
    if (removed.isErr()) throw new Error("expected ok result");
    expect(removed.value.data.functionName).toBe("servo");
    expect(project.library.components[componentId]?.functions).toBeUndefined();
  });

  it("does not add custom realtime functions unless the runtime is rt", () => {
    const project = createEmptyProject("Custom Component Invalid Runtime");
    const component: ComponentDefinition = {
      id: "manual:test",
      name: "test",
      halComponentName: "test",
      source: "manual",
      runtime: { kind: "userspace" },
      pins: [],
      params: [],
    };
    project.library.components[component.id] = component;

    const result = customComponentEdits.function.add(project, component.id);
    expect(customComponentDefinitionEdits.function.add(component)).toBeNull();
    expect(result.isErr()).toBe(true);
    if (result.isOk()) throw new Error("expected err result");
    expect(result.error).toEqual({
      code: "unsupported",
      detail: "invalid-runtime",
    });
    expect(component.functions).toBeUndefined();
  });
});
