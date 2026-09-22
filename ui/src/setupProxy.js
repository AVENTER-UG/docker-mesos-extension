const { createProxyMiddleware } = require("http-proxy-middleware");
const { getAgentProxyRoute, getMasterProxyRoute, getProxyConfig } = require("./proxyConfig");

function rewriteWithQuery(path, request, routeGetter) {
  const route = routeGetter(request.originalUrl);
  if (!route) return path;
  const query = String(request.originalUrl || "").split("?", 2)[1];
  return `${route.path}${query ? `?${query}` : ""}`;
}

module.exports = function setupProxy(app) {
  const proxy = createProxyMiddleware(getProxyConfig());
  const apiPrefixes = ["/api", "/master", "/metrics", "/frameworks", "/slaves", "/state"];
  app.use((request, response, next) => {
    const path = String(request.url || "").split("?", 1)[0];
    if (apiPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return proxy(request, response, next);
    }
    return next();
  });

  const agentProxy = createProxyMiddleware({
    target: "http://127.0.0.1:5051",
    changeOrigin: true,
    secure: false,
    logLevel: process.env.CLUSTERD_PROXY_LOG_LEVEL || "warn",
    router: (request) => getAgentProxyRoute(request.originalUrl)?.target,
    pathRewrite: (path, request) => rewriteWithQuery(path, request, getAgentProxyRoute),
  });
  app.use("/agent-api", (request, response, next) => {
    if (!getAgentProxyRoute(request.originalUrl)) {
      response.status(400).send("Invalid agent API target");
      return;
    }
    agentProxy(request, response, next);
  });

  const masterProxy = createProxyMiddleware({
    target: "http://127.0.0.1:5050",
    changeOrigin: true,
    secure: false,
    logLevel: process.env.CLUSTERD_PROXY_LOG_LEVEL || "warn",
    router: (request) => getMasterProxyRoute(request.originalUrl)?.target,
    pathRewrite: (path, request) => rewriteWithQuery(path, request, getMasterProxyRoute),
  });
  app.use("/master-api", (request, response, next) => {
    if (!getMasterProxyRoute(request.originalUrl)) {
      response.status(400).send("Invalid master API target");
      return;
    }
    masterProxy(request, response, next);
  });
};
