import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../project";
import { findSystemSheet } from "../sheet";
import type { ComponentNode } from "../types";
import {
  createHaluiSystemComponentDefinition,
  HALUI_INSTANCE_NAME,
  HALUI_SYSTEM_COMPONENT_ID,
} from ".";

function findHaluiNode(project: ReturnType<typeof createEmptyProject>) {
  const systemSheet = findSystemSheet(project);
  return systemSheet?.nodes.find(
    (node): node is ComponentNode =>
      node.kind === "component" && node.instanceName === HALUI_INSTANCE_NAME,
  );
}

describe("halui-managed system component", () => {
  it("creates a managed singleton halui node in fresh projects", () => {
    const project = createEmptyProject("halui defaults");
    const node = findHaluiNode(project);
    const component = project.library.components[HALUI_SYSTEM_COMPONENT_ID];

    expect(node).toBeDefined();
    expect(component).toEqual(createHaluiSystemComponentDefinition("2.10"));
    expect(node?.componentId).toBe(HALUI_SYSTEM_COMPONENT_ID);
  });
});
