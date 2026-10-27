import "$styles/global.css";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";
import { favicons } from "$domain/favicons";
import { surface } from "$domain/surface";
import { tabs } from "$domain/tabs";
import { preferences } from "$domain/preferences";
import * as sidebar from "$session/sidebar-mode.svelte";
import Shell from "../Shell.svelte";
import { paint, settle } from "./look-bench";

vi.mock("$shared/ipc/bindings", async () => {
  const { mockBindings } = await import("$shared/testing/bindings");
  const id = "01J00000000000000000000001";
  return mockBindings({
    pagePermissionCardHost: async () => {},
    profilesGet: async () => ({
      status: "ok" as const,
      data: {
        current: id,
        private: false,
        profiles: [
          {
            id,
            name: "Ada Lovelace",
            kind: "default" as const,
            avatar: { style: "initials" as const, color: 1, symbol: 0, revision: 1 },
          },
        ],
      },
    }),
    tabsBootstrap: async () => {},
    sidebarSetWidth: async () => {},
    sidebarResize: async () => false,
    sidebarResizeGuide: async () => true,
    settingGet: async () => null,
    keymapEntries: async () => [],
  });
});

afterEach(() => {
  sidebar.adoptMode("default");
  favicons.dispose();
  surface.dispose();
  tabs.dispose();
  preferences.dispose();
});

const box = (element: Element | null) => {
  const rect = element?.getBoundingClientRect();
  return rect && { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
};

/** Where the foot's pieces stand, from the window's bottom edge. */
function foot(root: ParentNode, trigger: string) {
  const dock = root.querySelector(".dock");
  const case_ = root.querySelector(trigger);
  const rules = [...root.querySelectorAll(".dock-rule")].map(box);
  return {
    dock: box(dock),
    trigger: box(case_),
    rules,
    avatar: box(case_?.querySelector(".profile-avatar, svg") ?? null),
  };
}

test("the rail's foot keeps its place at both themes and opens the profile stack", async () => {
  await page.viewport(900, 640);
  await paint();
  const screen = await render(Shell);
  sidebar.adoptMode("compact");
  await settle();
  const shoot = async (name: string) => {
    for (const theme of ["dark", "light"]) {
      document.documentElement.dataset.theme = theme;
      await settle();
      await page.screenshot({ path: `../../../../../target/work-polish/${name}-${theme}.png` });
    }
    document.documentElement.dataset.theme = "dark";
  };
  await shoot("foot-browse");
  const browse = foot(screen.container, ".shelf .case");
  expect(browse.trigger).not.toBeNull();
  const rule = browse.rules.at(-1)!;
  expect(rule).toBeDefined();
  expect(browse.trigger!.y + browse.trigger!.h).toBeLessThanOrEqual(window.innerHeight);
  screen.container.querySelector<HTMLElement>(".shelf .case")!.click();
  await settle();
  await expect.element(page.getByRole("menuitem", { name: /^Ada Lovelace/u })).toBeVisible();
  await shoot("foot-browse-menu");
});
