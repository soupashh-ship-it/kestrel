import { describe, expect, it } from "vitest";
import { cover, frame, land, NEWTAB, PAGE, SHOTS, STAGE, WINDOW, type Shot } from "../lib/camera";

const parse = (transform: string) => transform.match(/-?\d+(\.\d+)?/gu)!.map(Number);

describe("camera", () => {
  it("puts a shot's focus exactly where the shot says", () => {
    for (const shot of Object.values(SHOTS)) {
      const [x, y, scale] = parse(frame(shot));
      // The window scales about its centre, then moves.
      const landed = (point: number, centre: number, offset: number) =>
        centre + offset + scale! * (point - centre);
      expect(landed(shot.focus[0], WINDOW.width / 2, x!)).toBeCloseTo(shot.at[0], 0);
      expect(landed(shot.focus[1], WINDOW.height / 2, y!)).toBeCloseTo(shot.at[1], 0);
    }
  });

  it("keeps the window of every scene clear of the controls below it", () => {
    const controls = STAGE.height - 34 - 44;
    for (const step of ["import", "essentials", "ready"] as const) {
      const shot: Shot = SHOTS[step];
      const drawn = shot.fade ?? WINDOW.height;
      expect(shot.at[1] + shot.scale * (drawn - shot.focus[1]), step).toBeLessThanOrEqual(controls);
    }
  });

  it("moves the window between importing and keeping", () => {
    expect(frame(SHOTS.import)).not.toBe(frame(SHOTS.essentials));
    expect(SHOTS.import.at[0]).toBeLessThan(STAGE.width / 2);
    expect(SHOTS.essentials.at[0]).toBeGreaterThan(STAGE.width / 2);
  });

  it("covers any view with the page's sky, corners and all", () => {
    for (const view of [STAGE, { width: 1240, height: 980 }, { width: 1600, height: 780 }]) {
      const shot = cover(view);
      const [left, top] = land(shot, [PAGE.x, PAGE.y]);
      const [right, bottom] = land(shot, [PAGE.x + PAGE.width, PAGE.y + PAGE.height]);
      const [cx, cy] = [STAGE.width / 2, STAGE.height / 2];
      expect(left).toBeLessThan(cx - view.width / 2);
      expect(right).toBeGreaterThan(cx + view.width / 2);
      expect(top).toBeLessThan(cy - view.height / 2);
      expect(bottom).toBeGreaterThan(cy + view.height / 2);
    }
  });

  it("keeps the new tab's name inside its sky, above the horizon", () => {
    expect(NEWTAB.name.x * 2 + NEWTAB.name.w).toBeCloseTo(PAGE.width, 0);
    expect(NEWTAB.name.y + NEWTAB.name.h).toBeLessThan(NEWTAB.horizon);
  });
});
