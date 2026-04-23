import type { FailureMatcher } from "@nohal/core";
import { applyComponentDefinitionToProject } from "@nohal/core/customComponent";
import { getSheet } from "@nohal/core/graph";
import {
  itemModelEdits,
  nodeModelEdits,
  type sheetModelEdits,
} from "@nohal/core/sheet";
import type {
  HalValueType,
  LabelScope,
  PinDirection,
  XY,
} from "@nohal/core/types";
import { toErrorMessage } from "../helpers";
import {
  type ActionStatusUpdate,
  createFailureReporter,
  type ExtractActionFailuresDeep,
} from "./actionFailureTypes";
import type { EditorSelection, EditorStoreActionContext } from "./types";

const ROTATION_STEP_DEGREES = 90;

function getRotatableSelectionIds(selection: EditorSelection): {
  labelIds: Set<string>;
  commentIds: Set<string>;
  portIds: Set<string>;
} {
  if (!selection) {
    return {
      labelIds: new Set<string>(),
      commentIds: new Set<string>(),
      portIds: new Set<string>(),
    };
  }

  if (selection.kind === "multi") {
    return {
      labelIds: new Set(selection.labelIds),
      commentIds: new Set(selection.commentIds),
      portIds: new Set(selection.portIds),
    };
  }

  return {
    labelIds: new Set(selection.kind === "label" ? [selection.id] : []),
    commentIds: new Set(selection.kind === "comment" ? [selection.id] : []),
    portIds: new Set(selection.kind === "sheet-port" ? [selection.id] : []),
  };
}

export function createNodeActions(deps: EditorStoreActionContext) {
  type NodeActionFailure = ExtractActionFailuresDeep<
    typeof nodeModelEdits | typeof itemModelEdits | typeof sheetModelEdits
  >;

  const nodeActionFailureMatcher: FailureMatcher<
    NodeActionFailure,
    ActionStatusUpdate
  > = {
    "not-found": {
      sheet: {
        _: "store.status.componentNodeEditTargetMissing",
      },
      node: {
        _: "store.status.componentNodeEditTargetMissing",
      },
      component: {
        _: "store.status.componentNodeEditTargetMissing",
      },
      "instance-config": {
        _: "store.status.componentNodeEditTargetMissing",
      },
      label: {
        _: "store.status.componentNodeEditTargetMissing",
      },
      comment: {
        _: "store.status.commentEditTargetMissing",
      },
      "sheet-port": {
        _: "store.status.componentNodeEditTargetMissing",
      },
    },
    "invalid-input": {
      "instance-name": {
        "empty-name": "store.status.instanceNameRequired",
        "invalid-name": (failure) => [
          "store.status.invalidHalInstanceName",
          { name: failure.meta.name },
        ],
      },
      label: {
        "invalid-name": "store.status.invalidHalSignalName",
      },
      "sheet-port": {
        "invalid-name": (failure) => [
          "store.status.invalidHalPortName",
          { name: failure.meta.name },
        ],
      },
    },
    forbidden: {
      component: {
        "placement-disabled": (failure) => [
          "store.status.componentPlacementDisabled",
          { componentName: failure.meta.componentName },
        ],
      },
      "instance-name": {
        locked: "componentDialog.instanceNameLocked",
      },
      pin: {
        "connected-pin": "store.status.cannotHideConnectedPin",
      },
      "export-namespace": {
        locked: (failure) => [
          "store.status.exportNamespaceFixedForComponent",
          { componentName: failure.meta.componentName },
        ],
      },
    },
    conflict: {
      "instance-name": {
        "instance-name-exhausted": (failure) => [
          "store.status.instanceNameExhaustedForComponent",
          { componentName: failure.meta.componentName },
        ],
        "duplicate-name": (failure) => [
          "store.status.duplicateInstanceName",
          { name: failure.meta.name },
        ],
      },
      "exported-path": {
        "duplicate-exported-path": (failure) => {
          if ("instancePath" in failure.meta) {
            return [
              "store.status.exportNamespaceChangeWouldCollide",
              { instancePath: failure.meta.instancePath },
            ];
          }
          return [
            "store.status.instanceNameCollidesInExportedNamespace",
            { name: failure.meta.name },
          ];
        },
      },
      "sheet-port": {
        "duplicate-name": (failure) => [
          "store.status.duplicateSheetPortName",
          { name: failure.meta.name },
        ],
      },
    },
  };
  const reportNodeActionFailure = createFailureReporter(
    deps,
    nodeActionFailureMatcher,
  );

  return {
    async refreshComponentInStore(componentId: string): Promise<void> {
      const current = deps.state.project.library.components[componentId];
      if (!current || current.source !== "comp") {
        deps.setStatusT("store.status.selectedComponentNotStoredComp");
        return;
      }

      try {
        const entry = await window.nohal.refreshComponentInStore(componentId);
        deps.clearHistory();
        deps.withComponentStore((componentStore) => {
          componentStore.components[entry.componentId] = entry;
        });
        deps.withProject(
          (project) => {
            applyComponentDefinitionToProject(
              project,
              entry.componentId,
              entry.parsed,
            );
          },
          { recordHistory: false },
        );
        deps.setStatusT("store.status.refreshedComponent", {
          componentName: entry.parsed.halComponentName,
        });
      } catch (error) {
        deps.setStatusT("store.status.refreshFailed", {
          error: toErrorMessage(error),
        });
      }
    },

    addComponentNode(componentId: string, position?: XY): void {
      const componentName =
        deps.state.project.library.components[componentId]?.halComponentName ??
        componentId;
      deps
        .withProjectResult((project) =>
          nodeModelEdits.component.add(
            project,
            deps.state.activeSheetId,
            componentId,
            position,
          ),
        )
        .match(() => {
          deps.setStatusT("store.status.placedComponent", {
            componentName,
          });
        }, reportNodeActionFailure);
    },

    addLabel(scope: LabelScope, position?: XY): void {
      deps.withProjectChange((project) =>
        itemModelEdits.label.add(
          getSheet(project, deps.state.activeSheetId),
          scope,
          position,
        ),
      );
      deps.setStatusT("store.status.addedLabel", { scope });
    },

    addComment(position?: XY): void {
      const { data } = deps.withProjectChange((project) =>
        itemModelEdits.comment.add(
          getSheet(project, deps.state.activeSheetId),
          position,
        ),
      );
      deps.setState("selection", { kind: "comment", id: data.id });
      deps.setStatusT("store.status.addedComment");
    },

    addSheetPort(
      direction: PinDirection,
      type: HalValueType,
      position?: XY,
    ): void {
      deps.withProjectChange((project) =>
        itemModelEdits.port.add(
          getSheet(project, deps.state.activeSheetId),
          direction,
          type,
          position,
        ),
      );
      deps.setStatusT("store.status.addedSheetPort");
    },

    moveNode(nodeId: string, x: number, y: number): void {
      deps.withProjectResult((project) =>
        itemModelEdits.node.move(
          getSheet(project, deps.state.activeSheetId),
          nodeId,
          x,
          y,
        ),
      );
    },

    moveLabel(labelId: string, x: number, y: number): void {
      deps.withProjectResult((project) =>
        itemModelEdits.label.move(
          getSheet(project, deps.state.activeSheetId),
          labelId,
          x,
          y,
        ),
      );
    },

    moveComment(commentId: string, x: number, y: number): void {
      deps.withProjectResult((project) =>
        itemModelEdits.comment.move(
          getSheet(project, deps.state.activeSheetId),
          commentId,
          x,
          y,
        ),
      );
    },

    moveSheetPort(portId: string, x: number, y: number): void {
      deps.withProjectResult((project) =>
        itemModelEdits.port.move(
          getSheet(project, deps.state.activeSheetId),
          portId,
          x,
          y,
        ),
      );
    },

    moveSelectionGroup(updates: {
      nodePositions: Array<{ id: string; x: number; y: number }>;
      labelPositions: Array<{ id: string; x: number; y: number }>;
      commentPositions: Array<{ id: string; x: number; y: number }>;
      portPositions: Array<{ id: string; x: number; y: number }>;
    }): void {
      if (
        updates.nodePositions.length === 0 &&
        updates.labelPositions.length === 0 &&
        updates.commentPositions.length === 0 &&
        updates.portPositions.length === 0
      ) {
        return;
      }

      deps.withProjectChange((project) =>
        itemModelEdits.selectionGroup.move(
          getSheet(project, deps.state.activeSheetId),
          updates,
        ),
      );
    },

    renameNode(nodeId: string, instanceName: string): void {
      deps
        .withProjectResult((project) =>
          nodeModelEdits.instanceName.update(
            project,
            deps.state.activeSheetId,
            nodeId,
            instanceName,
          ),
        )
        .orTee(reportNodeActionFailure);
    },

    renameSheetReference(
      parentSheetId: string,
      nodeId: string,
      instanceName: string,
    ): void {
      deps
        .withProjectResult((project) =>
          nodeModelEdits.instanceName.update(
            project,
            parentSheetId,
            nodeId,
            instanceName,
          ),
        )
        .orTee(reportNodeActionFailure);
    },

    renameSheetInstance(sheetId: string, instanceName: string): void {
      deps
        .withProjectResult((project) =>
          nodeModelEdits.instanceName.updateSheet(
            project,
            sheetId,
            instanceName,
          ),
        )
        .orTee(reportNodeActionFailure);
    },

    updateSheetNodeThreadMap(
      sheetId: string,
      nodeId: string,
      childThreadOutputId: string,
      parentThreadOutputId: string | null,
    ): void {
      deps
        .withProjectResult((project) =>
          nodeModelEdits.threadMap.update(
            project,
            sheetId,
            nodeId,
            childThreadOutputId,
            parentThreadOutputId,
          ),
        )
        .match(({ changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.updatedSubsheetThreadMapping");
        }, reportNodeActionFailure);
    },

    updateNodeParam(nodeId: string, paramKey: string, value: string): void {
      deps
        .withProjectResult((project) =>
          nodeModelEdits.param.update(
            project,
            deps.state.activeSheetId,
            nodeId,
            paramKey,
            value,
          ),
        )
        .orTee(reportNodeActionFailure);
    },

    updateNodeInstanceConfigValue(
      nodeId: string,
      configKey: string,
      value: string,
    ): void {
      deps
        .withProjectResult((project) =>
          nodeModelEdits.instanceConfig.update(
            project,
            deps.state.activeSheetId,
            nodeId,
            configKey,
            value,
          ),
        )
        .orTee(reportNodeActionFailure);
    },

    updateNodePinInitialValue(
      nodeId: string,
      pinKey: string,
      value: string,
    ): void {
      deps
        .withProjectResult((project) =>
          nodeModelEdits.pinInitialValue.update(
            project,
            deps.state.activeSheetId,
            nodeId,
            pinKey,
            value,
          ),
        )
        .orTee(reportNodeActionFailure);
    },

    updateNodePinVisibility(
      nodeId: string,
      pinKey: string,
      visible: boolean,
    ): void {
      deps
        .withProjectResult((project) =>
          nodeModelEdits.pinVisibility.update(
            project,
            deps.state.activeSheetId,
            nodeId,
            pinKey,
            visible,
          ),
        )
        .match(({ changed }) => {
          if (
            changed &&
            !visible &&
            deps.state.pendingEndpoint?.kind === "node-pin" &&
            deps.state.pendingEndpoint.nodeId === nodeId &&
            deps.state.pendingEndpoint.pinKey === pinKey
          ) {
            deps.clearPendingConnectionUi();
          }
        }, reportNodeActionFailure);
    },

    updateNodePinOrder(nodeId: string, pinOrder: readonly string[]): void {
      deps
        .withProjectResult((project) =>
          nodeModelEdits.pinOrder.update(
            project,
            deps.state.activeSheetId,
            nodeId,
            pinOrder,
          ),
        )
        .orTee(reportNodeActionFailure);
    },

    updateNodeExportStage(nodeId: string, stage: "main" | "postgui"): void {
      deps
        .withProjectResult((project) =>
          nodeModelEdits.exportStage.update(
            project,
            deps.state.activeSheetId,
            nodeId,
            stage,
          ),
        )
        .orTee(reportNodeActionFailure);
    },

    updateNodeGlobalNamespace(nodeId: string, global: boolean): void {
      deps
        .withProjectResult((project) =>
          nodeModelEdits.exportNamespace.update(
            project,
            deps.state.activeSheetId,
            nodeId,
            global,
          ),
        )
        .orTee(reportNodeActionFailure);
    },

    updateLabel(
      labelId: string,
      patch: { name?: string; scope?: LabelScope; rotation?: number },
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      deps
        .withProjectResult((project) =>
          itemModelEdits.label.update(
            getSheet(project, activeSheetId),
            labelId,
            patch,
          ),
        )
        .orTee(reportNodeActionFailure);
    },

    updateComment(
      commentId: string,
      patch: { text?: string; rotation?: number },
    ): void {
      deps
        .withProjectResult((project) =>
          itemModelEdits.comment.update(
            getSheet(project, deps.state.activeSheetId),
            commentId,
            patch,
          ),
        )
        .orTee(reportNodeActionFailure);
    },

    updateSheetPort(
      portId: string,
      patch: {
        name?: string;
        direction?: "in" | "out" | "io";
        type?: HalValueType;
        rotation?: number;
      },
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      deps
        .withProjectResult((project) =>
          itemModelEdits.port.update(
            getSheet(project, activeSheetId),
            portId,
            patch,
          ),
        )
        .orTee(reportNodeActionFailure);
    },

    rotateSelectionClockwise(
      stepDegrees: number = ROTATION_STEP_DEGREES,
    ): boolean {
      if (!Number.isFinite(stepDegrees) || stepDegrees === 0) return false;

      const { labelIds, commentIds, portIds } = getRotatableSelectionIds(
        deps.state.selection,
      );
      if (labelIds.size === 0 && commentIds.size === 0 && portIds.size === 0) {
        return false;
      }

      let rotated = false;
      rotated = deps.withProjectChange((project) =>
        itemModelEdits.selectionGroup.rotate(
          getSheet(project, deps.state.activeSheetId),
          { labelIds, commentIds, portIds },
          stepDegrees,
        ),
      ).changed;

      return rotated;
    },
  };
}
