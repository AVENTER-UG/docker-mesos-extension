export const UTILIZATION_TYPES = [
  { name: "cpus", label: "CPU", shortLabel: "CPU" },
  { name: "mem", label: "MEM", shortLabel: "MEM" },
  { name: "disk", label: "DISK", shortLabel: "DISK" },
  { name: "gpus", label: "GPU", shortLabel: "GPU" },
  { name: "load", label: "Load", shortLabel: "LOAD" },
];

export function normalizeMetricsResponse(response) {
  const metrics = response?.get_metrics?.metrics ?? response?.metrics;
  if (Array.isArray(metrics)) {
    return Object.fromEntries(metrics
      .filter((entry) => entry && typeof entry.name === "string")
      .map((entry) => [entry.name, entry.value]));
  }
  if (metrics && typeof metrics === "object") return metrics;
  if (Array.isArray(response)) {
    return Object.fromEntries(response
      .filter((entry) => entry && typeof entry.name === "string")
      .map((entry) => [entry.name, entry.value]));
  }
  return response && typeof response === "object" ? response : {};
}

export function utilizationValue(metrics, prefix, name) {
  const value = Number(metrics?.[`${prefix}/${name}_utilization`]);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null;
}

export function utilizationSnapshot(metrics, prefix) {
  return Object.fromEntries(UTILIZATION_TYPES.map(({ name }) => [name, utilizationValue(metrics, prefix, name)]));
}

export function utilizationColor(value) {
  if (value === null) return "action.disabled";
  if (value >= 90) return "error.main";
  if (value >= 70) return "warning.main";
  return "success.main";
}
