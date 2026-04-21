import { Button } from "../../components/ui/button";
import { useI18n } from "../../i18n";

interface FloatModeToggleProps {
  value: "fp" | "nofp" | "unknown";
  onChange: (value: "fp" | "nofp") => void;
  disableNoFp?: boolean;
  class?: string;
}

export default function FloatModeToggle(props: FloatModeToggleProps) {
  const { t } = useI18n();

  return (
    <div
      class={`inline-flex min-h-9 w-fit items-center gap-2 rounded-xl bg-black/20 p-1 ${props.class ?? ""}`.trim()}
    >
      <Button
        type="button"
        size="sm"
        variant={props.value === "nofp" ? "default" : "ghost"}
        disabled={props.disableNoFp}
        onClick={() => props.onChange("nofp")}
      >
        {t("threadsDialog.floatNoFp")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={props.value !== "nofp" ? "default" : "ghost"}
        onClick={() => props.onChange("fp")}
      >
        {t("threadsDialog.floatFp")}
      </Button>
    </div>
  );
}
