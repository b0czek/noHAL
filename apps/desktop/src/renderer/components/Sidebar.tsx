import {
  getReferencedSheetLocations,
  getSheetReferenceLocations,
  isSheetPlacedInProject,
} from "@nohal/core/graph";
import { isProtectedSystemSheet } from "@nohal/core/sheet";
import {
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineCpuChip,
  HiOutlineHome,
} from "solid-icons/hi";
import { createMemo, createSignal, For, Show } from "solid-js";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";
import { useContextMenu } from "./ContextMenuProvider";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type SidebarTab = "sheets" | "references";

export default function Sidebar() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const contextMenu = useContextMenu();
  const [tab, setTab] = createSignal<SidebarTab>("sheets");
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  const sheetRows = createMemo(() =>
    Object.values(state.project.sheets)
      .map((sheet) => {
        const referenceCount = getSheetReferenceLocations(
          state.project,
          sheet.id,
        ).length;
        return {
          sheet,
          referenceCount,
          isUnused:
            sheet.id !== state.project.rootSheetId &&
            !isSheetPlacedInProject(state.project, sheet.id),
        };
      })
      .sort((left, right) => left.sheet.name.localeCompare(right.sheet.name)),
  );
  const incomingReferences = createMemo(() =>
    getSheetReferenceLocations(state.project, state.activeSheetId),
  );
  const outgoingReferences = createMemo(() =>
    getReferencedSheetLocations(state.project, state.activeSheetId),
  );

  const openSheetContextMenu = (
    sheetId: string,
    clientX: number,
    clientY: number,
  ) => {
    const sheet = state.project.sheets[sheetId];
    if (!sheet) return;
    const items = [
      {
        label: t("sidebar.sheetSettings"),
        onSelect: () => {
          editorUi.openSheetSettings(sheetId);
        },
      },
    ];
    if (sheet.id !== state.project.rootSheetId) {
      items.push({
        label: t("sidebar.deleteSheet"),
        onSelect: () => actions.deleteSheetDefinition(sheetId),
      });
    }
    contextMenu.openActions({
      x: clientX,
      y: clientY,
      width: 220,
      maxHeight: 240,
      ariaLabel: t("sidebar.sheetActions"),
      title: sheet.name,
      items,
    });
  };

  const openReferenceLocation = (parentSheetId: string, nodeId: string) => {
    actions.setActiveSheet(parentSheetId);
    editorUi.requestCanvasFocus(parentSheetId, { kind: "node", id: nodeId });
  };

  return (
    <aside class="pointer-events-none absolute left-3 top-3 z-10 w-[min(22rem,calc(100%-24rem))] min-w-[16rem]">
      <Card class="pointer-events-auto flex max-h-[min(42rem,calc(100vh-8rem))] flex-col overflow-hidden !border-white/12 ![background:linear-gradient(180deg,rgba(11,24,31,0.42),rgba(8,17,22,0.28))] backdrop-blur-2xl">
        <CardHeader
          class={`flex-row items-center justify-between gap-3 ${
            isCollapsed() ? "px-3 py-3" : "px-4 pb-2 pt-4"
          }`}
        >
          <CardTitle>{t("sidebar.title")}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="size-7 rounded-lg"
            aria-label={
              isCollapsed()
                ? t("sidebar.expandSheet", { name: t("sidebar.title") })
                : t("sidebar.collapseSheet", { name: t("sidebar.title") })
            }
            aria-expanded={!isCollapsed()}
            onClick={() => setIsCollapsed((value) => !value)}
          >
            {isCollapsed() ? (
              <HiOutlineChevronRight size={16} aria-hidden="true" />
            ) : (
              <HiOutlineChevronDown size={16} aria-hidden="true" />
            )}
          </Button>
        </CardHeader>
        <Show when={!isCollapsed()}>
          <CardContent class="min-h-0 flex-1 overflow-auto pt-0">
            <Tabs
              value={tab()}
              onChange={(value) => setTab(value as SidebarTab)}
            >
              <TabsList class="grid w-full grid-cols-2 bg-white/5">
                <TabsTrigger value="sheets">{t("sidebar.sheets")}</TabsTrigger>
                <TabsTrigger value="references">
                  {t("sidebar.references")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sheets" class="grid gap-2">
                <ul class="grid gap-1">
                  <For each={sheetRows()}>
                    {({ sheet, isUnused, referenceCount }) => (
                      <li class="min-w-0">
                        <button
                          type="button"
                          class={`focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/5 ${
                            sheet.id === state.activeSheetId
                              ? "bg-accent/12 text-foreground"
                              : "text-muted-foreground"
                          }`}
                          onClick={() => actions.setActiveSheet(sheet.id)}
                          onContextMenu={(evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                            openSheetContextMenu(
                              sheet.id,
                              evt.clientX,
                              evt.clientY,
                            );
                          }}
                          title={sheet.name}
                        >
                          <Show when={sheet.id === state.project.rootSheetId}>
                            <span
                              class="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                              title={t("sidebar.root")}
                            >
                              <HiOutlineHome size={15} aria-hidden="true" />
                            </span>
                          </Show>
                          <Show
                            when={
                              sheet.role === "system" &&
                              isProtectedSystemSheet(state.project, sheet.id)
                            }
                          >
                            <span
                              class="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/10 text-sky-200"
                              title={t("sidebar.system")}
                            >
                              <HiOutlineCpuChip size={15} aria-hidden="true" />
                            </span>
                          </Show>
                          <span class="min-w-0 flex-1 truncate">
                            {sheet.name}
                          </span>
                          <Badge variant="secondary">{referenceCount}</Badge>
                          <Show when={isUnused}>
                            <Badge variant="secondary">
                              {t("sidebar.unused")}
                            </Badge>
                          </Show>
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
              </TabsContent>

              <TabsContent value="references" class="grid gap-4">
                <section class="grid gap-2">
                  <div class="flex items-center justify-between gap-2">
                    <div class="text-sm font-medium text-foreground">
                      {t("sidebar.usedBy")}
                    </div>
                    <Badge variant="secondary">
                      {incomingReferences().length}
                    </Badge>
                  </div>
                  <Show
                    when={incomingReferences().length > 0}
                    fallback={
                      <div class="rounded-xl bg-white/5 px-3 py-2 text-sm text-muted-foreground">
                        {state.activeSheetId === state.project.rootSheetId
                          ? t("sidebar.rootDefinition")
                          : t("sidebar.unusedDefinition")}
                      </div>
                    }
                  >
                    <ul class="grid gap-1">
                      <For each={incomingReferences()}>
                        {(reference) => (
                          <li>
                            <button
                              type="button"
                              class="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                              onClick={() =>
                                openReferenceLocation(
                                  reference.parentSheetId,
                                  reference.nodeId,
                                )
                              }
                            >
                              <span class="min-w-0 flex-1 truncate">
                                {reference.parentSheetName}
                              </span>
                              <span class="mono text-xs text-muted-foreground">
                                {reference.instanceName}
                              </span>
                            </button>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </section>

                <section class="grid gap-2">
                  <div class="flex items-center justify-between gap-2">
                    <div class="text-sm font-medium text-foreground">
                      {t("sidebar.referencesFrom")}
                    </div>
                    <Badge variant="secondary">
                      {outgoingReferences().length}
                    </Badge>
                  </div>
                  <Show
                    when={outgoingReferences().length > 0}
                    fallback={
                      <div class="rounded-xl bg-white/5 px-3 py-2 text-sm text-muted-foreground">
                        {t("sidebar.noReferences")}
                      </div>
                    }
                  >
                    <ul class="grid gap-1">
                      <For each={outgoingReferences()}>
                        {(reference) => (
                          <li>
                            <button
                              type="button"
                              class="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                              onClick={() =>
                                actions.setActiveSheet(reference.sheetId)
                              }
                            >
                              <span class="min-w-0 flex-1 truncate">
                                {reference.sheetName}
                              </span>
                              <span class="mono text-xs text-muted-foreground">
                                {reference.instanceName}
                              </span>
                            </button>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </section>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Show>
      </Card>
    </aside>
  );
}
