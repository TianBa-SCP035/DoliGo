import { describe, expect, it } from "vitest";
import {
  createRestoreGate,
  emptyProgressStore,
  getPosition,
  makePosition,
  pickProgressUnitFromVisible,
  rememberPosition,
  shouldAcceptProgressWrite,
} from "../../src/lib/progress";

describe("reading without clicking words", () => {
  it("advances the saved unit as later units become visible", () => {
    const order = ["l-1", "l-2", "l-3", "l-8", "l-18"];
    expect(pickProgressUnitFromVisible(order, ["l-1", "l-2"])).toBe("l-2");
    expect(pickProgressUnitFromVisible(order, ["l-3", "l-8"])).toBe("l-8");
    expect(pickProgressUnitFromVisible(order, ["l-18"])).toBe("l-18");
    expect(pickProgressUnitFromVisible(order, [])).toBeUndefined();

    let store = emptyProgressStore(1);
    const first = pickProgressUnitFromVisible(order, ["l-1", "l-2"])!;
    store = rememberPosition(store, makePosition("scene", "scene-one", first, "visibility"), 2);
    const later = pickProgressUnitFromVisible(order, ["l-8"])!;
    store = rememberPosition(store, makePosition("scene", "scene-one", later, "scroll"), 3);
    expect(getPosition(store, "scene", "scene-one")?.unitId).toBe("l-8");
  });
});

describe("restore gate does not overwrite on init", () => {
  it("rejects visibility and scroll writes until completeRestore", () => {
    let store = rememberPosition(
      emptyProgressStore(1),
      makePosition("reading", "reading-shops", "p-5", "visibility"),
      10,
    );
    const gate = createRestoreGate(true);
    expect(gate.isRestoring).toBe(true);
    expect(shouldAcceptProgressWrite(gate, "visibility")).toBe(false);
    expect(shouldAcceptProgressWrite(gate, "scroll")).toBe(false);

    // Simulate an init scroll/visibility callback targeting the first unit.
    if (shouldAcceptProgressWrite(gate, "visibility")) {
      store = rememberPosition(store, makePosition("reading", "reading-shops", "p-1", "visibility"), 11);
    }
    expect(getPosition(store, "reading", "reading-shops")?.unitId).toBe("p-5");

    gate.completeRestore();
    expect(gate.isRestoring).toBe(false);
    expect(shouldAcceptProgressWrite(gate, "visibility")).toBe(true);
    store = rememberPosition(store, makePosition("reading", "reading-shops", "p-6", "visibility"), 12);
    expect(getPosition(store, "reading", "reading-shops")?.unitId).toBe("p-6");
  });

  it("starts open when there is no saved position", () => {
    const gate = createRestoreGate(false);
    expect(gate.isRestoring).toBe(false);
    expect(shouldAcceptProgressWrite(gate, "visibility")).toBe(true);
  });
});
