import "$styles/global.css";
import { afterEach, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { flushSync } from "svelte";
import { emitNativeEvent } from "$shared/testing/native-events";
import { tabFixture, revision, spaceFixture } from "$shared/testing/fixtures";
import { tabs } from "$domain/tabs";
import { surface } from "$domain/surface";
import Shell from "../Shell.svelte";

vi.mock("$shared/ipc/bindings", async () => {
  const { mockBindings } = await import("$shared/testing/bindings");
  return mockBindings({ tabsBootstrap: async () => {} });
});
afterEach(() => {
  surface.dispose();
  tabs.dispose();
});

/**
 * What one native tab snapshot costs the window with many tabs open: a tab
 * switch, a title change on one tab, and the whole list arriving again
 * unchanged. Run with `VITE_SHELL_SCALE=100,300`; the numbers are the report.
 */
const counts = String(import.meta.env.VITE_SHELL_SCALE ?? "")
  .split(",")
  .map(Number)
  .filter((count) => count > 0);

function state(count: number, active: number, titled = -1, step = 0) {
  // Every case and step above the last: the tab model keeps what it applied across cases.
  const revisionAt = count * 1_000_000 + step * 1000;
  const list = Array.from({ length: count }, (_, index) =>
    tabFixture({
      id: `tab-${index}`,
      projection_revision: revision(index === titled ? revisionAt + index : index + 1),
      title: index === titled ? `Page ${index} (1)` : `Page ${index}`,
      url: `https://site-${index % 12}.example/${index}`,
    }),
  );
  return {
    projection_revision: revision(revisionAt),
    profile: { id: "profile", name: "Personal", kind: "default" as const },
    spaces: [spaceFixture("space", "Home")],
    active_space_id: "space",
    nodes: [],
    tabs: list,
    active: list[active]!.id,
    split_group: null,
  };
}

// Without VITE_SHELL_SCALE one skipped case stands in, so the file still holds a test.
test.skipIf(!counts.length).each(counts.length ? counts : [100])(
  "a window of %i tabs takes a snapshot",
  async (count) => {
    await surface.init();
    await tabs.init();
    emitNativeEvent("itemsChanged", state(count, 0));
    await render(Shell);
    await new Promise((done) => setTimeout(done, 1000));
    // WebKit's clock is coarse: one figure over forty snapshots, each laid out.
    const time = (make: (step: number) => ReturnType<typeof state>) => {
      const snapshots = Array.from({ length: 40 }, (_, step) => make(step + 1));
      const start = performance.now();
      for (const next of snapshots) {
        emitNativeEvent("itemsChanged", next);
        flushSync();
        void document.body.offsetHeight;
      }
      return +((performance.now() - start) / snapshots.length).toFixed(2);
    };
    const switched = time((step) => state(count, step % count, -1, 100 + step));
    const titled = time((step) => state(count, 0, step % count, 200 + step));
    const same = time((step) => state(count, 0, -1, 300 + step));
    console.warn(
      "shell-scale",
      JSON.stringify({
        count,
        rows: document.querySelectorAll("[data-zephium-tab-id]").length,
        dom: document.querySelectorAll("*").length,
        switchMs: switched,
        titleMs: titled,
        unchangedMs: same,
      }),
    );
  },
  120_000,
);
