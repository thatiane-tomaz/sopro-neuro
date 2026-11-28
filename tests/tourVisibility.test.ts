import { describe, expect, test } from "bun:test";
import { shouldShowTour, tourStorageKey } from "../src/lib/tourVisibility";
import { TOUR_STEPS } from "../src/lib/tourSteps";

describe("tour visibility", () => {
  test("existing users see the new tour despite the old completion flag", () => {
    const storage = new Map([["sopro_tour_v1", "done"]]);
    expect(shouldShowTour("existing-user", storage.get(tourStorageKey("existing-user")) ?? null)).toBe(true);
  });
  test("refreshing after presentation does not show it again", () => {
    expect(shouldShowTour("existing-user", "seen")).toBe(false);
    expect(shouldShowTour("existing-user", "done")).toBe(false);
  });
  test("completion is separate for each account", () => {
    const storage = new Map([[tourStorageKey("first-user"), "done"]]);
    expect(shouldShowTour("second-user", storage.get(tourStorageKey("second-user")) ?? null)).toBe(true);
    expect(tourStorageKey("first-user")).not.toBe(tourStorageKey("second-user"));
  });
  test("signed-out visitors do not receive the tour", () => {
    expect(shouldShowTour(undefined, null)).toBe(false);
  });
  test("the journeys presentation allows browsing until Continue", () => {
    const step = TOUR_STEPS.find((item) => item.route === "/jornada" && item.advance === "next");
    expect(step?.allowExplore).toBe(true);
    expect(step?.advance).toBe("next");
  });
});