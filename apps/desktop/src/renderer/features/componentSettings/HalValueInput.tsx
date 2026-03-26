import { HiOutlineChevronDown } from "solid-icons/hi";
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Show,
} from "solid-js";
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
  applyIniReferenceSuggestion,
  filterIniReferenceSuggestions,
  flattenIniReferenceSections,
  getActiveIniReferenceQuery,
} from "./halValueAutocomplete";
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
  const autocompleteListId = `hal-value-input-autocomplete-${createUniqueId()}`;
  const [query, setQuery] = createSignal("");
  const [isFocused, setIsFocused] = createSignal(false);
  const [draftValue, setDraftValue] = createSignal(props.value);
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = createSignal(0);
  const [activeReferenceQuery, setActiveReferenceQuery] =
    createSignal<ReturnType<typeof getActiveIniReferenceQuery>>(null);
  let inputRef: HTMLInputElement | undefined;
  const autocompleteItemRefs: Array<HTMLButtonElement | undefined> = [];

  createEffect(() => setDraftValue(props.value));

  const updateActiveReferenceQuery = (
    value = draftValue(),
    caret = inputRef?.selectionStart ?? value.length,
  ) => {
    const nextQuery = getActiveIniReferenceQuery(value, caret);
    const suggestions = filterIniReferenceSuggestions(
      autocompleteEntries(),
      nextQuery,
    );
    setActiveReferenceQuery(nextQuery);
    setActiveAutocompleteIndex((currentIndex) => {
      if (suggestions.length === 0) return 0;
      return Math.min(currentIndex, suggestions.length - 1);
    });
  };

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
  const autocompleteEntries = createMemo(() =>
    flattenIniReferenceSections(props.iniReferenceSections),
  );
  const filteredEntries = createMemo(() => {
    const currentQuery = normalizedQuery();
    if (!currentQuery) return [];
    return autocompleteEntries().filter((entry) =>
      [entry.sectionName, entry.key, entry.value, entry.token].some(
        (candidate) => candidate.toUpperCase().includes(currentQuery),
      ),
    );
  });
  const hasSections = createMemo(() => props.iniReferenceSections.length > 0);
  const autocompleteSuggestions = createMemo(() =>
    filterIniReferenceSuggestions(
      autocompleteEntries(),
      activeReferenceQuery(),
    ),
  );
  const showAutocomplete = createMemo(
    () => isFocused() && activeReferenceQuery() !== null && hasSections(),
  );

  createEffect(() => {
    if (!showAutocomplete()) {
      setActiveAutocompleteIndex(0);
    }
  });

  createEffect(() => {
    const activeIndex = activeAutocompleteIndex();
    const suggestions = autocompleteSuggestions();
    if (!showAutocomplete() || suggestions.length === 0) return;

    queueMicrotask(() => {
      autocompleteItemRefs[activeIndex]?.scrollIntoView({
        block: "nearest",
      });
    });
  });

  const applyAutocompleteSuggestion = (token: string) => {
    const currentQuery = activeReferenceQuery();
    if (!currentQuery) return;

    const { nextValue, caret } = applyIniReferenceSuggestion(
      draftValue(),
      currentQuery,
      token,
    );
    setDraftValue(nextValue);
    props.onCommit(nextValue);
    setActiveReferenceQuery(null);
    setActiveAutocompleteIndex(0);

    queueMicrotask(() => {
      inputRef?.focus();
      inputRef?.setSelectionRange(caret, caret);
    });
  };

  return (
    <div class={cn("grid gap-1.5", props.class)}>
      <div class="relative min-w-0">
        <BufferedInput
          ref={inputRef}
          class={cn("min-w-0 pr-10", props.inputClass)}
          value={props.value}
          draftValue={draftValue()}
          onDraftChange={setDraftValue}
          onInput={(evt) => {
            inputRef = evt.currentTarget;
            updateActiveReferenceQuery(
              evt.currentTarget.value,
              evt.currentTarget.selectionStart ??
                evt.currentTarget.value.length,
            );
          }}
          placeholder={props.placeholder}
          onCommit={props.onCommit}
          onFocus={(evt) => {
            inputRef = evt.currentTarget;
            setIsFocused(true);
            updateActiveReferenceQuery(
              evt.currentTarget.value,
              evt.currentTarget.selectionStart ??
                evt.currentTarget.value.length,
            );
          }}
          onBlur={() => {
            setIsFocused(false);
            setActiveReferenceQuery(null);
          }}
          onClick={(evt) => {
            inputRef = evt.currentTarget;
            updateActiveReferenceQuery(
              evt.currentTarget.value,
              evt.currentTarget.selectionStart ??
                evt.currentTarget.value.length,
            );
          }}
          onKeyUp={(evt) => {
            inputRef = evt.currentTarget;
            updateActiveReferenceQuery(
              evt.currentTarget.value,
              evt.currentTarget.selectionStart ??
                evt.currentTarget.value.length,
            );
          }}
          aria-autocomplete="list"
          aria-controls={showAutocomplete() ? autocompleteListId : undefined}
          aria-expanded={showAutocomplete()}
          onKeyDown={(evt) => {
            const suggestions = autocompleteSuggestions();
            if (showAutocomplete()) {
              if (evt.key === "ArrowDown") {
                evt.preventDefault();
                if (suggestions.length > 0) {
                  setActiveAutocompleteIndex((index) =>
                    index >= suggestions.length - 1 ? 0 : index + 1,
                  );
                }
                return;
              }
              if (evt.key === "ArrowUp") {
                evt.preventDefault();
                if (suggestions.length > 0) {
                  setActiveAutocompleteIndex((index) =>
                    index <= 0 ? suggestions.length - 1 : index - 1,
                  );
                }
                return;
              }
              if (evt.key === "Escape") {
                evt.preventDefault();
                setActiveReferenceQuery(null);
                setActiveAutocompleteIndex(0);
                return;
              }
              if (
                (evt.key === "Enter" || evt.key === "Tab") &&
                suggestions.length > 0
              ) {
                evt.preventDefault();
                applyAutocompleteSuggestion(
                  suggestions[activeAutocompleteIndex()]?.token ??
                    suggestions[0].token,
                );
                return;
              }
            }

            inputRef = evt.currentTarget;
            queueMicrotask(() =>
              updateActiveReferenceQuery(
                evt.currentTarget.value,
                evt.currentTarget.selectionStart ??
                  evt.currentTarget.value.length,
              ),
            );
          }}
        />
        <Show when={showAutocomplete()}>
          <div
            id={autocompleteListId}
            role="listbox"
            class="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
          >
            <Show
              when={autocompleteSuggestions().length > 0}
              fallback={
                <div class="px-3 py-2 text-sm text-muted-foreground">
                  {t("componentDialog.iniReferenceNoMatches")}
                </div>
              }
            >
              <div class="max-h-56 overflow-auto py-1">
                <For each={autocompleteSuggestions()}>
                  {(entry, index) => (
                    <button
                      type="button"
                      ref={(element) => {
                        autocompleteItemRefs[index()] = element;
                      }}
                      role="option"
                      aria-selected={index() === activeAutocompleteIndex()}
                      class={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                        index() === activeAutocompleteIndex() &&
                          "bg-accent text-accent-foreground",
                      )}
                      onMouseEnter={() => setActiveAutocompleteIndex(index())}
                      onMouseDown={(evt) => evt.preventDefault()}
                      onClick={() => applyAutocompleteSuggestion(entry.token)}
                    >
                      <span class="mono truncate">{entry.token}</span>
                      <span class="max-w-36 truncate text-xs text-muted-foreground">
                        {entry.value ||
                          t("componentDialog.iniReferenceEmptyValue")}
                      </span>
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>
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
