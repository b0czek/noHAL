import {
  HiOutlineArchiveBoxArrowDown,
  HiOutlineDocumentPlus,
  HiOutlineFolderOpen,
} from "solid-icons/hi";
import {
  createEffect,
  createMemo,
  createSignal,
  onMount,
  Show,
} from "solid-js";
import { getSheet } from "../shared/graph";
import {
  buildProjectFromHalImport as buildImportedProject,
  suggestHalImportLinks,
} from "../shared/halImport";
import { createEmptyProject } from "../shared/project";
import type {
  HalImportDraft,
  HalImportPlacementHeuristic,
  RecentProjectEntry,
} from "../shared/types";
import Canvas from "./components/Canvas";
import ComponentNodeDialog from "./components/ComponentNodeDialog";
import ComponentStoreDialog from "./components/ComponentStoreDialog";
import Inspector from "./components/Inspector";
import LandingPage from "./components/LandingPage";
import NewProjectDialog from "./components/NewProjectDialog";
import SheetSettingsDialog from "./components/SheetSettingsDialog";
import Sidebar from "./components/Sidebar";
import { useEditorShortcuts } from "./shortcuts/useEditorShortcuts";
import { createEditorStore } from "./state/store";

export default function App() {
  const { state, actions } = createEditorStore(
    createEmptyProject("NoHAL Project"),
  );
  const [isEditorOpen, setIsEditorOpen] = createSignal(false);
  const [recentProjects, setRecentProjects] = createSignal<
    RecentProjectEntry[]
  >([]);
  const [isRecentProjectsLoading, setIsRecentProjectsLoading] =
    createSignal(true);
  const [isLandingActionPending, setIsLandingActionPending] =
    createSignal(false);
  const [landingError, setLandingError] = createSignal<string | null>(null);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] =
    createSignal(false);
  const [newProjectDialogStep, setNewProjectDialogStep] = createSignal<
    "choose" | "link"
  >("choose");
  const [isNewProjectDialogBusy, setIsNewProjectDialogBusy] =
    createSignal(false);
  const [newProjectDialogError, setNewProjectDialogError] = createSignal<
    string | null
  >(null);
  const [pendingHalImportDraft, setPendingHalImportDraft] =
    createSignal<HalImportDraft | null>(null);
  const [halImportLinkSelections, setHalImportLinkSelections] = createSignal<
    Record<string, string>
  >({});
  const [halImportLinkReasons, setHalImportLinkReasons] = createSignal<
    Record<string, string>
  >({});
  const [halImportPlacementHeuristic, setHalImportPlacementHeuristic] =
    createSignal<HalImportPlacementHeuristic>("related-groups");
  const [componentEditorNodeId, setComponentEditorNodeId] = createSignal<
    string | null
  >(null);
  const [isComponentStoreOpen, setIsComponentStoreOpen] = createSignal(false);
  const [sheetSettingsSheetId, setSheetSettingsSheetId] = createSignal<
    string | null
  >(null);

  const refreshRecentProjects = async () => {
    setIsRecentProjectsLoading(true);
    try {
      setRecentProjects(await window.nohal.getRecentProjects());
    } catch (error) {
      setLandingError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRecentProjectsLoading(false);
    }
  };

  const runLandingAction = async (action: () => Promise<boolean>) => {
    setLandingError(null);
    setIsLandingActionPending(true);
    try {
      const opened = await action();
      if (opened) {
        setIsEditorOpen(true);
        await refreshRecentProjects();
      } else if (state.status.startsWith("Failed")) {
        setLandingError(state.status);
      }
    } catch (error) {
      setLandingError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLandingActionPending(false);
    }
  };

  const openNewProjectDialog = () => {
    setNewProjectDialogError(null);
    setPendingHalImportDraft(null);
    setHalImportLinkSelections({});
    setHalImportLinkReasons({});
    setHalImportPlacementHeuristic("related-groups");
    setNewProjectDialogStep("choose");
    setIsNewProjectDialogOpen(true);
  };

  const closeNewProjectDialog = () => {
    if (isNewProjectDialogBusy()) return;
    setIsNewProjectDialogOpen(false);
    setNewProjectDialogError(null);
  };

  const createBlankProjectFromDialog = async () => {
    setIsNewProjectDialogOpen(false);
    if (!isEditorOpen()) {
      await runLandingAction(() => actions.newProject());
      return;
    }
    void actions.newProject();
  };

  const pickHalFileForNewProject = async () => {
    setNewProjectDialogError(null);
    setIsNewProjectDialogBusy(true);
    try {
      const draft = await window.nohal.importHalFile();
      if (!draft) return;
      const suggestions = suggestHalImportLinks(draft, state.componentStore);
      const nextSelections: Record<string, string> = {};
      const nextReasons: Record<string, string> = {};
      for (const suggestion of suggestions) {
        nextSelections[suggestion.groupId] =
          suggestion.selection.mode === "store"
            ? `store:${suggestion.selection.componentId}`
            : "local";
        nextReasons[suggestion.groupId] = suggestion.reason;
      }
      setPendingHalImportDraft(draft);
      setHalImportLinkSelections(nextSelections);
      setHalImportLinkReasons(nextReasons);
      setNewProjectDialogStep("link");
    } catch (error) {
      setNewProjectDialogError(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsNewProjectDialogBusy(false);
    }
  };

  const createImportedProjectFromDialog = async () => {
    const draft = pendingHalImportDraft();
    if (!draft) return;
    setNewProjectDialogError(null);
    setIsNewProjectDialogBusy(true);
    try {
      const linkSelections = Object.fromEntries(
        draft.componentGroups.map((group) => {
          const value = halImportLinkSelections()[group.id] ?? "local";
          if (value.startsWith("store:")) {
            return [
              group.id,
              {
                groupId: group.id,
                mode: "store" as const,
                componentId: value.slice("store:".length),
              },
            ];
          }
          return [
            group.id,
            { groupId: group.id, mode: "project-local" as const },
          ];
        }),
      );

      const result = buildImportedProject({
        draft,
        componentStore: state.componentStore,
        linkSelections,
        placementHeuristic: halImportPlacementHeuristic(),
      });
      const opened = actions.openPreparedProject(result.project, {
        status: `Imported HAL${draft.sourcePath ? `: ${draft.sourcePath}` : ""}`,
        warnings: result.warnings,
      });
      if (opened) {
        setIsNewProjectDialogOpen(false);
        setIsEditorOpen(true);
        await refreshRecentProjects();
      } else if (state.status.startsWith("Failed")) {
        setNewProjectDialogError(state.status);
      }
    } catch (error) {
      setNewProjectDialogError(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsNewProjectDialogBusy(false);
    }
  };

  onMount(() => {
    void actions.loadComponentStore();
    void refreshRecentProjects();
  });

  const currentSheet = createMemo(() =>
    getSheet(state.project, state.activeSheetId),
  );
  const selectedNode = createMemo(() => {
    const selection = state.selection;
    if (!selection || selection.kind !== "node") return undefined;
    return currentSheet().nodes.find((n) => n.id === selection.id);
  });
  const editingComponentNode = createMemo(() => {
    const id = componentEditorNodeId();
    if (!id) return null;
    const node = currentSheet().nodes.find((n) => n.id === id);
    return node && node.kind === "component" ? node : null;
  });
  const labelClick = (labelId: string) => {
    if (state.pendingEndpoint) {
      actions.anchorPendingToLabel(labelId);
    } else {
      actions.select({ kind: "label", id: labelId });
    }
  };

  const openComponentEditorForNode = (nodeId: string) => {
    const node = currentSheet().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (node.kind === "sheet") {
      actions.setActiveSheet(node.sheetId);
      return;
    }
    setComponentEditorNodeId(node.id);
  };

  const openSelectedComponentEditor = () => {
    const node = selectedNode();
    if (!node || node.kind !== "component") return;
    setComponentEditorNodeId(node.id);
  };

  const closeToolbarMenu = (el: HTMLElement) => {
    const host = el.closest("details");
    if (host instanceof HTMLDetailsElement) host.open = false;
  };

  createEffect(() => {
    state.activeSheetId;
    state.project;
    if (componentEditorNodeId() && !editingComponentNode()) {
      setComponentEditorNodeId(null);
    }
  });

  useEditorShortcuts({
    isComponentDialogOpen: () => componentEditorNodeId() !== null,
    closeComponentDialog: () => setComponentEditorNodeId(null),
    hasPendingWire: () => state.pendingEndpoint !== null,
    cancelPendingWire: actions.clearPendingEndpoint,
    hasSelection: () => state.selection !== null,
    deleteSelection: actions.removeSelection,
  });

  return (
    <>
      <NewProjectDialog
        open={isNewProjectDialogOpen()}
        step={newProjectDialogStep()}
        isBusy={isNewProjectDialogBusy()}
        componentStore={state.componentStore}
        importDraft={pendingHalImportDraft()}
        linkSelections={halImportLinkSelections()}
        linkReasons={halImportLinkReasons()}
        placementHeuristic={halImportPlacementHeuristic()}
        errorMessage={newProjectDialogError()}
        onClose={closeNewProjectDialog}
        onCreateBlank={() => void createBlankProjectFromDialog()}
        onPickHalFile={() => void pickHalFileForNewProject()}
        onBackToChoice={() => {
          if (isNewProjectDialogBusy()) return;
          setNewProjectDialogStep("choose");
          setNewProjectDialogError(null);
        }}
        onRepickHalFile={() => void pickHalFileForNewProject()}
        onChangeLinkSelection={(groupId, value) =>
          setHalImportLinkSelections((prev) => ({ ...prev, [groupId]: value }))
        }
        onChangePlacementHeuristic={(value) =>
          setHalImportPlacementHeuristic(value)
        }
        onCreateImportedProject={() => void createImportedProjectFromDialog()}
      />
      <Show
        when={isEditorOpen()}
        fallback={
          <LandingPage
            recentProjects={recentProjects()}
            isRecentProjectsLoading={isRecentProjectsLoading()}
            isActionPending={isLandingActionPending()}
            errorMessage={landingError()}
            onCreateProject={openNewProjectDialog}
            onOpenProject={() =>
              void runLandingAction(() => actions.openProject())
            }
            onRefreshRecentProjects={() => void refreshRecentProjects()}
            onOpenRecentProject={(filePath) =>
              void runLandingAction(() => actions.openProjectAt(filePath))
            }
          />
        }
      >
        <div class="app-shell">
          <header class="topbar">
            <div class="brand">
              <div class="brand-mark">N</div>
              <div>
                <div class="brand-name">NoHAL</div>
              </div>
            </div>

            <div class="toolbar-group">
              <button
                type="button"
                class="btn subtle icon-btn"
                onClick={openNewProjectDialog}
                aria-label="New project"
                title="New project"
              >
                <HiOutlineDocumentPlus size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                class="btn subtle icon-btn"
                onClick={() => void actions.openProject()}
                aria-label="Open project"
                title="Open project"
              >
                <HiOutlineFolderOpen size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                class="btn subtle icon-btn"
                onClick={() => void actions.saveProject()}
                aria-label="Save project"
                title="Save project"
              >
                <HiOutlineArchiveBoxArrowDown size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                class="btn accent"
                onClick={() => void actions.exportHal()}
              >
                Export HAL
              </button>
            </div>

            <div class="toolbar-group">
              <button
                type="button"
                class="btn"
                onClick={() => setIsComponentStoreOpen(true)}
              >
                Component Store
              </button>
            </div>

            <div class="toolbar-group">
              <button
                type="button"
                class="btn"
                onClick={() => actions.addSheetDefinition()}
              >
                + Subsheet
              </button>
              <details class="toolbar-menu">
                <summary class="btn toolbar-menu-summary">+ Port</summary>
                <div class="toolbar-menu-popover">
                  <button
                    type="button"
                    class="toolbar-menu-item"
                    onClick={(evt) => {
                      actions.addSheetPort("in", "bit");
                      closeToolbarMenu(evt.currentTarget);
                    }}
                  >
                    In Port (bit)
                  </button>
                  <button
                    type="button"
                    class="toolbar-menu-item"
                    onClick={(evt) => {
                      actions.addSheetPort("out", "bit");
                      closeToolbarMenu(evt.currentTarget);
                    }}
                  >
                    Out Port (bit)
                  </button>
                  <button
                    type="button"
                    class="toolbar-menu-item"
                    onClick={(evt) => {
                      actions.addSheetPort("io", "float");
                      closeToolbarMenu(evt.currentTarget);
                    }}
                  >
                    IO Port (float)
                  </button>
                </div>
              </details>
              <details class="toolbar-menu">
                <summary class="btn toolbar-menu-summary">+ Label</summary>
                <div class="toolbar-menu-popover">
                  <button
                    type="button"
                    class="toolbar-menu-item"
                    onClick={(evt) => {
                      actions.addLabel("local");
                      closeToolbarMenu(evt.currentTarget);
                    }}
                  >
                    Local Label
                  </button>
                  <button
                    type="button"
                    class="toolbar-menu-item"
                    onClick={(evt) => {
                      actions.addLabel("hierarchical");
                      closeToolbarMenu(evt.currentTarget);
                    }}
                  >
                    Hier Label
                  </button>
                  <button
                    type="button"
                    class="toolbar-menu-item"
                    onClick={(evt) => {
                      actions.addLabel("global");
                      closeToolbarMenu(evt.currentTarget);
                    }}
                  >
                    Global Label
                  </button>
                </div>
              </details>
            </div>
          </header>

          <main class="workspace">
            <Sidebar
              project={state.project}
              activeSheetId={state.activeSheetId}
              onPlaceSheet={(id) => actions.placeExistingSheetNode(id)}
              onGoToSheet={(id) => actions.setActiveSheet(id)}
              onGoToParentSheet={() => actions.goToParentSheet()}
              canGoToParentSheet={Boolean(currentSheet().parentSheetId)}
              onOpenSheetSettings={(id) => setSheetSettingsSheetId(id)}
            />

            <Canvas
              project={state.project}
              sheet={currentSheet()}
              activeSheetId={state.activeSheetId}
              selection={state.selection}
              pendingEndpoint={state.pendingEndpoint}
              pendingWirePoints={state.pendingWirePoints}
              onSelect={actions.select}
              onOpenNode={openComponentEditorForNode}
              onEndpointClick={actions.endpointClick}
              onCanvasBackgroundClick={actions.addPendingWirePoint}
              onLabelClick={labelClick}
              onMoveNode={actions.moveNode}
              onMoveLabel={actions.moveLabel}
              onMoveSheetPort={actions.moveSheetPort}
              onMoveConnectionWaypoints={
                actions.updateDirectConnectionWaypoints
              }
              onAddComponentAt={(id, x, y) =>
                actions.addComponentNode(id, { x, y })
              }
            />

            <Inspector
              state={state}
              currentSheet={currentSheet()}
              onOpenSelectedComponentEditor={openSelectedComponentEditor}
              onRenameNode={actions.renameNode}
              onUpdateNodeParam={actions.updateNodeParam}
              onUpdateLabel={actions.updateLabel}
              onUpdateSheetPort={actions.updateSheetPort}
              onRemoveSelection={actions.removeSelection}
              onRemoveConnection={actions.removeDirectConnection}
              onRemoveLabelAnchor={actions.removeLabelAnchor}
              onEnterSelectedSheet={actions.enterSelectedSheet}
              onRefreshComponentInStore={(componentId) =>
                void actions.refreshComponentInStore(componentId)
              }
            />
          </main>

          <ComponentNodeDialog
            open={editingComponentNode() !== null}
            project={state.project}
            node={editingComponentNode()}
            onRename={(name) => {
              const node = editingComponentNode();
              if (!node) return;
              actions.renameNode(node.id, name);
            }}
            onUpdateParam={(key, value) => {
              const node = editingComponentNode();
              if (!node) return;
              actions.updateNodeParam(node.id, key, value);
            }}
            onUpdatePinInitialValue={(key, value) => {
              const node = editingComponentNode();
              if (!node) return;
              actions.updateNodePinInitialValue(node.id, key, value);
            }}
            onClose={() => setComponentEditorNodeId(null)}
          />

          <ComponentStoreDialog
            open={isComponentStoreOpen()}
            componentStore={state.componentStore}
            onImportCompFile={() => void actions.importCompFile()}
            onAddCompDirSource={() => void actions.addComponentDirSource()}
            onRefreshComponentSource={(sourceId) =>
              void actions.refreshComponentSource(sourceId)
            }
            onDeleteComponentSource={(sourceId) =>
              void actions.deleteComponentSource(sourceId)
            }
            onRefreshStoredComponent={(componentId) =>
              void actions.refreshComponentInStore(componentId)
            }
            onClose={() => setIsComponentStoreOpen(false)}
          />

          <SheetSettingsDialog
            open={sheetSettingsSheetId() !== null}
            project={state.project}
            sheetId={sheetSettingsSheetId()}
            onSetSheetAddfQueue={actions.setSheetAddfQueue}
            onClose={() => setSheetSettingsSheetId(null)}
          />
        </div>
      </Show>
    </>
  );
}
