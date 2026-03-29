import {
  isComponentPlaceable,
  isComponentSearchable,
} from "@nohal/core/componentVisibility";
import {
  HiOutlineArchiveBoxArrowDown,
  HiOutlineArrowsRightLeft,
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
  HiOutlineChevronDown,
  HiOutlineCube,
  HiOutlineDocumentDuplicate,
  HiOutlineDocumentText,
  HiOutlineFolderOpen,
  HiOutlineTag,
} from "solid-icons/hi";
import { createMemo, createSignal } from "solid-js";
import BrandLogo from "../components/BrandLogo";
import CanvasComponentMenu from "../components/CanvasComponentMenu";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Separator } from "../components/ui/separator";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { type CanvasPlacement, useEditorUi } from "../state/EditorUiProvider";

interface EditorTopbarProps {
  onGoToLanding: () => void;
}

export default function EditorTopbar(props: EditorTopbarProps) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const [componentMenuOpen, setComponentMenuOpen] = createSignal(false);
  const componentChoices = createMemo(() =>
    Object.values(state.project.library.components)
      .filter(
        (component) =>
          isComponentPlaceable(component) && isComponentSearchable(component),
      )
      .sort((a, b) => a.halComponentName.localeCompare(b.halComponentName)),
  );
  const activeComponentPlacement = createMemo(() => {
    const current = editorUi.placementMode();
    return current?.kind === "component" ? current : null;
  });
  const activeComponentLabel = createMemo(() => {
    const active = activeComponentPlacement();
    if (!active) return t("topbar.addComponent");
    return (
      state.project.library.components[active.componentId]?.halComponentName ??
      t("topbar.addComponent")
    );
  });
  const toggleComponentPlacement = (componentId: string) => {
    editorUi.togglePlacementMode({ kind: "component", componentId });
  };
  const placementModeMatches = (candidate: CanvasPlacement) => {
    const current = editorUi.placementMode();
    if (!current || current.kind !== candidate.kind) return false;
    if (current.kind === "component" && candidate.kind === "component") {
      return current.componentId === candidate.componentId;
    }
    if (current.kind === "label" && candidate.kind === "label") {
      return current.scope === candidate.scope;
    }
    if (current.kind === "sheet-port" && candidate.kind === "sheet-port") {
      return (
        current.direction === candidate.direction &&
        current.type === candidate.type
      );
    }
    return true;
  };

  return (
    <header class="z-20 flex flex-wrap items-center gap-3 border-b border-white/8 bg-black/20 px-4 py-3 backdrop-blur">
      <button
        type="button"
        class="focus-ring mr-2 inline-flex items-center gap-3 rounded-2xl px-1 py-1 text-left text-foreground transition-colors hover:bg-white/5"
        onClick={props.onGoToLanding}
        title={t("topbar.goToLanding")}
        aria-label={t("topbar.goToLanding")}
      >
        <BrandLogo
          class="size-10 shadow-lg shadow-black/20"
          alt=""
          aria-hidden="true"
        />
        <div>
          <div class="text-sm font-semibold tracking-[0.18em]">NoHAL</div>
          <div class="text-xs text-muted-foreground">
            {state.project.name || "Editor"}
          </div>
        </div>
      </button>

      <div class="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => void actions.openProject()}
          aria-label={t("topbar.openProject")}
          title={t("topbar.openProject")}
        >
          <HiOutlineFolderOpen size={16} aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => void actions.saveProject()}
          aria-label={t("topbar.saveProject")}
          title={t("topbar.saveProject")}
        >
          <HiOutlineArchiveBoxArrowDown size={16} aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => void actions.undo()}
          disabled={!state.canUndo}
          aria-label={t("topbar.undo")}
          title={`${t("topbar.undo")} (Ctrl/Cmd+Z)`}
        >
          <HiOutlineArrowUturnLeft size={16} aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => void actions.redo()}
          disabled={!state.canRedo}
          aria-label={t("topbar.redo")}
          title={`${t("topbar.redo")} (Ctrl/Cmd+Y)`}
        >
          <HiOutlineArrowUturnRight size={16} aria-hidden="true" />
        </Button>
        <Separator orientation="vertical" class="mx-1 hidden h-8 md:block" />
        <Button onClick={() => void actions.buildProject()}>
          {t("topbar.build")}
        </Button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={editorUi.openProjectSettings}>
          {t("topbar.projectSettings")}
        </Button>
        <Button
          variant="outline"
          onClick={() => editorUi.openGeneralSettings()}
        >
          {t("topbar.generalSettings")}
        </Button>
      </div>

      <div class="flex flex-1 flex-wrap items-center justify-end gap-2">
        <DropdownMenu
          open={componentMenuOpen()}
          onOpenChange={setComponentMenuOpen}
        >
          <DropdownMenuTrigger
            as={Button<"button">}
            variant="secondary"
            class={`gap-2 ${
              activeComponentPlacement()
                ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                : ""
            }`}
            title={activeComponentLabel()}
          >
            <HiOutlineCube size={16} aria-hidden="true" />
            <span class="max-w-52 truncate">{activeComponentLabel()}</span>
            <HiOutlineChevronDown size={16} aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-[360px] max-h-[26rem] overflow-hidden p-3">
            <CanvasComponentMenu
              components={componentChoices()}
              onAddComponent={(componentId) => {
                toggleComponentPlacement(componentId);
                setComponentMenuOpen(false);
              }}
              onClose={() => setComponentMenuOpen(false)}
              listClass="max-h-[18rem] overflow-y-auto"
            />
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="secondary"
          onClick={() => editorUi.togglePlacementMode({ kind: "subsheet" })}
          class={`gap-2 ${
            placementModeMatches({ kind: "subsheet" })
              ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
              : ""
          }`}
        >
          <HiOutlineDocumentDuplicate size={16} aria-hidden="true" />
          {t("topbar.addSubsheet")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => editorUi.togglePlacementMode({ kind: "comment" })}
          class={`gap-2 ${
            placementModeMatches({ kind: "comment" })
              ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
              : ""
          }`}
        >
          <HiOutlineDocumentText size={16} aria-hidden="true" />
          {t("topbar.addText")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            as={Button<"button">}
            variant="secondary"
            class={`gap-2 ${
              editorUi.placementMode()?.kind === "sheet-port"
                ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                : ""
            }`}
          >
            <HiOutlineArrowsRightLeft size={16} aria-hidden="true" />
            {t("topbar.addPort")}
            <HiOutlineChevronDown size={16} aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() =>
                editorUi.beginPlacementMode({
                  kind: "sheet-port",
                  direction: "in",
                  type: "bit",
                })
              }
            >
              <span class="inline-flex items-center gap-2">
                <HiOutlineArrowsRightLeft size={16} aria-hidden="true" />
                {t("topbar.inPortBit")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                editorUi.beginPlacementMode({
                  kind: "sheet-port",
                  direction: "out",
                  type: "bit",
                })
              }
            >
              <span class="inline-flex items-center gap-2">
                <HiOutlineArrowsRightLeft size={16} aria-hidden="true" />
                {t("topbar.outPortBit")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                editorUi.beginPlacementMode({
                  kind: "sheet-port",
                  direction: "io",
                  type: "float",
                })
              }
            >
              <span class="inline-flex items-center gap-2">
                <HiOutlineArrowsRightLeft size={16} aria-hidden="true" />
                {t("topbar.ioPortFloat")}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            as={Button<"button">}
            variant="secondary"
            class={`gap-2 ${
              editorUi.placementMode()?.kind === "label"
                ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                : ""
            }`}
          >
            <HiOutlineTag size={16} aria-hidden="true" />
            {t("topbar.addLabel")}
            <HiOutlineChevronDown size={16} aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() =>
                editorUi.beginPlacementMode({ kind: "label", scope: "local" })
              }
            >
              <span class="inline-flex items-center gap-2">
                <HiOutlineTag size={16} aria-hidden="true" />
                {t("topbar.localLabel")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                editorUi.beginPlacementMode({ kind: "label", scope: "global" })
              }
            >
              <span class="inline-flex items-center gap-2">
                <HiOutlineTag size={16} aria-hidden="true" />
                {t("topbar.globalLabel")}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
