import { render } from "solid-js/web";
import App from "./app";
import { I18nProvider } from "./i18n";
import {
  AppSettingsProvider,
  useAppSettings,
} from "./state/AppSettingsProvider";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

function Root() {
  const { settings } = useAppSettings();

  return (
    <I18nProvider locale={settings.locale}>
      <App />
    </I18nProvider>
  );
}

render(
  () => (
    <AppSettingsProvider>
      <Root />
    </AppSettingsProvider>
  ),
  root,
);
