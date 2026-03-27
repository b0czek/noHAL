import { For, Show } from "solid-js";
import { Alert } from "../../../components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { useI18n } from "../../../i18n";

interface WarningsCardProps {
  warnings: string[];
}

export default function WarningsCard(props: WarningsCardProps) {
  const { t } = useI18n();

  return (
    <Show when={props.warnings.length > 0}>
      <Card class="border-warning/20 bg-transparent shadow-none">
        <CardHeader>
          <CardTitle>{t("projectCreation.parserWarnings")}</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-2">
          <For each={props.warnings.slice(0, 20)}>
            {(warning) => (
              <Alert class="border-warning/30 bg-warning/10 text-foreground">
                {warning}
              </Alert>
            )}
          </For>
          <Show when={props.warnings.length > 20}>
            <div class="text-sm text-muted-foreground">
              {t("projectCreation.parserWarningsTruncated", {
                count: props.warnings.length,
              })}
            </div>
          </Show>
        </CardContent>
      </Card>
    </Show>
  );
}
