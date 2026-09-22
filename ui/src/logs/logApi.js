export const LOG_TAIL_BYTES = 64 * 1024;

export function decodeLogData(value) {
  if (!value) return "";
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

export function tailWindow(size, limit = LOG_TAIL_BYTES) {
  const total = Math.max(0, Number(size) || 0);
  const length = Math.min(total, limit);
  return { offset: total - length, length };
}

function agentPort(agent) {
  const explicit = Number(agent?.port);
  if (Number.isInteger(explicit) && explicit > 0 && explicit <= 65535) return explicit;
  const match = String(agent?.pid || "").match(/:(\d+)$/);
  const parsed = match ? Number(match[1]) : 0;
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : null;
}

export function agentApiEndpoint(agent, environment = process.env.NODE_ENV) {
  const hostname = agent?.hostname;
  const port = agentPort(agent);
  if (!hostname || !/^[A-Za-z0-9.-]+$/.test(hostname) || !port) return null;

  if (environment !== "development") {
    return `//${hostname}:${port}/api/v1`;
  }

  return `/agent-api/${encodeURIComponent(hostname)}/${port}/api/v1`;
}

const AGENT_HTTP_PATHS = new Set(["/state", "/version", "/files/browse", "/files/read", "/metrics/snapshot"]);

export function agentHttpEndpoint(agent, path, environment = process.env.NODE_ENV) {
  if (!AGENT_HTTP_PATHS.has(path)) return null;
  const hostname = agent?.hostname;
  const port = agentPort(agent);
  if (!hostname || !/^[A-Za-z0-9.-]+$/.test(hostname) || !port) return null;
  if (environment !== "development") return `//${hostname}:${port}${path}`;
  return `/agent-api/${encodeURIComponent(hostname)}/${port}${path}`;
}

export function agentSandboxEndpoint(agent, path, environment = process.env.NODE_ENV) {
  if (!/^#\/agents\/[^/]+\/frameworks\/[^/]+\/executors\/[^/]+\/tasks\/[^/]+\/browse$/.test(path)) return null;
  const hostname = agent?.hostname;
  const port = agentPort(agent);
  if (!hostname || !/^[A-Za-z0-9.-]+$/.test(hostname) || !port) return null;
  return `//${hostname}:${port}/${path}`;
}

export function latestTaskContainer(task) {
  const statuses = Array.isArray(task?.statuses) ? task.statuses : [];
  for (let index = statuses.length - 1; index >= 0; index -= 1) {
    const id = statuses[index]?.container_status?.container_id;
    if (typeof id === "string" && id) return { value: id };
    if (id?.value) return id;
  }
  return null;
}

export function latestTaskContainerId(task) {
  return latestTaskContainer(task)?.value || null;
}

export function masterLogCall(offset, length) {
  return { type: "READ_LOG", read_log: { offset, length } };
}

export function agentLogCall({ source, containerId, stdoutOffset = 0, stderrOffset = 0, length = 0 }) {
  if (source !== "AGENT" && source !== "CONTAINER") return null;
  if (source === "CONTAINER" && !containerId) return null;
  const readLog = {
    source,
    stdout_offset: stdoutOffset,
    stderr_offset: stderrOffset,
    length,
  };
  if (source === "CONTAINER") readLog.container_id = { value: containerId };
  return { type: "READ_LOG", read_log: readLog };
}

async function operatorCall(request, endpoint, body) {
  return request(endpoint, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function stream(value, offset = 0) {
  const size = Math.max(0, Number(value?.size) || 0);
  return { size, offset, data: decodeLogData(value?.data) };
}

export async function readMasterLogTail(request) {
  const metadata = await operatorCall(request, "/api/v1", masterLogCall(0, 0));
  const window = tailWindow(metadata?.read_log?.size);
  if (window.length === 0) return { stdout: stream(metadata?.read_log) };
  const response = await operatorCall(request, "/api/v1", masterLogCall(window.offset, window.length));
  return { stdout: stream(response?.read_log, window.offset) };
}

export async function readAgentLogTail(request, agent, source, containerId = null) {
  const endpoint = agentApiEndpoint(agent);
  if (!endpoint) throw new Error("The agent API endpoint is unavailable.");
  const metadata = await operatorCall(request, endpoint, agentLogCall({ source, containerId, length: 0 }));
  const stdoutWindow = tailWindow(metadata?.read_log?.stdout?.size);
  const stderrWindow = tailWindow(metadata?.read_log?.stderr?.size);
  const length = Math.max(stdoutWindow.length, stderrWindow.length);
  if (length === 0) {
    return {
      stdout: stream(metadata?.read_log?.stdout),
      ...(metadata?.read_log?.stderr ? { stderr: stream(metadata.read_log.stderr) } : {}),
    };
  }
  const response = await operatorCall(request, endpoint, agentLogCall({
    source,
    containerId,
    stdoutOffset: stdoutWindow.offset,
    stderrOffset: stderrWindow.offset,
    length,
  }));
  return {
    stdout: stream(response?.read_log?.stdout, stdoutWindow.offset),
    ...(response?.read_log?.stderr ? { stderr: stream(response.read_log.stderr, stderrWindow.offset) } : {}),
  };
}
