import { hashFromTabValue, resourceIdFromHash, tabValueFromHash } from "./hashNavigation";

describe("Mesos hash navigation", () => {
  test("extracts encoded framework and agent IDs from deep links", () => {
    expect(resourceIdFromHash("#/frameworks/framework%201", "frameworks")).toBe("framework 1");
    expect(resourceIdFromHash("#/agents/agent%2F1", "agents")).toBe("agent/1");
    expect(resourceIdFromHash("#/tasks/task-1", "agents")).toBeNull();
  });
  test.each([
    ["", 0],
    ["#", 0],
    ["#/", 0],
    ["#/index.html", 0],
    ["#/tasks", 1],
    ["#/frameworks", 2],
    ["#/agents", 3],
    ["#/master", 4],
    ["#/offers", 5],
  ])("maps %p to tab %p", (hash, tab) => {
    expect(tabValueFromHash(hash)).toBe(tab);
  });

  test("maps Mesos detail routes to their owning overview", () => {
    expect(tabValueFromHash("#/frameworks/framework-1")).toBe(2);
    expect(tabValueFromHash("#/agents/agent-1/frameworks/framework-1")).toBe(3);
    expect(tabValueFromHash("#/tasks/task-1")).toBe(1);
  });

  test("falls back to Overview for unknown and malformed routes", () => {
    expect(tabValueFromHash("#/unknown/path")).toBe(0);
    expect(tabValueFromHash(null)).toBe(0);
  });

  test.each([
    [0, "#/"],
    [1, "#/tasks"],
    [2, "#/frameworks"],
    [3, "#/agents"],
    [4, "#/master"],
    [5, "#/offers"],
    [99, "#/"],
  ])("maps tab %p to %p", (tab, hash) => {
    expect(hashFromTabValue(tab)).toBe(hash);
  });
});
