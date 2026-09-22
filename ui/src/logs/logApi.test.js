import {
  agentApiEndpoint,
  agentHttpEndpoint,
  agentLogCall,
  decodeLogData,
  latestTaskContainer,
  latestTaskContainerId,
  masterLogCall,
  readAgentLogTail,
  readMasterLogTail,
  tailWindow,
} from "./logApi";
import { TextDecoder } from "util";

global.TextDecoder = TextDecoder;

const encode = (value) => btoa(unescape(encodeURIComponent(value)));

test("decodes protobuf JSON bytes as UTF-8", () => {
  expect(decodeLogData(encode("Grüße\n"))).toBe("Grüße\n");
  expect(decodeLogData("")).toBe("");
});

test("calculates a bounded tail window", () => {
  expect(tailWindow(1000)).toEqual({ offset: 0, length: 1000 });
  expect(tailWindow(100000)).toEqual({ offset: 34464, length: 65536 });
  expect(tailWindow(undefined)).toEqual({ offset: 0, length: 0 });
});

test("builds development and production agent API endpoints", () => {
  const agent = { id: "agent/one", hostname: "agent-1.example", pid: "slave(1)@10.0.0.2:5051" };
  expect(agentApiEndpoint(agent, "development")).toBe("/agent-api/agent-1.example/5051/api/v1");
  expect(agentApiEndpoint(agent, "production")).toBe("//agent-1.example:5051/api/v1");
  expect(agentApiEndpoint({ hostname: "agent-1", port: 5052 }, "development")).toBe("/agent-api/agent-1/5052/api/v1");
  expect(agentApiEndpoint({ hostname: "bad/host", port: 5051 }, "development")).toBeNull();
  expect(agentApiEndpoint({ hostname: "agent-1", port: 5051 }, "production")).toBe("//agent-1:5051/api/v1");
  expect(agentHttpEndpoint(agent, "/state", "development")).toBe("/agent-api/agent-1.example/5051/state");
  expect(agentHttpEndpoint(agent, "/version", "development")).toBe("/agent-api/agent-1.example/5051/version");
  expect(agentHttpEndpoint(agent, "/files/browse", "production")).toBe("//agent-1.example:5051/files/browse");
  expect(agentHttpEndpoint(agent, "/files/read", "development")).toBe("/agent-api/agent-1.example/5051/files/read");
  expect(agentHttpEndpoint(agent, "/not-allowed", "production")).toBeNull();
});

test("extracts the latest available task container id", () => {
  expect(latestTaskContainerId({ statuses: [
    { container_status: { container_id: "first" } },
    {},
    { container_status: { container_id: { value: "latest" } } },
  ] })).toBe("latest");
  expect(latestTaskContainerId(null)).toBeNull();
});

test("preserves the complete nested task container hierarchy for exec sessions", () => {
  const container = { value: "task-container", parent: { value: "executor-container" } };
  expect(latestTaskContainer({ statuses: [{ container_status: { container_id: container } }] })).toEqual(container);
  expect(latestTaskContainer(null)).toBeNull();
});

test("creates exact READ_LOG operator calls", () => {
  expect(masterLogCall(10, 20)).toEqual({ type: "READ_LOG", read_log: { offset: 10, length: 20 } });
  expect(agentLogCall({ source: "AGENT", stdoutOffset: 1, stderrOffset: 2, length: 3 })).toEqual({
    type: "READ_LOG",
    read_log: { source: "AGENT", stdout_offset: 1, stderr_offset: 2, length: 3 },
  });
  expect(agentLogCall({ source: "CONTAINER", containerId: "container-1", length: 4 })).toEqual({
    type: "READ_LOG",
    read_log: { source: "CONTAINER", stdout_offset: 0, stderr_offset: 0, length: 4, container_id: { value: "container-1" } },
  });
  expect(agentLogCall({ source: "CONTAINER" })).toBeNull();
});

test("reads the last master log chunk after a metadata request", async () => {
  const request = jest.fn()
    .mockResolvedValueOnce({ read_log: { size: 70000, data: "" } })
    .mockResolvedValueOnce({ read_log: { size: 70000, data: encode("master tail") } });
  await expect(readMasterLogTail(request)).resolves.toEqual({ stdout: { size: 70000, offset: 4464, data: "master tail" } });
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual(masterLogCall(0, 0));
  expect(JSON.parse(request.mock.calls[1][1].body)).toEqual(masterLogCall(4464, 65536));
});

test("reads agent logs from the production agent API with a complete call body", async () => {
  const request = jest.fn().mockResolvedValue({ read_log: { stdout: { size: 0, data: "" } } });
  const agent = { hostname: "agent-1.example", port: 5051 };

  await readAgentLogTail(request, agent, "AGENT");

  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0][0]).toBe("//agent-1.example:5051/api/v1");
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual(agentLogCall({ source: "AGENT", length: 0 }));
});

test("reads independent stdout and stderr tails with one shared length", async () => {
  const request = jest.fn()
    .mockResolvedValueOnce({ read_log: { stdout: { size: 70000, data: "" }, stderr: { size: 10, data: "" } } })
    .mockResolvedValueOnce({ read_log: { stdout: { size: 70000, data: encode("out") }, stderr: { size: 10, data: encode("err") } } });
  const agent = { id: "agent-1", hostname: "agent-1", port: 5051 };
  await expect(readAgentLogTail(request, agent, "CONTAINER", "container-1")).resolves.toEqual({
    stdout: { size: 70000, offset: 4464, data: "out" },
    stderr: { size: 10, offset: 0, data: "err" },
  });
  expect(request.mock.calls[0][0]).toBe("//agent-1:5051/api/v1");
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual(agentLogCall({
    source: "CONTAINER",
    containerId: "container-1",
    length: 0,
  }));
  expect(request.mock.calls[1][0]).toBe("//agent-1:5051/api/v1");
  expect(JSON.parse(request.mock.calls[1][1].body)).toEqual(agentLogCall({
    source: "CONTAINER",
    containerId: "container-1",
    stdoutOffset: 4464,
    stderrOffset: 0,
    length: 65536,
  }));
});
