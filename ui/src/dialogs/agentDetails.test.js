import {
  AGENT_RESOURCE_TYPES,
  agentAdvancedDetails,
  agentResourceStats,
  attachTasksToAgents,
  formatAgentResource,
  formatAgentTimestamp,
  visibleAgentTasks,
} from "./agentDetails";

test("formats Mesos memory and disk values above 1000 MiB as GiB", () => {
  expect(formatAgentResource("mem", 1000)).toBe("1,000 MiB");
  expect(formatAgentResource("mem", 14849)).toBe("14.5 GiB");
  expect(formatAgentResource("disk", 232652)).toBe("227.2 GiB");
  expect(formatAgentResource("mem", 1024001)).toBe("1.0 TiB");
  expect(formatAgentResource("ports", "[31000-32000]")).toBe("[31000-32000]");
  expect(formatAgentResource("cpus", null)).toBe("—");
});

test("calculates available resources and allocation", () => {
  const agent = {
    resources: { cpus: 4 },
    used_resources: { cpus: 1 },
    offered_resources: { cpus: 0.5 },
  };
  expect(agentResourceStats(agent, "cpus")).toEqual({
    total: 4,
    used: 1,
    offered: 0.5,
    available: 2.5,
    allocation: 25,
  });
});

test("resource calculations are safe for zero, missing and overcommitted values", () => {
  expect(agentResourceStats(null, "mem")).toEqual({ total: 0, used: 0, offered: 0, available: 0, allocation: 0 });
  expect(agentResourceStats({ resources: { mem: 10 }, used_resources: { mem: 8 }, offered_resources: { mem: 5 } }, "mem").available).toBe(0);
});

test("interprets Mesos timestamps as seconds", () => {
  const formatted = formatAgentTimestamp(1704067200);
  expect(formatted).not.toBe("—");
  expect(formatted).not.toContain("1970");
  expect(formatAgentTimestamp(null)).toBe("—");
});

test("advanced details are null-safe", () => {
  expect(agentAdvancedDetails(null)).toMatchObject({
    offered_resources_full: [],
    reserved_resources: {},
    used_resources_full: [],
  });
});

test("attaches only current framework tasks to their agents", () => {
  const agents = attachTasksToAgents(
    [{ id: "agent-1", hostname: "agent-1.example" }, { id: "agent-2", hostname: "agent-2.example" }],
    [{
      tasks: [{ id: "active-1", slave_id: "agent-1" }, { id: "active-2", slave_id: "agent-2" }],
      unreachable_tasks: [{ id: "unreachable", slave_id: "agent-1" }],
      completed_tasks: [{ id: "completed", slave_id: "agent-1" }],
    }],
  );

  expect(agents[0]._tasks.map((task) => task.id)).toEqual(["active-1"]);
  expect(agents[0]._tasks[0]._agent).toMatchObject({ id: "agent-1", hostname: "agent-1.example" });
  expect(agents[1]._tasks.map((task) => task.id)).toEqual(["active-2"]);
  expect(attachTasksToAgents(null, null)).toEqual([]);
});

test("hides failed and finished tasks from the agent task table by default", () => {
  const running = { id: "running", state: "TASK_RUNNING" };
  const starting = { id: "starting", state: "TASK_STARTING" };
  expect(visibleAgentTasks([
    running,
    { id: "failed", state: "TASK_FAILED" },
    { id: "finished", state: "TASK_FINISHED" },
    starting,
  ])).toEqual([running, starting]);
  expect(visibleAgentTasks(null)).toEqual([]);
});

test("only includes active lifecycle states in agent task list", () => {
  const running = { id: "running", state: "TASK_RUNNING" };
  const starting = { id: "starting", state: "TASK_STARTING" };
  const staging = { id: "staging", state: "TASK_STAGING" };
  const failed = { id: "failed", state: "TASK_FAILED" };
  const finished = { id: "finished", state: "TASK_FINISHED" };

  // Active lifecycle states remain visible; terminal states do not
  expect(visibleAgentTasks([
    running,
    starting,
    staging,
    failed,
    finished,
  ])).toEqual([running, starting, staging]);

  expect(visibleAgentTasks(null)).toEqual([]);
});

test("defines CPU, memory, disk and GPU for agent resource views", () => {
  expect(AGENT_RESOURCE_TYPES.map(({ name }) => name)).toEqual(["cpus", "mem", "disk", "gpus"]);
});

test("handles GPU resources properly in agentResourceStats", () => {
  const agent = {
    resources: { gpus: 2 },
    used_resources: { gpus: 1 },
    offered_resources: { gpus: 0.5 },
  };

  expect(agentResourceStats(agent, "gpus")).toEqual({
    total: 2,
    used: 1,
    offered: 0.5,
    available: 0.5,
    allocation: 50,
  });
});

test("handles agent with no GPU resources", () => {
  const agent = {
    resources: { cpus: 4, mem: 8192 },
    used_resources: { cpus: 2, mem: 4096 },
    offered_resources: { cpus: 0.5, mem: 1024 },
  };

  expect(agentResourceStats(agent, "gpus")).toEqual({
    total: 0,
    used: 0,
    offered: 0,
    available: 0,
    allocation: 0,
  });
});