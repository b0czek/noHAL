import { createEmptyProject } from "@nohal/core/project";
import { createContext, type ParentProps, useContext } from "solid-js";
import { useI18n } from "../i18n";
import { createEditorStore } from "./store";

type EditorStoreContextValue = ReturnType<typeof createEditorStore>;

const EditorStoreContext = createContext<EditorStoreContextValue>();

export function EditorStoreProvider(props: ParentProps) {
  const { t } = useI18n();
  const store = createEditorStore(
    createEmptyProject(t("app.defaultProjectName")),
    t,
  );

  return (
    <EditorStoreContext.Provider value={store}>
      {props.children}
    </EditorStoreContext.Provider>
  );
}

export function useEditorStore() {
  const ctx = useContext(EditorStoreContext);
  if (!ctx) throw new Error("EditorStoreProvider is missing");
  return ctx;
}
