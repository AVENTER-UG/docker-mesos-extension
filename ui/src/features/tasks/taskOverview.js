const RESOURCE_TYPES = [
  { name: "cpus", label: "CPU", unit: "cores" },
  { name: "mem", label: "Memory", unit: "MiB" },
  { name: "disk", label: "Disk", unit: "MiB" },
  { name: "gpus", label: "GPUs", unit: "" },
];

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function formatOverviewResource(name, value) {
  const amount = finiteNumber(value);
  if (name === "mem" || name === "disk") {
    if (amount >= 1024 * 1024) return `${(amount / (1024 * 1024)).toFixed(1)} TiB`;
    if (amount >= 1024) return `${(amount / 1024).toFixed(1)} GiB`;
    return `${amount.toLocaleString()} MiB`;
  }
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 1 })}${name === "cpus" ? " cores" : ""}`;
}

export function deriveTaskOverview({ active = [], unreachable = [], completed = [], agents = [] } = {}) {
  const resources = Object.fromEntries(RESOURCE_TYPES.map(({ name }) => {
    const totals = (Array.isArray(agents) ? agents : []).filter((agent) => agent?.active !== false).reduce((result, agent) => {
      result.total += finiteNumber(agent?.resources?.[name]);
      result.used += finiteNumber(agent?.used_resources?.[name]);
      result.offered += finiteNumber(agent?.offered_resources?.[name]);
      return result;
    }, { total: 0, used: 0, offered: 0 });
    totals.available = Math.max(totals.total - totals.used - totals.offered, 0);
    return [name, totals];
  }));

  return {
    counts: {
      active: Array.isArray(active) ? active.length : 0,
      unreachable: Array.isArray(unreachable) ? unreachable.length : 0,
      completed: Array.isArray(completed) ? completed.length : 0,
      agents: Array.isArray(agents) ? agents.filter((agent) => agent?.active !== false).length : 0,
    },
    resources,
  };
}

export { RESOURCE_TYPES };
