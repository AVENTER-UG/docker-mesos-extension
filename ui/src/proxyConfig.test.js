const { getAgentProxyRoute, getMasterProxyRoute, getProxyConfig } = require("./proxyConfig");

test("defaults the development proxy to devtest with self-signed TLS support", () => {
  expect(getProxyConfig({})).toMatchObject({
    target: "http://127.0.0.1:5050",
    changeOrigin: true,
    secure: false,
  });
});

test("allows overriding the ClusterD target", () => {
  expect(getProxyConfig({ CLUSTERD_PROXY_TARGET: "http://master.example:5050/" }).target).toBe(
    "http://master.example:5050",
  );
});

test("validates and rewrites a development agent API route", () => {
  expect(getAgentProxyRoute("/agent-api/agent-1.example/5051/api/v1")).toEqual({
    target: "http://agent-1.example:5051",
    path: "/api/v1",
  });
  expect(getAgentProxyRoute("/agent-2/5052/api/v1")).toEqual({
    target: "http://agent-2:5052",
    path: "/api/v1",
  });
  expect(getAgentProxyRoute("/agent-api/agent-1.example/5051/state")).toEqual({
    target: "http://agent-1.example:5051",
    path: "/state",
  });
  expect(getAgentProxyRoute("/agent-api/agent-1.example/5051/files/browse")).toEqual({
    target: "http://agent-1.example:5051",
    path: "/files/browse",
  });
  expect(getAgentProxyRoute("/agent-api/agent-1.example/5051/version")).toEqual({
    target: "http://agent-1.example:5051",
    path: "/version",
  });
  expect(getAgentProxyRoute("/agent-api/agent-1.example/5051/version?cacheBust=1")).toEqual({
    target: "http://agent-1.example:5051",
    path: "/version",
  });

  expect(getAgentProxyRoute("/agent-api/agent-1.example/5051/metrics/snapshot")).toEqual({
    target: "http://agent-1.example:5051",
    path: "/metrics/snapshot",
  });
});

test("rewrites a development master metrics route", () => {
  expect(getMasterProxyRoute("/master-api/master-1.example/5050/metrics/snapshot")).toEqual({
    target: "http://master-1.example:5050",
    path: "/metrics/snapshot",
  });
});
test("rejects unsafe or malformed agent proxy targets", () => {
  expect(getAgentProxyRoute("/agent-api/bad%2Fhost/5051/api/v1")).toBeNull();
  expect(getAgentProxyRoute("/agent-api/agent/99999/api/v1")).toBeNull();
  expect(getAgentProxyRoute("/agent-api/agent/5051/not-allowed")).toBeNull();
});
