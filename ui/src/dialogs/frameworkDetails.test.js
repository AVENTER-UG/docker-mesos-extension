import {
  filterFrameworkTasks,
  formatFrameworkResource,
  formatFrameworkTimestamp,
  frameworkAdvancedDetails,
  frameworkRoles,
  frameworkStatus,
  frameworkTaskCounts,
  frameworkTaskPreview,
  frameworkTasks,
  frameworkWebUiUrl,
  normalizeFrameworkRoles,
} from "./frameworkDetails";

test("normalizes plural and singular framework roles", () => {
  expect(frameworkRoles({ roles: ["analytics", "analytics", "batch"] })).toEqual(["analytics", "batch"]);
  expect(frameworkRoles({ role: "legacy" })).toEqual(["legacy"]);
  expect(normalizeFrameworkRoles({ role: "legacy" })).toBe("legacy");
  expect(normalizeFrameworkRoles({})).toBe("—");
  expect(normalizeFrameworkRoles(null)).toBe("—");
});

test("formats timestamps and resources without leaking invalid numbers", () => {
  expect(formatFrameworkTimestamp(undefined)).toBe("—");
  expect(formatFrameworkTimestamp(0)).toBe("—");
  expect(formatFrameworkTimestamp(1704067200)).toContain("2024");
  expect(formatFrameworkResource("cpus", 1.25)).toBe("1.25");
  expect(formatFrameworkResource("mem", 1000)).toContain("MiB");
  expect(formatFrameworkResource("mem", 2048)).toBe("2.0 GiB");
  expect(formatFrameworkResource("mem", 1024001)).toBe("1.0 TiB");
  expect(formatFrameworkResource("ports", "[31000-32000]")).toBe("[31000-32000]");
  expect(formatFrameworkResource("disk", "invalid")).toBe("—");
});

test("derives meaningful framework connection states", () => {
  expect(frameworkStatus({ active: true, connected: true })).toEqual({ label: "Active", color: "success" });
  expect(frameworkStatus({ active: true, connected: false }).label).toBe("Active · disconnected");
  expect(frameworkStatus({ recovered: true }).label).toBe("Recovered");
  expect(frameworkStatus({ unregistered_time: 10 }).label).toBe("Unregistered");
  expect(frameworkStatus({ connected: true }).label).toBe("Connected · inactive");
  expect(frameworkStatus({}).label).toBe("Inactive");
  expect(frameworkStatus(null).label).toBe("Inactive");
});

test("counts task collections safely", () => {
  expect(frameworkTaskCounts({
    tasks: [{ id: "running" }],
    completed_tasks: [{ id: "done-1" }, { id: "done-2" }],
    unreachable_tasks: null,
    executors: [{}],
  })).toEqual({ active: 1, completed: 2, unreachable: 0, executors: 1 });
  expect(frameworkTaskCounts()).toEqual({ active: 0, completed: 0, unreachable: 0, executors: 0 });
  expect(frameworkTaskCounts(null)).toEqual({ active: 0, completed: 0, unreachable: 0, executors: 0 });
});

test("collects every framework task collection in stable order", () => {
  expect(frameworkTasks({
    tasks: [{ id: "active" }],
    unreachable_tasks: [{ id: "unreachable" }],
    completed_tasks: [{ id: "completed" }],
  }).map((task) => task.id)).toEqual(["active", "unreachable", "completed"]);
  expect(frameworkTasks(null)).toEqual([]);
});

test("searches task names and IDs independently of task state", () => {
  const tasks = [
    { id: "alpha-1", name: "Worker", state: "TASK_RUNNING" },
    { id: "beta-2", name: "Alpha cleanup", state: "TASK_FINISHED" },
  ];
  expect(filterFrameworkTasks(tasks, "ALPHA")).toEqual(tasks);
  expect(filterFrameworkTasks(tasks, "beta-2")).toEqual([tasks[1]]);
  expect(filterFrameworkTasks(tasks, "")).toEqual(tasks);
  expect(filterFrameworkTasks(null, "alpha")).toEqual([]);
});

test("limits the framework preview to ten running tasks", () => {
  const running = Array.from({ length: 12 }, (_value, index) => ({ id: `running-${index}`, state: "TASK_RUNNING" }));
  const staging = { id: "staging", state: "TASK_STAGING" };
  const starting = { id: "starting", state: "TASK_STARTING" };
  const tasks = [{ id: "failed", state: "TASK_FAILED" }, ...running, staging, starting, { id: "finished", state: "TASK_FINISHED" }];
  expect(frameworkTaskPreview(tasks)).toEqual(running.slice(0, 10));
  expect(frameworkTaskPreview([staging, starting])).toEqual([staging, starting]);
});

test("only accepts HTTP framework Web UI links", () => {
  expect(frameworkWebUiUrl("https://framework.example:10000")).toBe("https://framework.example:10000/");
  expect(frameworkWebUiUrl("javascript:alert(1)")).toBeNull();
  expect(frameworkWebUiUrl("not a URL")).toBeNull();
});

test("keeps verbose framework collections in advanced details", () => {
  const tasks = [{ id: "task-1" }];
  expect(frameworkAdvancedDetails({ tasks, offer_constraints: { role: "batch" } })).toMatchObject({
    tasks,
    completed_tasks: [],
    offer_constraints: { role: "batch" },
  });
});
