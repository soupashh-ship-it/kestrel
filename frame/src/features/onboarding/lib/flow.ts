export type Step = "welcome" | "import" | "essentials" | "launcher" | "ready";

export const STEPS: readonly Step[] = ["welcome", "import", "essentials", "launcher", "ready"];

/** The steps a run walks, welcome being the door rather than a step. */
export const stepsFor = (): readonly Step[] => STEPS;

/** Where a step stands among the ones that count, welcome being the door
 *  rather than a step: 1-based, with the total. */
export function position(step: Step): { at: number; of: number } {
  const counted: Step[] = STEPS.filter((candidate) => candidate !== "welcome");
  return { at: counted.indexOf(step) + 1, of: counted.length };
}

export function neighbour(step: Step, by: 1 | -1): Step | undefined {
  const next = STEPS[STEPS.indexOf(step) + by];
  return next === "welcome" ? undefined : next;
}
