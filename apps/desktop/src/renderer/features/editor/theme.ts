import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

export const codeEditorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "#0a1014",
    color: "#d6e3ea",
  },
  ".cm-scroller": {
    fontFamily:
      '"Iosevka", "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace',
    overflow: "auto",
    minHeight: "100%",
  },
  ".cm-content": {
    minHeight: "100%",
    padding: "12px 0",
    caretColor: "#d6e3ea",
  },
  ".cm-gutters": {
    backgroundColor: "#0a1014",
    color: "#5f7380",
    border: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(143, 199, 255, 0.06)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#0a1014",
    color: "#c5d2da",
  },
  ".cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "rgba(245, 185, 113, 0.32) !important",
  },
  ".cm-selectionLayer .cm-selectionBackground": {
    backgroundColor: "rgba(245, 185, 113, 0.32)",
  },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
    backgroundColor: "rgba(245, 185, 113, 0.36)",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "#d6e3ea",
  },
  ".cm-matchingBracket": {
    backgroundColor: "rgba(245, 185, 113, 0.16)",
    outline: "1px solid rgba(245, 185, 113, 0.35)",
  },
  ".cm-panels": {
    backgroundColor: "#0f171c",
    color: "#d6e3ea",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  ".cm-searchMatch": {
    backgroundColor: "rgba(245, 185, 113, 0.16)",
    outline: "1px solid rgba(245, 185, 113, 0.3)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "rgba(245, 185, 113, 0.24)",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    border: "none",
    color: "#9bb1bd",
  },
});

const codeEditorHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: "#6f8a7a" },
  { tag: tags.keyword, color: "#f5b971", fontWeight: "bold" },
  { tag: tags.operator, color: "#d68c6f" },
  { tag: tags.number, color: "#7fd0a6" },
  { tag: tags.string, color: "#d8c98f" },
  { tag: tags.escape, color: "#f0d39a" },
  { tag: tags.atom, color: "#8fc7ff" },
  { tag: tags.bool, color: "#c6a0ff" },
]);

export const codeEditorSyntaxTheme = syntaxHighlighting(
  codeEditorHighlightStyle,
);
