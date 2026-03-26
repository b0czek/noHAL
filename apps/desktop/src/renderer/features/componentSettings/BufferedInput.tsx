import { createEffect, createSignal, on, splitProps } from "solid-js";
import { Input, type InputProps } from "../../components/ui/input";

interface BufferedInputProps extends Omit<InputProps, "value" | "onInput"> {
  value: string;
  draftValue?: string;
  onDraftChange?: (value: string) => void;
  onCommit: (value: string) => void;
}

export default function BufferedInput(props: BufferedInputProps) {
  const [local, inputProps] = splitProps(props, [
    "value",
    "draftValue",
    "onDraftChange",
    "onCommit",
    "onBlur",
    "onKeyDown",
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
    <Input
      {...inputProps}
      value={draftValue()}
      onInput={(evt) => updateDraftValue(evt.currentTarget.value)}
      onBlur={(evt) => {
        commitValue(draftValue());
        if (typeof local.onBlur === "function") {
          local.onBlur(evt);
        }
      }}
      onKeyDown={(evt) => {
        if (typeof local.onKeyDown === "function") {
          local.onKeyDown(evt);
        }
        if (evt.defaultPrevented || evt.key !== "Enter") return;
        evt.preventDefault();
        evt.currentTarget.blur();
      }}
    />
  );
}
