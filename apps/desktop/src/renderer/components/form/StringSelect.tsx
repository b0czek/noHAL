import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export interface StringSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface StringSelectProps {
  value?: string;
  options: ReadonlyArray<StringSelectOption>;
  placeholder?: string;
  disabled?: boolean;
  class?: string;
  onChange: (value: string) => void;
}

export default function StringSelect(props: StringSelectProps) {
  const selectedOption = () =>
    props.options.find((option) => option.value === props.value) ?? null;

  return (
    <Select<StringSelectOption>
      value={selectedOption()}
      options={[...props.options]}
      optionValue="value"
      optionTextValue="label"
      optionDisabled="disabled"
      placeholder={props.placeholder}
      disabled={props.disabled}
      itemComponent={(itemProps) => (
        <SelectItem item={itemProps.item}>
          {itemProps.item.rawValue.label}
        </SelectItem>
      )}
      onChange={(option) => {
        if (option) props.onChange(option.value);
      }}
    >
      <SelectTrigger class={props.class}>
        <SelectValue<StringSelectOption>>
          {(state) => state.selectedOption()?.label ?? props.placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
}
