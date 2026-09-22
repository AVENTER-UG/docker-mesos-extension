import React, { act } from "react";
import { createRoot } from "react-dom/client";
import TaskDetailsDialog from "./TaskDetailsDialog";

jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const react = jest.requireActual("react");
  return {
    ...actual,
    Dialog: ({ open, children }) => open ? react.createElement("div", null, children) : null,
    DialogTitle: ({ children }) => react.createElement("div", null, children),
  };
});

jest.mock("../logs/LogViewerDialog", () => () => null);
jest.mock("../shell/TaskShellDialog", () => ({ open }) => open ? <div data-testid="task-shell" /> : null);
jest.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    request: jest.fn().mockResolvedValue({ frameworks: [], completed_frameworks: [], slaves: [] }),
  }),
}));

let container;
let root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test("shows the agent hostname in task details", () => {
  act(() => {
    root.render(
      <TaskDetailsDialog
        open
        onClose={() => {}}
        task={{
          id: "task-1",
          name: "Synthetic task",
          slave_id: "agent-1",
          _agent: { id: "agent-1", hostname: "agent-1.example" },
        }}
      />
    );
  });

  expect(container.textContent).toContain("Host");
  expect(container.textContent).toContain("agent-1.example");
});

test("offers a task shell when an agent and nested container are available", () => {
  act(() => {
    root.render(
      <TaskDetailsDialog
        open
        onClose={() => {}}
        task={{
          id: "task-1",
          name: "Synthetic task",
          _agent: { hostname: "agent-1.example", port: 5051 },
          statuses: [{ container_status: { container_id: { value: "task-container" } } }],
        }}
      />
    );
  });

  const shellButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Open task shell");
  expect(shellButton).not.toBeNull();
  expect(shellButton.disabled).toBe(false);
  act(() => shellButton.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(container.querySelector('[data-testid="task-shell"]')).not.toBeNull();
});

test("shows clickable links for Framework ID and Agent ID when they exist", () => {
  act(() => {
    root.render(
      <TaskDetailsDialog
        open
        onClose={() => {}}
        task={{
          id: "task-1",
          name: "Synthetic task",
          framework_id: "framework-123",
          slave_id: "agent-456",
          _agent: { id: "agent-456", hostname: "agent-456.example" },
        }}
      />
    );
  });

  // Should contain Framework ID with a link
  expect(container.innerHTML).toContain('href="#/frameworks/framework-123"');

  // Should contain Agent ID with a link
  expect(container.innerHTML).toContain('href="#/agents/agent-456"');
});

test("does not navigate on hash when clicking framework or agent ID links in task details", () => {
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  // Mock history methods to detect navigation
  const pushStateMock = jest.fn();
  const replaceStateMock = jest.fn();

  window.history.pushState = pushStateMock;
  window.history.replaceState = replaceStateMock;

  act(() => {
    root.render(
      <TaskDetailsDialog
        open
        onClose={() => {}}
        task={{
          id: "task-1",
          name: "Synthetic task",
          framework_id: "framework-123",
          slave_id: "agent-456",
          _agent: { id: "agent-456", hostname: "agent-456.example" },
        }}
      />
    );
  });

  // Test framework ID link click (should not call pushState/replaceState)
  const frameworkLink = Array.from(container.querySelectorAll("a")).find((link) => link.textContent === "framework-123");
  if (frameworkLink) {
    act(() => frameworkLink.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  }

  // Test agent ID link click (should not call pushState/replaceState)
  const agentLink = Array.from(container.querySelectorAll("a")).find((link) => link.textContent === "agent-456");
  if (agentLink) {
    act(() => agentLink.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  }

  // The links should not have triggered any navigation
  expect(pushStateMock).not.toHaveBeenCalled();
  expect(replaceStateMock).not.toHaveBeenCalled();

  // Restore original history methods
  window.history.pushState = originalPushState;
  window.history.replaceState = originalReplaceState;
});