import type { ComponentStoreEntry } from "@nohal/core/types";
import { HiOutlineArrowLeft } from "solid-icons/hi";
import { For, Show } from "solid-js";
import { Button } from "../../../components/ui/button";
import { useI18n } from "../../../i18n";
import CustomStoreLocationSection from "./CustomStoreLocationSection";

interface ManualComponentsViewProps {
  entries: readonly ComponentStoreEntry[];
  onBack: () => void;
  onAddComponent: () => void;
  onSelectComponent: (componentId: string) => void;
}

export default function ManualComponentsView(props: ManualComponentsViewProps) {
  const { t } = useI18n();

  return (
    <div class="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-2xl bg-black/20 p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <div class="flex items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={t("common.back")}
              aria-label={t("common.back")}
              onClick={props.onBack}
            >
              <HiOutlineArrowLeft size={16} aria-hidden="true" />
            </Button>
            <div class="min-w-0">
              <div class="text-lg font-semibold">
                {t("componentStore.customSource")}
              </div>
              <div class="text-sm text-muted-foreground">
                {t("componentStore.customSourceDescription")}
              </div>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void props.onAddComponent()}
        >
          {t("componentStore.addComponent")}
        </Button>
      </div>

      <CustomStoreLocationSection />

      <section class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 rounded-2xl p-4">
        <div class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("customComponents.catalogTitle")}
        </div>
        <Show
          when={props.entries.length > 0}
          fallback={
            <div class="text-sm text-muted-foreground">
              {t("componentStore.noCustomComponents")}
            </div>
          }
        >
          <div class="grid min-h-0 auto-rows-max content-start gap-2 overflow-auto pr-1">
            <For each={props.entries}>
              {(entry) => (
                <button
                  type="button"
                  class="focus-ring grid gap-1 rounded-2xl bg-black/20 px-4 py-3 text-left transition hover:bg-white/[0.08]"
                  onClick={() => props.onSelectComponent(entry.componentId)}
                >
                  <div class="mono font-medium">
                    {entry.parsed.halComponentName}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {t("customComponents.stats", {
                      pins: entry.parsed.pins.length,
                      params: entry.parsed.params.length,
                      instances: 0,
                    })}
                  </div>
                </button>
              )}
            </For>
          </div>
        </Show>
      </section>
    </div>
  );
}
