const DEFAULT_TARGET = "http://127.0.0.1:5050";

function getProxyConfig(env = process.env) {
  const target = (env.CLUSTERD_PROXY_TARGET || DEFAULT_TARGET).replace(/\/$/, "");
  return {
    target,
    changeOrigin: true,
    secure: false,
    logLevel: env.CLUSTERD_PROXY_LOG_LEVEL || "warn",
  };
}

function getAgentProxyRoute(pathname) {
  const requestPath = String(pathname || "").split("?", 1)[0];
  const match = requestPath.match(/^(?:\/agent-api)?\/([^/]+)\/(\d+)(\/api\/v1|\/version|\/state|\/files\/browse|\/files\/read|\/metrics\/snapshot)$/);
  if (!match) return null;
  let hostname;
  try {
    hostname = decodeURIComponent(match[1]);
  } catch (_) {
    return null;
  }
  const port = Number(match[2]);
  if (!/^[A-Za-z0-9.-]+$/.test(hostname) || !Number.isInteger(port) || port < 1 || port > 65535) return null;

  return { target: `http://${hostname}:${port}`, path: match[3] };
}

function getMasterProxyRoute(pathname) {
  const requestPath = String(pathname || "").split("?", 1)[0];
  const match = requestPath.match(/^(?:\/master-api)?\/([^/]+)\/(\d+)(\/metrics\/snapshot)$/);
  if (!match) return null;
  let hostname;
  try { hostname = decodeURIComponent(match[1]); } catch (_) { return null; }
  const port = Number(match[2]);
  if (!/^[A-Za-z0-9.-]+$/.test(hostname) || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { target: `http://${hostname}:${port}`, path: match[3] };
}

module.exports = { DEFAULT_TARGET, getAgentProxyRoute, getMasterProxyRoute, getProxyConfig };
