import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { flushSync } from "svelte";
import * as settings from "../lib/settings-state.svelte";
import "$styles/global.css";
import SettingsNavigation from "../components/SettingsNavigation.svelte";

vi.mock("$shared/ipc/bindings", async () => {
  const { mockBindings } = await import("$shared/testing/bindings");
  return mockBindings({});
});

test("the current page's plate travels to the page chosen next", async () => {
  await page.viewport(400, 900);
  const screen = await render(SettingsNavigation);
  const items = [...screen.container.querySelectorAll<HTMLElement>(".settings-nav-item")];
  const current = items.find((item) => item.getAttribute("aria-current") === "page")!;
  const next = items.at(-1)!;
  expect(next).not.toBe(current);

  next.click();
  flushSync();
  const glides = screen.container.querySelectorAll<HTMLElement>(".selection-glide");
  expect(glides).toHaveLength(1);
  expect(next.getAttribute("aria-current")).toBe("page");
  expect(next.hasAttribute("data-gliding")).toBe(true);
  await expect.poll(() => glides[0]!.isConnected, { timeout: 2000 }).toBe(false);
  expect(next.hasAttribute("data-gliding")).toBe(false);
});

test("the navigation lists only the browser and application groups", async () => {
  await page.viewport(400, 900);
  settings.select("general");
  const screen = await render(SettingsNavigation);
  const groups = [...screen.container.querySelectorAll(".settings-nav-group h2")].map(
    (heading) => heading.textContent,
  );
  expect(groups).toEqual(["Browser", "App"]);
  expect(screen.container.textContent).not.toContain("Plugins");
  await screen.unmount();
  settings.select("general");
});
