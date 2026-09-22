import { UTILIZATION_TYPES, utilizationSnapshot, utilizationValue } from "./utilization";

function number(metrics, key, fallback = 0) {
  const value = Number(metrics?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

function activeCount(items = []) {
  return items.filter((item) => item.active !== false).length;
}

function resource(metrics, name) {
  const total = number(metrics, `master/${name}_total`);
  const used = number(metrics, `master/${name}_used`);
  const metricPercent = number(metrics, `master/${name}_percent`, NaN);
  const percent = Number.isFinite(metricPercent)
    ? metricPercent * (metricPercent <= 1 ? 100 : 1)
    : total > 0
      ? (used / total) * 100
      : 0;

  return { total, used, idle: Math.max(total - used, 0), percent: Math.max(0, Math.min(percent, 100)) };
}

export function formatDashboardResource(value, kind) {
  if (kind === "CPU" || kind === "GPUs") {
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  const units = ["MiB", "GiB", "TiB"];
  let amount = Number(value) || 0;
  let unit = 0;
  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024;
    unit += 1;
  }
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${units[unit]}`;
}

export function formatUptime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function aggregateAgentUtilization(agentMetrics = []) {
  return Object.fromEntries(UTILIZATION_TYPES.map(({ name }) => {
    const values = agentMetrics
      .map((metrics) => utilizationValue(metrics, "slave", name))
      .filter((value) => value !== null);
    return [name, values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null];
  }));
}

export function deriveDashboard(summary = {}, state = {}, metrics = {}, agentUtilization = null) {
  const agentsFallback = activeCount(summary.slaves);
  const frameworksFallback = activeCount(summary.frameworks);
  const runningTasks = number(metrics, "master/tasks_running");
  const pendingTasks =
    number(metrics, "master/tasks_staging") +
    number(metrics, "master/tasks_starting") +
    number(metrics, "master/tasks_killing");

  return {
    cluster: {
      name: summary.cluster || state.cluster || "Unnamed cluster",
      hostname: summary.hostname || state.hostname || "Unknown",
      leader: state.leader || state.leader_info?.hostname || "Unknown",
      version: state.version || "Unknown",
      healthy: number(metrics, "master/elected") === 1,
      uptime: formatUptime(number(metrics, "master/uptime_secs")),
    },
    counts: {
      agents: number(metrics, "master/slaves_active", agentsFallback),
      unreachableAgents: number(metrics, "master/slaves_unreachable"),
      frameworks: number(metrics, "master/frameworks_active", frameworksFallback),
      connectedFrameworks: number(metrics, "master/frameworks_connected", frameworksFallback),
      runningTasks,
      pendingTasks,
      failedTasks: number(metrics, "master/tasks_failed"),
      finishedTasks: number(metrics, "master/tasks_finished"),
    },
    resources: {
      cpu: resource(metrics, "cpus"),
      memory: resource(metrics, "mem"),
      disk: resource(metrics, "disk"),
      gpu: resource(metrics, "gpus"),
    },
    utilization: agentUtilization || utilizationSnapshot(metrics, "slave"),
    monitoring: {
      queuedMessages: number(metrics, "master/event_queue_messages"),
      queuedHttpRequests: number(metrics, "master/event_queue_http_requests"),
      dispatches: number(metrics, "master/event_queue_dispatches"),
      outstandingOffers: number(metrics, "master/outstanding_offers"),
      droppedMessages: number(metrics, "master/dropped_messages"),
      allocatorP95: number(metrics, "allocator/mesos/allocation_run_ms/p95"),
      load1m: number(metrics, "system/load_1min"),
      load5m: number(metrics, "system/load_5min"),
    },
  };
}
