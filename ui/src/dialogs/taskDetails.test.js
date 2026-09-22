import {
  attachAgentsToFramework,
  attachAgentsToTasks,
  agentHref,
  frameworkHref,
  formatTaskResource,
  formatTaskTimestamp,
  normalizeTaskRoles,
  sortTaskStatuses,
  taskAdvancedDetails,
  taskHealth,
  taskHost,
  taskExecutorId,
  executorNameFromState,
  truncateExecutorName,
  taskSandboxHref,
} from "./taskDetails";

test("formats Mesos resources without treating MiB values as bytes", () => {
  expect(formatTaskResource("mem", 2000)).toBe("2.0 GiB");
  expect(formatTaskResource("mem", 1024001)).toBe("1.0 TiB");
  expect(formatTaskResource("disk", 1000)).toBe("1,000 MiB");
  expect(formatTaskResource("ports", "[31002-31003]")).toBe("[31002-31003]");
});

test("normalizes missing fields and task roles", () => {
  expect(formatTaskTimestamp(undefined)).toBe("—");
  expect(normalizeTaskRoles(["m3s", "production"])).toBe("m3s, production");
  expect(normalizeTaskRoles("m3s")).toBe("m3s");
  expect(taskHealth({ statuses: [{ healthy: false }] })).toBe("Unhealthy");
});

test("resolves the task host from its attached agent", () => {
  expect(taskHost({ _agent: { hostname: "agent-1.example" }, hostname: "legacy.example" })).toBe("agent-1.example");
  expect(taskHost({ hostname: "legacy.example" })).toBe("legacy.example");
  expect(taskHost(null)).toBe("—");
});

test("does not use the task id as an executor id when Mesos omits it", () => {
  expect(taskExecutorId({ id: "task" })).toBe("—");
  expect(taskExecutorId({ id: "task", executor_id: "executor" })).toBe("executor");
  expect(taskExecutorId(null)).toBe("—");
});

test("finds and truncates an executor name from agent state", () => {
  const task = { id: "task-1", slave_id: "agent-1", framework_id: "framework-1", executor_id: "executor-1" };
  const state = {
    frameworks: [{
      id: "framework-1",
      executors: [{ id: "executor-1", name: "A very long executor name for Mesos" }],
    }],
  };

  expect(executorNameFromState(task, state)).toBe("A very long executor name for Mesos");
  expect(truncateExecutorName(executorNameFromState(task, state))).toBe("A very long executor na…");
  expect(executorNameFromState({ ...task, executor_id: "" }, {
    frameworks: [{ id: "framework-1", executors: [{ id: "task-1", name: "Command executor" }] }],
  })).toBe("Command executor");
});

test("attaches Mesos agents to tasks by slave id", () => {
  expect(attachAgentsToTasks(
    [{ id: "task-1", slave_id: "agent-1" }, { id: "task-2", slave_id: "missing" }],
    [{ id: "agent-1", hostname: "agent-1.example" }],
  )).toEqual([
    { id: "task-1", slave_id: "agent-1", _agent: { id: "agent-1", hostname: "agent-1.example" } },
    { id: "task-2", slave_id: "missing", _agent: null },
  ]);
  expect(attachAgentsToTasks(null, null)).toEqual([]);
});

test("attaches agents to every framework task collection", () => {
  const framework = attachAgentsToFramework({
    id: "framework-1",
    tasks: [{ id: "active", slave_id: "agent-1" }],
    unreachable_tasks: [{ id: "unreachable", slave_id: "agent-1" }],
    completed_tasks: [{ id: "completed", slave_id: "agent-1" }],
  }, [{ id: "agent-1", hostname: "agent-1.example" }]);

  expect(framework.id).toBe("framework-1");
  expect(framework.tasks[0]._agent.hostname).toBe("agent-1.example");
  expect(framework.unreachable_tasks[0]._agent.hostname).toBe("agent-1.example");
  expect(framework.completed_tasks[0]._agent.hostname).toBe("agent-1.example");
});

test("sorts status history chronologically without mutating the source", () => {
  const statuses = [{ state: "TASK_RUNNING", timestamp: 20 }, { state: "TASK_STAGING", timestamp: 10 }];
  expect(sortTaskStatuses(statuses).map((status) => status.state)).toEqual(["TASK_STAGING", "TASK_RUNNING"]);
  expect(statuses[0].state).toBe("TASK_RUNNING");
});

test("collects nested container status for the advanced section", () => {
  expect(taskAdvancedDetails({ statuses: [{ state: "TASK_RUNNING", timestamp: 20, container_status: { network_infos: [] } }] }))
    .toMatchObject({ status_containers: [{ state: "TASK_RUNNING", container_status: { network_infos: [] } }] });
  expect(taskAdvancedDetails(null)).toEqual({ container: null, discovery: null, status_containers: [] });
});

test("builds the sandbox link with an explicit executor id", () => {
  expect(taskSandboxHref({
    slave_id: "agent-1",
    framework_id: "framework-1",
    executor_id: "executor-1",
    id: "task-1",
    _agent: { hostname: "agent-1.example", pid: "slave@agent-1.example:5051" },
  })).toBe("//agent-1.example:5051/#/agents/agent-1/frameworks/framework-1/executors/executor-1/tasks/task-1/browse");
});

test("uses the task id for a default executor when executor_id is empty", () => {
  expect(taskSandboxHref({
    slave_id: "agent/1",
    framework_id: "framework 1",
    executor_id: "",
    id: "task#1",
    _agent: { hostname: "agent-1.example", pid: "slave@agent-1.example:5051" },
  })).toBe("//agent-1.example:5051/#/agents/agent%2F1/frameworks/framework%201/executors/task%231/tasks/task%231/browse");
});

test("builds encoded framework and agent detail links", () => {
  expect(frameworkHref("framework 1")).toBe("#/frameworks/framework%201");
  expect(agentHref("agent/1")).toBe("#/agents/agent%2F1");
  expect(frameworkHref(null)).toBeNull();
  expect(agentHref("")).toBeNull();
});

test("does not build a sandbox link without all required identifiers", () => {
  expect(taskSandboxHref(null)).toBeNull();
  expect(taskSandboxHref({ slave_id: "agent", framework_id: "framework", id: "" })).toBeNull();
});
