import { createTheme } from "@mui/material/styles";

export const COLOR_MODE_STORAGE_KEY = "clusterd.colorMode";
export const DEFAULT_COLOR_MODE = "dark";

export function isColorMode(value) {
  return value === "dark" || value === "light";
}

export function getStoredColorMode(storage) {
  try {
    const target = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
    const stored = target?.getItem(COLOR_MODE_STORAGE_KEY);
    return isColorMode(stored) ? stored : DEFAULT_COLOR_MODE;
  } catch (_) {
    return DEFAULT_COLOR_MODE;
  }
}

export function persistColorMode(mode, storage) {
  if (!isColorMode(mode)) return false;
  try {
    const target = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
    target?.setItem(COLOR_MODE_STORAGE_KEY, mode);
    return true;
  } catch (_) {
    return false;
  }
}

export function createClusterTheme(mode) {
  const dark = mode !== "light";
  return createTheme({
    palette: {
      mode: dark ? "dark" : "light",
      primary: { main: "#3570e9", light: "#71b7ff" },
      secondary: { main: "#ef5364" },
      background: dark
        ? { default: "#080b14", paper: "#0e1422" }
        : { default: "#f3f6fb", paper: "#ffffff" },
      text: dark
        ? { primary: "#f3f6fb", secondary: "#9aa9c1" }
        : { primary: "#111827", secondary: "#526179" },
      error: { main: "#ef5364" },
      success: { main: dark ? "#55d69b" : "#168a5b" },
      warning: { main: dark ? "#f4a261" : "#b65c12" },
      info: { main: dark ? "#4ac5d6" : "#147f91" },
      divider: dark ? "rgba(167, 191, 232, 0.14)" : "#dce5f4",
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundColor: "#080b14", color: "#f3f6fb" },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: { backgroundColor: "#080b14" },
        },
      },
    },
  });
}
