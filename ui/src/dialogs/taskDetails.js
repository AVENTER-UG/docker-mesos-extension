import { agentSandboxEndpoint } from "../logs/logApi";

export function formatTaskTimestamp(timestamp) {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) return "—";
  return new Date(value * 1000).toLocaleString();
}

export function normalizeTaskRoles(role) {
  if (Array.isArray(role)) return role.length ? role.join(", ") : "—";
  return role || "—";
}

export function formatTaskResource(name, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (name === "mem" || name === "disk") {
    const amount = Number(value);
    if (amount > 1000) {
      const gib = amount / 1024;
      if (gib > 1000) return `${(gib / 1024).toFixed(1)} TiB`;
      return `${gib.toFixed(1)} GiB`;
    }
    return `${amount.toLocaleString()} MiB`;
  }
  return String(value);
}

export function sortTaskStatuses(statuses = []) {
  return [...statuses].sort((left, right) => (Number(left.timestamp) || 0) - (Number(right.timestamp) || 0));
}

export function taskHealth(task) {
  const latest = task?.statuses?.at(-1);
  if (latest?.healthy === true) return "Healthy";
  if (latest?.healthy === false) return "Unhealthy";
  return "—";
}

export function taskHost(task) {
  return task?._agent?.hostname || task?.hostname || "—";
}

export function taskExecutorId(task) {
  return task?.executor_id || "—";
}

export function executorNameFromState(task, state) {
  if (!task?.slave_id || !state) return null;

  const frameworks = [
    ...(state.frameworks || []),
    ...(state.completed_frameworks || []),
  ];

  const framework = frameworks.find((item) => String(item.id) === String(task.framework_id));
  if (!framework) return null;

  const executors = [
    ...(framework.executors || []),
    ...(framework.completed_executors || []),
  ];

  const executorId = task.executor_id || task.id;
  const executor = executors.find((item) => String(item.id) === String(executorId));

  return executor?.name || null;
}

export function truncateExecutorName(name) {
  if (!name) return name;
  return name.length > 23 ? `${name.substring(0, 23)}…` : name;
}

function indexAgents(agents) {
  return new Map(
    (Array.isArray(agents) ? agents : []).map((agent) => [agent.id, agent]),
  );
}

function attachIndexedAgents(tasks, agentsById) {
  return (Array.isArray(tasks) ? tasks : []).map((task) => ({
    ...task,
    _agent: agentsById.get(task?.slave_id) || null,
  }));
}

export function attachAgentsToTasks(tasks, agents) {
  return attachIndexedAgents(tasks, indexAgents(agents));
}

export function attachAgentsToFramework(framework, agents) {
  const value = framework || {};
  const agentsById = indexAgents(agents);
  return {
    ...value,
    tasks: attachIndexedAgents(value.tasks, agentsById),
    unreachable_tasks: attachIndexedAgents(value.unreachable_tasks, agentsById),
    completed_tasks: attachIndexedAgents(value.completed_tasks, agentsById),
  };
}

export function taskSandboxHref(task) {
  const agentId = task?.slave_id;
  const frameworkId = task?.framework_id;
  const taskId = task?.id;
  if (!agentId || !frameworkId || !taskId) return null;

  const executorId = task.executor_id || taskId;
  const encode = (value) => encodeURIComponent(String(value));
  if (!task._agent) return null;
  return agentSandboxEndpoint(task._agent, `#/agents/${encode(agentId)}/frameworks/${encode(frameworkId)}/executors/${encode(executorId)}/tasks/${encode(taskId)}/browse`);
}

export function frameworkHref(frameworkId) {
  if (!frameworkId) return null;
  return `#/frameworks/${encodeURIComponent(String(frameworkId))}`;
}

export function agentHref(agentId) {
  if (!agentId) return null;
  return `#/agents/${encodeURIComponent(String(agentId))}`;
}

export function taskAdvancedDetails(task) {
  const value = task || {};
  const statusContainers = (value.statuses || [])
    .filter((status) => status.container_status)
    .map((status) => ({ timestamp: status.timestamp, state: status.state, container_status: status.container_status }));

  return {
    container: value.container || null,
    discovery: value.discovery || null,
    status_containers: statusContainers,
  };
}