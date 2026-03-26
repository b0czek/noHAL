import { HiOutlineChevronDown } from "solid-icons/hi";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import BufferedInput from "../../components/form/BufferedInput";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";
import { useI18n } from "../../i18n";
import { cn } from "../../lib/utils";
import {
  type IniReferenceSection,
  matchIniReferenceToken,
} from "./iniReference";

interface HalValueInputProps {
  value: string;
  placeholder?: string;
  class?: string;
  inputClass?: string;
  iniReferenceSections: readonly IniReferenceSection[];
  onCommit: (value: string) => void;
}

interface IniReferenceSectionMenuProps {
  section: IniReferenceSection;
  onSelect: (value: string) => void;
}

function IniReferenceSectionMenu(props: IniReferenceSectionMenuProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <span class="mono">[{props.section.name}]</span>
        <DropdownMenuShortcut>
          {props.section.entries.length}
        </DropdownMenuShortcut>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent class="w-72 overflow-visible p-1">
        <DropdownMenuLabel class="mono">
          [{props.section.name}]
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div class="max-h-[18rem] overflow-auto">
          <For each={props.section.entries}>
            {(entry) => (
              <DropdownMenuItem onSelect={() => props.onSelect(entry.token)}>
                <span class="mono">{entry.key}</span>
                <DropdownMenuShortcut class="max-w-40 truncate">
                  {entry.value || ""}
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
          </For>
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export default function HalValueInput(props: HalValueInputProps) {
  const { t } = useI18n();
  const [query, setQuery] = createSignal("");
  const [isFocused, setIsFocused] = createSignal(false);
  const [draftValue, setDraftValue] = createSignal(props.value);
  createEffect(() => setDraftValue(props.value));
  const selectReference = (value: string) => {
    setDraftValue(value);
    props.onCommit(value);
  };
  const matchedReference = createMemo(() =>
    matchIniReferenceToken(props.iniReferenceSections, draftValue()),
  );
  const showInlineReferenceHint = createMemo(
    () => !isFocused() && matchedReference() !== null,
  );
  const normalizedQuery = createMemo(() => query().trim().toUpperCase());
  const flattenedEntries = createMemo(() =>
    props.iniReferenceSections.flatMap((section) =>
      section.entries.map((entry) => ({
        ...entry,
        sectionName: section.name,
      })),
    ),
  );
  const filteredEntries = createMemo(() => {
    const currentQuery = normalizedQuery();
    if (!currentQuery) return [];
    return flattenedEntries().filter((entry) =>
      [entry.sectionName, entry.key, entry.value, entry.token].some(
        (candidate) => candidate.toUpperCase().includes(currentQuery),
      ),
    );
  });
  const hasSections = createMemo(() => props.iniReferenceSections.length > 0);

  return (
    <div class={cn("grid gap-1.5", props.class)}>
      <div class="relative min-w-0">
        <BufferedInput
          class={cn("min-w-0 pr-10", props.inputClass)}
          value={props.value}
          draftValue={draftValue()}
          onDraftChange={setDraftValue}
          placeholder={props.placeholder}
          onCommit={props.onCommit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <Show when={showInlineReferenceHint() && matchedReference()}>
          {(reference) => (
            <div
              class="pointer-events-none absolute inset-y-0 left-3 right-10 flex items-center overflow-hidden text-sm"
              aria-hidden="true"
            >
              <span class="invisible whitespace-pre">{draftValue()}</span>
              <span class="shrink-0 text-muted-foreground">&nbsp;= </span>
              <span class="truncate text-muted-foreground">
                {reference().value ||
                  t("componentDialog.iniReferenceEmptyValue")}
              </span>
            </div>
          )}
        </Show>
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            class="absolute inset-y-1 right-1 inline-flex w-8 items-center justify-center rounded-md border border-transparent bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={t("componentDialog.iniReferencePicker")}
            aria-label={t("componentDialog.iniReferencePicker")}
          >
            <HiOutlineChevronDown size={14} aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-56 overflow-visible p-1">
            <DropdownMenuLabel>
              {t("componentDialog.iniReferencePicker")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div class="p-1">
              <Input
                value={query()}
                placeholder={t("componentDialog.iniReferenceSearchPlaceholder")}
                onInput={(evt) => setQuery(evt.currentTarget.value)}
                onKeyDown={(evt) => evt.stopPropagation()}
              />
            </div>
            <Show
              when={hasSections()}
              fallback={
                <DropdownMenuItem disabled>
                  {t("componentDialog.iniReferenceUnavailable")}
                </DropdownMenuItem>
              }
            >
              <Show
                when={normalizedQuery()}
                fallback={
                  <div class="max-h-[18rem] overflow-auto">
                    <For each={props.iniReferenceSections}>
                      {(section) => (
                        <IniReferenceSectionMenu
                          section={section}
                          onSelect={selectReference}
                        />
                      )}
                    </For>
                  </div>
                }
              >
                <div class="max-h-[18rem] overflow-auto">
                  <Show
                    when={filteredEntries().length > 0}
                    fallback={
                      <div class="px-2 py-3 text-sm text-muted-foreground">
                        {t("componentDialog.iniReferenceNoMatches")}
                      </div>
                    }
                  >
                    <For each={filteredEntries()}>
                      {(entry) => (
                        <DropdownMenuItem
                          onSelect={() => selectReference(entry.token)}
                        >
                          <span class="mono">{entry.key}</span>
                          <DropdownMenuShortcut class="max-w-40 truncate">
                            [{entry.sectionName}]
                          </DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}
                    </For>
                  </Show>
                </div>
              </Show>
            </Show>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
