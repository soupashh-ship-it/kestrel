import { describe, expect, it } from "vitest";
import { neighbour, position, STEPS, stepsFor } from "../lib/flow";

describe("flow", () => {
  it("walks welcome, then four steps, ending ready", () => {
    expect(STEPS).toEqual(["welcome", "import", "essentials", "launcher", "ready"]);
  });

  it("counts from the first real step, welcome being the door", () => {
    expect(position("import")).toEqual({ at: 1, of: 4 });
    expect(position("ready")).toEqual({ at: 4, of: 4 });
  });

  it("never steps back through the door or past the end", () => {
    expect(neighbour("import", -1)).toBeUndefined();
    expect(neighbour("import", 1)).toBe("essentials");
    expect(neighbour("ready", 1)).toBeUndefined();
  });

  it("counts every step it walks", () => {
    expect(stepsFor()).toEqual(STEPS);
  });
});
