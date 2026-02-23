import { render } from "solid-js/web";
import App from "./app";
import { I18nProvider } from "./i18n";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

render(
  () => (
    <I18nProvider locale="en">
      <App />
    </I18nProvider>
  ),
  root,
);
