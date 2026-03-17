import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  rectangularSelection,
} from "@codemirror/view";
import { createEffect, onCleanup, onMount } from "solid-js";
import { linuxcncHalLanguage } from "./languages/linuxcncHal";
import { codeEditorSyntaxTheme, codeEditorTheme } from "./theme";

const baseExtensions: Extension[] = [
  lineNumbers(),
  highlightActiveLineGutter(),
  drawSelection(),
  dropCursor(),
  history(),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  rectangularSelection(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  EditorState.tabSize.of(2),
  EditorView.lineWrapping,
  codeEditorTheme,
  codeEditorSyntaxTheme,
  keymap.of([
    indentWithTab,
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...historyKeymap,
    ...searchKeymap,
  ]),
];

export type CodeEditorLanguage = "plaintext" | "linuxcnc-hal";

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: CodeEditorLanguage;
  minHeightClass?: string;
}

function resolveLanguageExtension(language: CodeEditorLanguage | undefined) {
  if (language === "linuxcnc-hal") return linuxcncHalLanguage;
  return [];
}

export default function CodeEditor(props: CodeEditorProps) {
  let containerRef: HTMLDivElement | undefined;
  let view: EditorView | undefined;

  const languageCompartment = new Compartment();

  onMount(() => {
    if (!containerRef) return;
    view = new EditorView({
      parent: containerRef,
      state: EditorState.create({
        doc: props.value,
        extensions: [
          ...baseExtensions,
          languageCompartment.of(resolveLanguageExtension(props.language)),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            const nextValue = update.state.doc.toString();
            if (nextValue === props.value) return;
            props.onChange(nextValue);
          }),
        ],
      }),
    });
  });

  createEffect(() => {
    const nextValue = props.value;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (currentValue === nextValue) return;
    view.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: nextValue,
      },
    });
  });

  createEffect(() => {
    const nextLanguage = props.language;
    if (!view) return;
    view.dispatch({
      effects: languageCompartment.reconfigure(
        resolveLanguageExtension(nextLanguage),
      ),
    });
  });

  onCleanup(() => {
    view?.destroy();
  });

  return (
    <div
      ref={containerRef}
      class={`h-full min-h-0 w-full ${props.minHeightClass ?? ""}`}
    />
  );
}
