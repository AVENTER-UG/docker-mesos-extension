const EMPTY = "—";

export function frameworkRoles(framework = {}) {
  const value = framework || {};
  const source = Array.isArray(value.roles)
    ? value.roles
    : value.role
      ? [value.role]
      : [];
  return [...new Set(source.map((role) => String(role).trim()).filter(Boolean))];
}

export function normalizeFrameworkRoles(framework = {}) {
  const roles = frameworkRoles(framework);
  return roles.length ? roles.join(", ") : EMPTY;
}

export function formatFrameworkTimestamp(timestamp) {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) return EMPTY;
  return new Date(value * 1000).toLocaleString();
}

export function formatFrameworkResource(name, value) {
  if (value === null || value === undefined || value === "") return EMPTY;
  if (name === "ports") return String(value);
  const number = Number(value);
  if (!Number.isFinite(number)) return EMPTY;
  if (name === "mem" || name === "disk") {
    // Umrechnung auf GiB bei Werten >1000 MiB
    if (number > 1000) {
      const gib = number / 1024;
      if (gib > 1000) return `${(gib / 1024).toFixed(1)} TiB`;
      return `${gib.toFixed(1)} GiB`;
    }
    const formatted = number.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return `${formatted} MiB`;
  }
  return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function frameworkStatus(framework = {}) {
  const value = framework || {};
  if (value.active && value.connected) return { label: "Active", color: "success" };
  if (value.active) return { label: "Active · disconnected", color: "warning" };
  if (value.recovered) return { label: "Recovered", color: "warning" };
  if (Number(value.unregistered_time) > 0) return { label: "Unregistered", color: "default" };
  if (value.connected) return { label: "Connected · inactive", color: "info" };
  return { label: "Inactive", color: "default" };
}

export function frameworkTaskCounts(framework = {}) {
  const value = framework || {};
  const count = (value) => Array.isArray(value) ? value.length : 0;
  return {
    active: count(value.tasks),
    completed: count(value.completed_tasks),
    unreachable: count(value.unreachable_tasks),
    executors: count(value.executors),
  };
}

export function frameworkTasks(framework = {}) {
  const value = framework || {};
  const tasks = (collection) => Array.isArray(collection) ? collection : [];
  return [
    ...tasks(value.tasks),
    ...tasks(value.unreachable_tasks),
    ...tasks(value.completed_tasks),
  ];
}

export function filterFrameworkTasks(tasks, query) {
  const source = Array.isArray(tasks) ? tasks : [];
  const search = String(query || "").trim().toLowerCase();
  if (!search) return source;
  return source.filter((task) => (
    String(task?.id || "").toLowerCase().includes(search)
    || String(task?.name || "").toLowerCase().includes(search)
  ));
}

export function frameworkTaskPreview(tasks) {
  return (Array.isArray(tasks) ? tasks : [])
    .filter((task) => ["TASK_RUNNING", "TASK_STAGING", "TASK_STARTING"].includes(task?.state))
    .slice(0, 10);
}

/**
 * Filter out terminal/non-active task states from an array of tasks
 * Active tasks are only those in TASK_RUNNING state
 * @param {Array} tasks - Array of task objects with state property
 * @returns {Array} Filtered array containing only active tasks (TASK_RUNNING)
 */
export function filterActiveTasks(tasks) {
  const source = Array.isArray(tasks) ? tasks : [];
  return source.filter((task) => task?.state === "TASK_RUNNING");
}

export function frameworkWebUiUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch (_) {
    return null;
  }
}

export function frameworkAdvancedDetails(framework = {}) {
  const value = framework || {};
  return {
    tasks: value.tasks || [],
    completed_tasks: value.completed_tasks || [],
    unreachable_tasks: value.unreachable_tasks || [],
    executors: value.executors || [],
    offer_constraints: value.offer_constraints || {},
  };
}
