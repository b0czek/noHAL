import type { JSX } from "solid-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export interface SettingsDialogTab {
  value: string;
  label: string;
  content: JSX.Element;
}

interface SettingsDialogShellProps {
  title: string;
  description?: string;
  value: string;
  tabs: ReadonlyArray<SettingsDialogTab>;
  onChange: (value: string) => void;
  onClose: () => void;
  dialogClass?: string;
  headerClass?: string;
  descriptionClass?: string;
  panelClass?: string;
}

export default function SettingsDialogShell(props: SettingsDialogShellProps) {
  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) props.onClose();
      }}
    >
      <DialogContent
        class={`grid h-[min(760px,calc(100vh-36px))] w-[min(1080px,calc(100vw-36px))] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-[1.75rem] border-white/10 bg-[linear-gradient(180deg,rgba(11,24,31,0.96),rgba(8,17,22,0.92))] p-5 shadow-2xl shadow-black/30 ${props.dialogClass ?? ""}`}
        onContextMenu={(evt: MouseEvent) => evt.preventDefault()}
      >
        <DialogHeader
          class={`flex-row items-start justify-between gap-4 space-y-0 text-left ${props.headerClass ?? ""}`}
        >
          <div>
            <DialogTitle>{props.title}</DialogTitle>
            <DialogDescription class={props.descriptionClass}>
              {props.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div class="min-h-0">
          <Tabs
            value={props.value}
            onChange={props.onChange}
            class="grid h-full min-h-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]"
          >
            <aside class="min-h-0 rounded-2xl bg-white/[0.04] p-2 shadow-inner shadow-black/20">
              <TabsList class="grid h-auto w-full grid-cols-1 gap-1 bg-transparent p-0">
                {props.tabs.map((tab) => (
                  <TabsTrigger
                    value={tab.value}
                    class="justify-start rounded-xl px-3 py-2 text-left"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </aside>

            <section
              class={`min-h-0 overflow-hidden rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20 ${props.panelClass ?? ""}`}
            >
              {props.tabs.map((tab) => (
                <TabsContent
                  value={tab.value}
                  class="mt-0 h-full overflow-auto"
                >
                  {tab.content}
                </TabsContent>
              ))}
            </section>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
