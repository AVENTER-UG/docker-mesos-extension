import React, { act } from "react";
import { createRoot } from "react-dom/client";
import TaskShellDialog from "./TaskShellDialog";
import { launchTaskShell, readProcessIOStream, sendTaskShellInput } from "./taskExecApi";

jest.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ authHeader: "Basic synthetic" }),
}));

jest.mock("./taskExecApi", () => {
  const actual = jest.requireActual("./taskExecApi");
  return {
    ...actual,
    launchTaskShell: jest.fn().mockResolvedValue({ body: {} }),
    readProcessIOStream: jest.fn().mockImplementation(async (_body, onOutput) => {
      onOutput({ stream: "stdout", data: "synthetic-shell-output" });
    }),
    sendTaskShellInput: jest.fn().mockResolvedValue({ ok: true }),
  };
});

jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const react = jest.requireActual("react");
  return {
    ...actual,
    Dialog: ({ open, children }) => open ? react.createElement("div", null, children) : null,
    DialogTitle: ({ children }) => react.createElement("div", null, children),
  };
});

let container;
let root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  global.fetch = jest.fn();
  Object.defineProperty(global, "crypto", {
    configurable: true,
    value: { randomUUID: jest.fn(() => "synthetic-uuid") },
  });
  launchTaskShell.mockResolvedValue({ body: {} });
  readProcessIOStream.mockImplementation(async (_body, onOutput) => {
    onOutput({ stream: "stdout", data: "synthetic-shell-output" });
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  jest.clearAllMocks();
});

test("opens an authenticated shell session and renders streamed output", async () => {
  const task = {
    id: "task-1",
    name: "Synthetic task",
    state: "TASK_RUNNING",
    _agent: { hostname: "agent-1.example", port: 5051 },
    statuses: [{ container_status: { container_id: { value: "task-container" } } }],
  };

  await act(async () => {
    root.render(<TaskShellDialog open task={task} onClose={() => {}} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  expect(launchTaskShell).toHaveBeenCalledWith(
    global.fetch,
    "//agent-1.example:5051/api/v1",
    "Basic synthetic",
    { value: "webui-shell-synthetic-uuid", parent: { value: "task-container" } },
    expect.anything(),
    "/bin/sh",
  );
  expect(readProcessIOStream).toHaveBeenCalled();
  expect(sendTaskShellInput).toHaveBeenCalledWith(
    global.fetch,
    "//agent-1.example:5051/api/v1",
    "Basic synthetic",
    { value: "webui-shell-synthetic-uuid", parent: { value: "task-container" } },
    "printf 'ClusterD task shell ready\\n'\n",
    expect.anything(),
  );
  expect(container.textContent).toContain("Task shell");
  expect(container.textContent).toContain("synthetic-shell-output");
});

test("closes from the title bar close button", () => {
  const onClose = jest.fn();
  const task = {
    id: "task-1",
    _agent: { hostname: "agent-1.example", port: 5051 },
    statuses: [{ container_status: { container_id: { value: "task-container" } } }],
  };

  act(() => {
    root.render(<TaskShellDialog open task={task} onClose={onClose} />);
  });

  container.querySelector('[aria-label="Close task shell"]').click();

  expect(onClose).toHaveBeenCalledTimes(1);
});
