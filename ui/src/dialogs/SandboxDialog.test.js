import {
  findTaskDirectory,
  fileReadQuery,
  formatFileSize,
  breadcrumbParts,
  relativeFileName,
} from "./SandboxDialog";

test("removes the sandbox root from displayed file names", () => {
  expect(relativeFileName("/executor/task/logs/app.log", "/executor/task")).toBe("logs/app.log");
  expect(relativeFileName("/executor/task/app.log", "/executor/task")).toBe("app.log");
  expect(relativeFileName("app.log", "/executor/task")).toBe("app.log");
});

test("formats file sizes for the explorer", () => {
  expect(formatFileSize(512)).toBe("512 B");
  expect(formatFileSize(2048)).toBe("2.0 KB");
  expect(formatFileSize(null)).toBe("—");
});

test("reads files from the beginning with their full reported size", () => {
  expect(fileReadQuery("/executor/task/app.log", 1993))
    .toBe("?path=%2Fexecutor%2Ftask%2Fapp.log&offset=0&length=1993");
  expect(fileReadQuery("/executor/task/app.log"))
    .toBe("?path=%2Fexecutor%2Ftask%2Fapp.log&offset=0&length=65536");
});

test("builds the complete breadcrumb hierarchy from the sandbox root", () => {
  expect(breadcrumbParts("/executor/task", "/executor/task/logs/app")).toEqual([
    { label: "Sandbox", path: "/executor/task" },
    { label: "logs", path: "/executor/task/logs" },
    { label: "app", path: "/executor/task/logs/app" },
  ]);
});

test("uses the task sandbox directory from the agent state", () => {
  const task = { framework_id: "framework", executor_id: "executor", id: "task" };
  const state = {
    frameworks: [{
      id: "framework",
      executors: [{
        id: "executor",
        directory: "/executor",
        tasks: [{ id: "task", directory: "/executor/task" }],
      }],
    }],
  };
  expect(findTaskDirectory(state, task)).toBe("/executor/task");
});

test("falls back to the executor sandbox when the agent omits task directory", () => {
  const task = { framework_id: "framework", executor_id: "executor", id: "task" };
  const state = {
    frameworks: [{
      id: "framework",
      executors: [{ id: "executor", directory: "/executor", tasks: [{ id: "task" }] }],
    }],
  };
  expect(findTaskDirectory(state, task)).toBe("/executor");
});

test("finds an agent task when executor_id is empty", () => {
  const task = { framework_id: "framework", executor_id: "", id: "task" };
  const state = {
    frameworks: [{
      id: "framework",
      executors: [{ id: "executor", directory: "/executor", tasks: [{ id: "task" }] }],
    }],
  };
  expect(findTaskDirectory(state, task)).toBe("/executor");
});
