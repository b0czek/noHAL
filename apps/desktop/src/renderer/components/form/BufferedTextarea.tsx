import { createEffect, createSignal, on, splitProps } from "solid-js";
import { Textarea, type TextareaProps } from "../ui/textarea";

interface BufferedTextareaProps
  extends Omit<TextareaProps, "value" | "onInput"> {
  value: string;
  draftValue?: string;
  onDraftChange?: (value: string) => void;
  onCommit: (value: string) => void;
}

export default function BufferedTextarea(props: BufferedTextareaProps) {
  const [local, textareaProps] = splitProps(props, [
    "value",
    "draftValue",
    "onDraftChange",
    "onCommit",
    "onBlur",
  ]);
  const [internalDraftValue, setInternalDraftValue] = createSignal(local.value);
  const [committedValue, setCommittedValue] = createSignal(local.value);
  const draftValue = () => local.draftValue ?? internalDraftValue();

  createEffect(
    on(
      () => local.value,
      (value) => {
        setCommittedValue(value);
        if (local.draftValue === undefined) {
          setInternalDraftValue(value);
        }
      },
    ),
  );

  const updateDraftValue = (value: string) => {
    if (local.draftValue === undefined) {
      setInternalDraftValue(value);
    }
    local.onDraftChange?.(value);
  };

  const commitValue = (value: string) => {
    if (value === committedValue()) return;
    setCommittedValue(value);
    local.onCommit(value);
  };

  return (
    <Textarea
      {...textareaProps}
      value={draftValue()}
      onInput={(evt) => updateDraftValue(evt.currentTarget.value)}
      onBlur={(evt) => {
        commitValue(draftValue());
        if (typeof local.onBlur === "function") {
          local.onBlur(evt);
        }
      }}
    />
  );
}
