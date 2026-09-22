import React, { act } from "react";
import { createRoot } from "react-dom/client";
import FrameworksTable from "./FrameworksTable";

jest.mock("../../dialogs/FrameworkDetailsDialog", () => ({ open, framework }) => (
  open ? <div data-testid="selected-framework">{framework.id}</div> : null
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

test("opens framework details when its table row is clicked", () => {
  act(() => {
    root.render(
      <FrameworksTable
        title="Active Frameworks"
        frameworks={[{
          id: "framework-1",
          name: "Synthetic framework",
          active: true,
          connected: true,
          tasks: [{ id: "task-1" }],
        }]}
      />
    );
  });

  const frameworkRow = container.querySelector("tbody tr");
  act(() => {
    frameworkRow.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(container.querySelector('[data-testid="selected-framework"]')?.textContent).toBe("framework-1");
});
