import {
  HiOutlineArchiveBoxArrowDown,
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
  HiOutlineChevronDown,
  HiOutlineFolderOpen,
} from "solid-icons/hi";
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
import { useEditorUi } from "../state/EditorUiProvider";

interface EditorTopbarProps {
  onGoToLanding: () => void;
}

export default function EditorTopbar(props: EditorTopbarProps) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();

  return (
    <header class="z-20 flex flex-wrap items-center gap-3 border-b border-white/8 bg-black/20 px-4 py-3 backdrop-blur">
      <button
        type="button"
        class="focus-ring mr-2 inline-flex items-center gap-3 rounded-2xl px-1 py-1 text-left text-foreground transition-colors hover:bg-white/5"
        onClick={props.onGoToLanding}
        title={t("topbar.goToLanding")}
        aria-label={t("topbar.goToLanding")}
      >
        <div class="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] text-base font-semibold text-primary-foreground shadow-lg shadow-black/20">
          N
        </div>
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
        <Button
          variant="secondary"
          onClick={() => actions.addSheetDefinition()}
        >
          {t("topbar.addSubsheet")}
        </Button>
        <Button variant="secondary" onClick={actions.addComment}>
          {t("topbar.addText")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            as={Button<"button">}
            variant="secondary"
            class="gap-1"
          >
            {t("topbar.addPort")}
            <HiOutlineChevronDown size={16} aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() => actions.addSheetPort("in", "bit")}
            >
              {t("topbar.inPortBit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => actions.addSheetPort("out", "bit")}
            >
              {t("topbar.outPortBit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => actions.addSheetPort("io", "float")}
            >
              {t("topbar.ioPortFloat")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            as={Button<"button">}
            variant="secondary"
            class="gap-1"
          >
            {t("topbar.addLabel")}
            <HiOutlineChevronDown size={16} aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => actions.addLabel("local")}>
              {t("topbar.localLabel")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.addLabel("global")}>
              {t("topbar.globalLabel")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
