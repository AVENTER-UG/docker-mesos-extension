import { pageCountFor } from "./PaginationControls";

test("uses pages of fifteen entries", () => {
  expect(pageCountFor(0)).toBe(1);
  expect(pageCountFor(15)).toBe(1);
  expect(pageCountFor(16)).toBe(2);
  expect(pageCountFor(31)).toBe(3);
});
