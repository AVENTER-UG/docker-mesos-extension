import React, { act } from "react";
import { createRoot } from "react-dom/client";
import FrameworkDetailsDialog from "./FrameworkDetailsDialog";

jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const react = jest.requireActual("react");
  return {
    ...actual,
    Dialog: ({ open, children }) => open ? react.createElement("div", { "data-testid": "dialog" }, children) : null,
    DialogTitle: ({ children }) => react.createElement("div", null, children),
  };
});

jest.mock("../features/tasks/TasksTable", () => ({ tasks, title, showFrameworkId, pageSize }) => (
  <div data-testid="framework-tasks" data-title={title} data-framework-id={String(showFrameworkId)} data-page-size={String(pageSize || "")}>
    {tasks.map((task) => task.id).join(",")}
  </div>
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

function frameworkFixture() {
  return {
    id: "framework-1",
    name: "Synthetic framework",
    tasks: Array.from({ length: 12 }, (_value, index) => ({
      id: `running-${index}`,
      name: index === 11 ? "Needle task" : `Task ${index}`,
      state: "TASK_RUNNING",
    })),
    unreachable_tasks: [{ id: "unreachable-task", name: "Needle unreachable", state: "TASK_UNREACHABLE" }],
    completed_tasks: [{ id: "finished-task", name: "Finished", state: "TASK_FINISHED" }],
  };
}

test("paginates running tasks by ten without the redundant framework ID", () => {
  act(() => {
    root.render(<FrameworkDetailsDialog open onClose={() => {}} framework={frameworkFixture()} />);
  });

  const preview = container.querySelector('[data-testid="framework-tasks"]');
  expect(preview?.dataset.title).toBe("Running tasks (12)");
  expect(preview?.dataset.frameworkId).toBe("false");
  expect(preview?.dataset.pageSize).toBe("10");
  expect(preview?.textContent).toContain("running-0");
  expect(preview?.textContent).toContain("running-9");
  expect(preview?.textContent).toContain("running-10");
  expect(preview?.textContent).not.toContain("finished-task");
  expect(preview?.parentElement?.style.overflowY).toBe("");
});

test("opens the complete task list and searches name or ID across all states", () => {
  act(() => {
    root.render(<FrameworkDetailsDialog open onClose={() => {}} framework={frameworkFixture()} />);
  });

  const viewAll = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "View all tasks");
  act(() => viewAll.dispatchEvent(new MouseEvent("click", { bubbles: true })));

  let tables = container.querySelectorAll('[data-testid="framework-tasks"]');
  expect(tables).toHaveLength(2);
  expect(tables[1].dataset.title).toBe("All tasks (14)");
  expect(tables[1].dataset.frameworkId).toBe("false");
  expect(tables[1].textContent).toContain("finished-task");
  expect(tables[1].textContent).toContain("unreachable-task");

  const search = container.querySelector('input[aria-label="Search all framework tasks"]');
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(search, "needle");
    search.dispatchEvent(new Event("input", { bubbles: true }));
  });

  tables = container.querySelectorAll('[data-testid="framework-tasks"]');
  expect(tables[1].dataset.title).toBe("All tasks (2 of 14)");
  expect(tables[1].textContent).toContain("running-11");
  expect(tables[1].textContent).toContain("unreachable-task");
  expect(tables[1].textContent).not.toContain("finished-task");
});
