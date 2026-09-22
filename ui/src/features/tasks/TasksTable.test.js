import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import TasksTable, { taskContainerizer } from "./TasksTable";

jest.mock("../../dialogs/TaskDetailsDialog", () => ({ open, task }) => (
  open ? <div data-testid="selected-task">{task?.id}</div> : null
));
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const react = jest.requireActual("react");
  return {
    ...actual,
    IconButton: ({ children, sx, ...props }) => react.createElement("button", props, children),
    Tooltip: ({ children }) => children,
  };
});

test("maps Docker and default tasks to their containerizers", () => {
  expect(taskContainerizer({ container: { type: "DOCKER" } })).toBe("DOCKER");
  expect(taskContainerizer({ container: { type: "MESOS" } })).toBe("MESOS");
  expect(taskContainerizer({})).toBe("MESOS");
});

test("shows the containerizer column and accessible type labels", () => {
  const markup = renderToStaticMarkup(
    <TasksTable
      title="Active Tasks"
      tasks={[
        { id: "docker-task", container: { type: "DOCKER" }, statuses: [] },
        { id: "mesos-task", container: { type: "MESOS" }, statuses: [] },
      ]}
    />,
  );

  expect(markup).not.toContain(">Containerizer<");
  expect(markup).toContain("DOCKER containerizer");
  expect(markup).toContain("MESOS containerizer");
});

test("omits the host column and hostname from the tasks overview", () => {
  const markup = renderToStaticMarkup(
    <TasksTable
      title="Active Tasks"
      tasks={[{
        id: "task-1",
        framework_id: "framework-1",
        name: "Synthetic task",
        role: "batch",
        state: "TASK_RUNNING",
        hostname: "synthetic-agent.example",
        statuses: [],
      }]}
    />,
  );

  expect(markup).not.toContain(">Host<");
  expect(markup).not.toContain("synthetic-agent.example");
});

test("shows framework ID column by default", () => {
  const markup = renderToStaticMarkup(
    <TasksTable
      title="Active Tasks"
      tasks={[{
        id: "task-1",
        framework_id: "framework-1",
        name: "Synthetic task",
        role: "batch",
        state: "TASK_RUNNING",
        statuses: [],
      }]}
      showFrameworkId={true}
    />,
  );

  expect(markup).toContain(">Framework ID<");
  expect(markup).toContain("framework-1");
});

test("hides framework ID column when showFrameworkId is false", () => {
  const markup = renderToStaticMarkup(
    <TasksTable
      title="Active Tasks"
      tasks={[{
        id: "task-1",
        framework_id: "framework-1",
        name: "Synthetic task",
        role: "batch",
        state: "TASK_RUNNING",
        statuses: [],
      }]}
      showFrameworkId={false}
    />,
  );

  expect(markup).not.toContain(">Framework ID<");
  expect(markup).not.toContain("framework-1");
});

test("keeps the details action and opens task details when the row is clicked", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  act(() => {
    root.render(<TasksTable title="Tasks" tasks={[{ id: "task-click", state: "TASK_RUNNING", statuses: [] }]} />);
  });

  expect(container.querySelector('[aria-label="View details for task-click"]')).not.toBeNull();
  act(() => {
    container.querySelector('tr[role="button"]').dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(container.querySelector('[data-testid="selected-task"]')?.textContent).toBe("task-click");

  act(() => root.unmount());
  container.remove();
});
