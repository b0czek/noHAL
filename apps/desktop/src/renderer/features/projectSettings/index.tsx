import { createSignal } from "solid-js";
import type { OverlayDialogProps } from "../../app/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import CustomComponentsTab from "./CustomComponentsTab";
import IniTab from "./IniTab";
import MotmodTab from "./MotmodTab";
import ThreadsTab from "./ThreadsTab";

type ProjectSettingsTab = "motmod" | "threads" | "custom-components" | "ini";

type ProjectSettingsDialogProps = OverlayDialogProps;

export default function ProjectSettingsDialog(
  props: ProjectSettingsDialogProps,
) {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const [tab, setTab] = createSignal<ProjectSettingsTab>("motmod");

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) props.onClose();
      }}
    >
      <DialogContent
        class="grid h-[min(760px,calc(100vh-36px))] w-[min(1040px,calc(100vw-36px))] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-[1.75rem] border-white/10 bg-[linear-gradient(180deg,rgba(11,24,31,0.96),rgba(8,17,22,0.92))] p-5 shadow-2xl shadow-black/30"
        onContextMenu={(evt: MouseEvent) => evt.preventDefault()}
      >
        <DialogHeader class="flex-row items-start justify-between gap-4 space-y-0 text-left">
          <div>
            <DialogTitle>{t("projectSettings.title")}</DialogTitle>
            <DialogDescription>{state.project.name}</DialogDescription>
          </div>
        </DialogHeader>

        <div class="min-h-0">
          <Tabs
            value={tab()}
            onChange={(value) => setTab(value as ProjectSettingsTab)}
            class="grid h-full min-h-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]"
          >
            <aside class="min-h-0 rounded-2xl bg-white/[0.04] p-2 shadow-inner shadow-black/20">
              <TabsList class="grid h-auto w-full grid-cols-1 gap-1 bg-transparent p-0">
                <TabsTrigger
                  value="motmod"
                  class="justify-start rounded-xl px-3 py-2 text-left"
                >
                  {t("projectSettings.tabMotmod")}
                </TabsTrigger>
                <TabsTrigger
                  value="threads"
                  class="justify-start rounded-xl px-3 py-2 text-left"
                >
                  {t("projectSettings.tabThreads")}
                </TabsTrigger>
                <TabsTrigger
                  value="custom-components"
                  class="justify-start rounded-xl px-3 py-2 text-left"
                >
                  {t("projectSettings.tabCustomComponents")}
                </TabsTrigger>
                <TabsTrigger
                  value="ini"
                  class="justify-start rounded-xl px-3 py-2 text-left"
                >
                  {t("projectSettings.tabIniEditor")}
                </TabsTrigger>
              </TabsList>
            </aside>

            <section class="min-h-0 overflow-hidden rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
              <TabsContent value="motmod" class="mt-0 h-full overflow-auto">
                <MotmodTab />
              </TabsContent>
              <TabsContent value="threads" class="mt-0 h-full overflow-auto">
                <ThreadsTab />
              </TabsContent>
              <TabsContent
                value="custom-components"
                class="mt-0 h-full overflow-auto"
              >
                <CustomComponentsTab />
              </TabsContent>
              <TabsContent value="ini" class="mt-0 h-full overflow-auto">
                <IniTab />
              </TabsContent>
            </section>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
