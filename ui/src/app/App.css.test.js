const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(path.join(__dirname, "App.css"), "utf8");

test("styles TASK_STARTING with the transitional orange task-state rule", () => {
  const orangeRules = [...css.matchAll(/([^{}]+)\{([^{}]*background-color:\s*#f4a261[^{}]*)\}/gi)];
  const transitionalRule = orangeRules.find(([, selectors]) => selectors.includes(".state-task_staging"));

  expect(transitionalRule).toBeDefined();
  expect(transitionalRule[1]).toContain(".state-task_starting");
});
