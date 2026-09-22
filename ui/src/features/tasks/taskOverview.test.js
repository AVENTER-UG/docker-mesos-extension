import { deriveTaskOverview, formatOverviewResource } from "./taskOverview";

test("derives task counts and aggregate agent resources", () => {
  const result = deriveTaskOverview({
    active: [{ id: "running-1" }, { id: "running-2" }],
    unreachable: [{ id: "lost-1" }],
    completed: [{ id: "done-1" }, { id: "done-2" }, { id: "done-3" }],
    agents: [
      { active: true, resources: { cpus: 8, mem: 16384 }, used_resources: { cpus: 3, mem: 4096 }, offered_resources: { cpus: 1, mem: 1024 } },
      { active: false, resources: { cpus: 4, mem: 8192 }, used_resources: { cpus: 2, mem: 2048 } },
    ],
  });

  expect(result.counts).toEqual({ active: 2, unreachable: 1, completed: 3, agents: 1 });
  expect(result.resources.cpus).toEqual({ total: 8, used: 3, offered: 1, available: 4 });
  expect(result.resources.mem).toEqual({ total: 16384, used: 4096, offered: 1024, available: 11264 });
});

test("handles missing data and formats resource values safely", () => {
  expect(deriveTaskOverview().counts).toEqual({ active: 0, unreachable: 0, completed: 0, agents: 0 });
  expect(formatOverviewResource("mem", 2048)).toBe("2.0 GiB");
  expect(formatOverviewResource("cpus", 2.5)).toBe("2.5 cores");
});