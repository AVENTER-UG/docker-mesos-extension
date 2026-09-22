import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Tasks from "./Tasks";

jest.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ request: jest.fn(), isAuthenticated: true }),
}));

jest.mock("@tanstack/react-query", () => ({
  QueryClient: function QueryClient() {},
  QueryClientProvider: ({ children }) => children,
  useQuery: () => ({
    data: {
      agents: [],
      frameworks: [{
        tasks: [{ id: "run-1", name: "Needle running", state: "TASK_RUNNING" }],
        unreachable_tasks: [{ id: "needle-unreachable", name: "Other", state: "TASK_UNREACHABLE" }],
        completed_tasks: [{ id: "done-1", name: "Needle finished", state: "TASK_FINISHED" }],
      }],
    },
    isLoading: false,
    error: null,
  }),
}));

jest.mock("./TasksTable", () => ({ tasks, title }) => (
  <div data-testid="tasks-table" data-title={title}>{tasks.map((task) => task.id).join(",")}</div>
));

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

test("searches task name or ID across active, unreachable, and completed states", () => {
  act(() => root.render(<Tasks />));

  expect(container.querySelectorAll('[data-testid="tasks-table"]')).toHaveLength(3);
  const search = container.querySelector('input[aria-label="Search tasks by name or ID"]');
  expect(search).not.toBeNull();

  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(search, "needle");
    search.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const tables = container.querySelectorAll('[data-testid="tasks-table"]');
  expect(tables[0].textContent).toBe("run-1");
  expect(tables[1].textContent).toBe("needle-unreachable");
  expect(tables[2].textContent).toBe("done-1");
});
