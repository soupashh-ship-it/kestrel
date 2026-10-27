import "$styles/global.css";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { emitNativeEvent } from "$shared/testing/native-events";
import { tabFixture, revision, spaceFixture } from "$shared/testing/fixtures";
import { tabs } from "$domain/tabs";
import { surface } from "$domain/surface";
import Shell from "../Shell.svelte";

vi.mock("$shared/ipc/bindings", async () => {
  const { mockBindings } = await import("$shared/testing/bindings");
  return mockBindings({
    pagePermissionCardHost: async () => {},
    tabsBootstrap: async () => {},
  });
});
afterEach(() => {
  surface.dispose();
  tabs.dispose();
});
test("Settings stands beside the tab rail and returns to the same web tab", async () => {
  await surface.init();
  await tabs.init();
  const tab = tabFixture();
  const items = {
    projection_revision: revision(10),
    profile: null,
    spaces: [],
    active_space_id: null,
    nodes: [],
    tabs: [tab],
    active: tab.id,
    split_group: null,
  };
  emitNativeEvent("itemsChanged", items);
  const screen = await render(Shell);
  emitNativeEvent("uiCommand", "browser.settings");
  expect(screen.container.querySelector('[data-zephium-surface="settings"]')).not.toBeNull();
  expect(screen.container.querySelector(".settings-sidebar-navigation")).not.toBeNull();
  // The tab stays one click away in the rail beside the settings panel.
  expect(screen.container.querySelector(`[data-zephium-tab-id="${tab.id}"]`)).not.toBeNull();
  emitNativeEvent("browserReturn", { ...items, projection_revision: revision(11) });
  expect(screen.container.querySelector('[data-zephium-surface="browse"]')).not.toBeNull();
  const rows = screen.container.querySelectorAll(`[data-zephium-tab-id="${tab.id}"]`);
  expect(rows).toHaveLength(1);
  expect(rows[0]?.querySelector("[data-zephium-tab-label]")?.textContent).toBe(tab.title);
  expect(screen.container.querySelector<HTMLInputElement>("[data-zephium-address]")?.value).toBe(
    "example.com",
  );
});

test("leaving Settings gives back the column the window had", async () => {
  await surface.init();
  await tabs.init();
  const tab = tabFixture();
  const items = {
    projection_revision: revision(30),
    profile: { id: "profile", name: "Personal", kind: "default" as const },
    spaces: [spaceFixture("space", "Home")],
    active_space_id: "space",
    nodes: [],
    tabs: [tab],
    active: tab.id,
    split_group: null,
  };
  emitNativeEvent("itemsChanged", items);
  const screen = await render(Shell);
  const column = screen.container.querySelector("aside")!;
  const expanded = column.style.width;
  const shown = () => ({
    width: column.style.width,
    resize: !!screen.container.querySelector('[aria-label="Resize sidebar"]'),
    toggle: !!screen.container.querySelector('[aria-label="Compact Mode"]'),
  });
  const browse = { width: expanded, resize: true, toggle: true };
  expect(shown()).toEqual(browse);

  emitNativeEvent("uiCommand", "browser.settings");
  await expect
    .poll(() => screen.container.querySelector(".settings-sidebar-navigation"))
    .not.toBeNull();
  emitNativeEvent("browserReturn", { ...items, projection_revision: revision(31) });
  await expect.poll(shown).toEqual(browse);
  expect(screen.container.querySelector(".settings-sidebar-navigation")).toBeNull();
});
