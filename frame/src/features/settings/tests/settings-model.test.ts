import { describe, expect, it, vi } from "vitest";
import { searchSections } from "../lib/settings-model";

describe("settings discovery", () => {
  it("finds nested preferences by their localized vocabulary", () => {
    expect(searchSections("interface language").map((section) => section.id)).toContain("general");
    expect(searchSections("motion").map((section) => section.id)).toContain("appearance");
    expect(searchSections("download").map((section) => section.id)).toContain("general");
  });
  it("matches every search word and distinguishes no results", () => {
    expect(searchSections("  WINDOW tint  ").map((section) => section.id)).toEqual(["appearance"]);
    expect(searchSections("accent downloads")).toEqual([]);
    expect(searchSections("unfindablephrase")).toEqual([]);
  });
});

it("finds only destinations this build implements", async () => {
  const { searchSettings, searchSections, sections } = await import("../lib/settings-model");
  expect(sections.some((section) => String(section.id) === "plugins")).toBe(false);
  const retired = new Set(["work", "ai", "skills", "memory", "sites", "mcp", "account"]);
  for (const id of retired)
    expect(sections.some((section) => String(section.id) === id)).toBe(false);
  for (const query of [
    "models",
    "site access",
    "MCP",
    "API key",
    "Jev",
    "TypeSafe",
    "account",
    "dictation",
  ])
    expect(searchSettings(query).some((result) => retired.has(String(result.section)))).toBe(false);
  expect(searchSections("models").some((section) => String(section.id) === "ai")).toBe(false);
  expect(searchSettings("reset settings").some((result) => result.target === "about.reset")).toBe(
    true,
  );
});

it("groups sections as Browser and App with stable ids", async () => {
  const { groups, sections } = await import("../lib/settings-model");
  const listed = (group: string) =>
    sections.filter((section) => section.group === group).map((section) => section.id);
  expect(groups.map((group) => group.id)).toEqual(["browser", "app"]);
  expect(listed("browser").filter((id) => id !== "profiles")).toEqual([
    "general",
    "appearance",
    "tabs",
    "newtab",
    "search",
    "privacy",
    "focus",
    "performance",
  ]);
  expect(listed("app")).toEqual(["features", "shortcuts", "about"]);
});

it("finds every real tab option", async () => {
  const { searchSettings } = await import("../lib/settings-model");
  for (const [query, target] of [
    ["archive", "tabs.archive"],
    ["other apps", "tabs.external"],
    ["close buttons", "tabs.close-button"],
    ["login", "general.login"],
  ]) {
    expect(searchSettings(query!).some((result) => result.target === target)).toBe(true);
  }
});

it("finds the page zoom options", async () => {
  const { searchSettings } = await import("../lib/settings-model");
  for (const [query, target] of [
    ["default zoom", "appearance.zoom"],
    ["zoom levels", "appearance.zoom-levels"],
  ]) {
    expect(searchSettings(query!).some((result) => result.target === target)).toBe(true);
  }
});

it("takes a feature's page out of navigation and search while its switch is off", async () => {
  const off = new Set<string>();
  vi.resetModules();
  vi.doMock("$domain/preferences", async (actual) => {
    const real = (await actual()) as typeof import("$domain/preferences");
    return {
      preferences: {
        ...real.preferences,
        enabled: (feature: string) => !off.has(feature),
      },
    };
  });
  const { shownSections, searchSections } = await import("../lib/settings-model");
  const shown = () => shownSections().map((section) => section.id);
  expect(shown()).toEqual(expect.arrayContaining(["focus", "features"]));
  expect(searchSections("focus").some((section) => section.id === "focus")).toBe(true);
  off.add("time");
  expect(shown()).not.toContain("focus");
  expect(searchSections("focus").some((section) => section.id === "focus")).toBe(false);
  vi.doUnmock("$domain/preferences");
});
