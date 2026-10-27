import "$styles/global.css";
import { afterEach, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";
import { emitNativeEvent } from "$shared/testing/native-events";
import { preferences } from "$domain/preferences";
import * as settings from "../lib/settings-state.svelte";
import type { SettingsSection } from "../lib/settings-model";
import SettingsLookStage from "./SettingsLookStage.svelte";

const native = vi.hoisted(() => ({ settings: {} as Record<string, string> }));
vi.mock("$domain/tabs", () => ({
  tabs: { profile: () => ({ id: "00000000000000000000000001", kind: "regular" }) },
}));
// A look bench: what the shots depend on answers for real, the rest nothing.
vi.mock("$shared/ipc/bindings", async () => {
  const known: Record<string, (...args: never[]) => Promise<unknown>> = {
    settingGet: async (key: string) => native.settings[key] ?? null,
    keymapEntries: async () => [],
  };
  return {
    commands: new Proxy(known, {
      get: (target, key) =>
        typeof key === "string" ? (target[key] ?? (async () => null)) : undefined,
    }),
  };
});

afterEach(() => {
  preferences.dispose();
  native.settings = {};
});

const shots = "../../../../../target/look/settings";
const settle = (ms = 450) => new Promise((done) => setTimeout(done, ms));

async function shoot(name: string, section: SettingsSection) {
  settings.select(section);
  await settle();
  for (const theme of ["dark", "light"]) {
    document.documentElement.dataset.theme = theme;
    await settle(250);
    await page.screenshot({ path: `${shots}/${name}-${theme}.png` });
  }
  document.documentElement.dataset.theme = "dark";
}

test("Features, and the tools group as a switch goes off, both themes", async () => {
  await page.viewport(1280, 1100);
  await preferences.init();
  await render(SettingsLookStage);
  await settle();
  await shoot("features", "features");

  emitNativeEvent("uiCommand", "preference.notes.enabled=false");
  await shoot("features-off", "features");
});
