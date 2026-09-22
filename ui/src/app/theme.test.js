import {
  COLOR_MODE_STORAGE_KEY,
  createClusterTheme,
  getStoredColorMode,
  persistColorMode,
} from "./theme";

function storageWith(value) {
  return {
    getItem: jest.fn(() => value),
    setItem: jest.fn(),
  };
}

test("uses only valid persisted color modes and otherwise defaults to dark", () => {
  expect(getStoredColorMode(storageWith("light"))).toBe("light");
  expect(getStoredColorMode(storageWith("dark"))).toBe("dark");
  expect(getStoredColorMode(storageWith("sepia"))).toBe("dark");
  expect(getStoredColorMode(storageWith(null))).toBe("dark");
});

test("storage failures do not prevent the UI from starting", () => {
  const blocked = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
  };
  expect(getStoredColorMode(blocked)).toBe("dark");
  expect(persistColorMode("light", blocked)).toBe(false);
});

test("persists the selected mode under the ClusterD key", () => {
  const storage = storageWith(null);
  expect(persistColorMode("light", storage)).toBe(true);
  expect(storage.setItem).toHaveBeenCalledWith(COLOR_MODE_STORAGE_KEY, "light");
  expect(persistColorMode("invalid", storage)).toBe(false);
});

test("creates distinct readable light and dark palettes with ClusterD accents", () => {
  const dark = createClusterTheme("dark");
  const light = createClusterTheme("light");
  expect(dark.palette.mode).toBe("dark");
  expect(dark.palette.background.default).toBe("#080b14");
  expect(light.palette.mode).toBe("light");
  expect(light.palette.background.paper).toBe("#ffffff");
  expect(light.palette.primary.main).toBe("#3570e9");
});
