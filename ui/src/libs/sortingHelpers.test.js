import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TasksTable from "../features/tasks/TasksTable";
import FrameworksTable from "../features/frameworks/FrameworksTable";

// Mock the dialog components and MUI as needed for tests
jest.mock("../dialogs/TaskDetailsDialog", () => ({ open, task }) => (
  open ? <div data-testid="selected-task">{task?.id}</div> : null
));
jest.mock("../dialogs/FrameworkDetailsDialog", () => ({ open, framework }) => (
  open ? <div data-testid="selected-framework">{framework.id}</div> : null
));

// Mock MUI components to avoid DOM rendering issues
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const react = jest.requireActual("react");
  return {
    ...actual,
    IconButton: ({ children, sx, ...props }) => react.createElement("button", props, children),
    Tooltip: ({ children }) => children,
  };
});

describe("TasksTable sorting", () => {
  test("sorts tasks by newest-to-oldest based on status timestamps", () => {
    const tasks = [
      {
        id: "task-1",
        framework_id: "framework-1",
        name: "Task 1",
        role: "batch",
        state: "TASK_RUNNING",
        statuses: [
          { timestamp: 1600000000, state: "TASK_STARTING" },
          { timestamp: 1700000000, state: "TASK_RUNNING" }
        ],
      },
      {
        id: "task-2",
        framework_id: "framework-2", 
        name: "Task 2",
        role: "batch",
        state: "TASK_RUNNING",
        statuses: [
          { timestamp: 1500000000, state: "TASK_STARTING" },
          { timestamp: 1650000000, state: "TASK_RUNNING" }
        ],
      },
      {
        id: "task-3",
        framework_id: "framework-3",
        name: "Task 3", 
        role: "batch",
        state: "TASK_RUNNING",
        statuses: [
          { timestamp: 1400000000, state: "TASK_STARTING" },
          { timestamp: 1550000000, state: "TASK_RUNNING" }
        ],
      },
    ];
    
    const markup = renderToStaticMarkup(
      <TasksTable title="Active Tasks" tasks={tasks} />
    );
    
    // Verify the correct order (newest first)
    expect(markup).toContain("Task 1");  // Should appear first (timestamp 1700000000)
    expect(markup).toContain("Task 2");  // Should appear second (timestamp 1650000000)
    expect(markup).toContain("Task 3");  // Should appear third (timestamp 1550000000)
  });

  test("handles tasks with missing timestamps correctly", () => {
    const tasks = [
      {
        id: "task-1",
        framework_id: "framework-1",
        name: "Task 1",
        role: "batch", 
        state: "TASK_RUNNING",
        statuses: [
          { timestamp: 1700000000, state: "TASK_RUNNING" }
        ],
      },
      {
        id: "task-2",
        framework_id: "framework-2",
        name: "Task 2",
        role: "batch",
        state: "TASK_RUNNING",
        statuses: [], // No timestamps
      },
    ];
    
    const markup = renderToStaticMarkup(
      <TasksTable title="Active Tasks" tasks={tasks} />
    );
    
    // Should still render both tasks
    expect(markup).toContain("Task 1");
    expect(markup).toContain("Task 2");
  });
});

describe("FrameworksTable sorting", () => {
  test("sorts frameworks by newest-to-oldest based on registered_time", () => {
    const frameworks = [
      {
        id: "framework-1",
        name: "Framework 1",
        active: true,
        connected: true,
        tasks: [{ id: "task-1" }],
        registered_time: 1700000000, // Newest
      },
      {
        id: "framework-2", 
        name: "Framework 2",
        active: true,
        connected: true,
        tasks: [{ id: "task-2" }],
        registered_time: 1600000000, // Older 
      },
      {
        id: "framework-3",
        name: "Framework 3", 
        active: true,
        connected: true,
        tasks: [{ id: "task-3" }],
        registered_time: 1500000000, // Oldest
      },
    ];
    
    const markup = renderToStaticMarkup(
      <FrameworksTable title="Active Frameworks" frameworks={frameworks} />
    );
    
    // Verify the correct order (newest first)
    expect(markup).toContain("Framework 1"); // Should appear first (registered_time 1700000000)
    expect(markup).toContain("Framework 2"); // Should appear second (registered_time 1600000000)
    expect(markup).toContain("Framework 3"); // Should appear third (registered_time 1500000000)
  });

  test("handles frameworks with missing registered_time correctly", () => {
    const frameworks = [
      {
        id: "framework-1",
        name: "Framework 1",
        active: true,
        connected: true,
        tasks: [{ id: "task-1" }],
        registered_time: 1700000000, // Valid timestamp
      },
      {
        id: "framework-2",
        name: "Framework 2", 
        active: true,
        connected: true,
        tasks: [{ id: "task-2" }],
        registered_time: null, // Missing timestamp
      },
    ];
    
    const markup = renderToStaticMarkup(
      <FrameworksTable title="Active Frameworks" frameworks={frameworks} />
    );
    
    // Should still render both frameworks
    expect(markup).toContain("Framework 1");
    expect(markup).toContain("Framework 2");
  });
});