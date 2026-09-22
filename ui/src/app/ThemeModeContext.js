import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { createClusterTheme, getDesktopColorMode, getStoredColorMode, persistColorMode } from "./theme";

const ThemeModeContext = createContext(null);

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => getDesktopColorMode() || getStoredColorMode());
  const theme = useMemo(() => createClusterTheme(mode), [mode]);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateFromDesktop = (event) => setMode(event.matches ? "dark" : "light");
    mediaQuery.addEventListener?.("change", updateFromDesktop);
    mediaQuery.addListener?.(updateFromDesktop);
    return () => {
      mediaQuery.removeEventListener?.("change", updateFromDesktop);
      mediaQuery.removeListener?.(updateFromDesktop);
    };
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.colorMode = mode;
    persistColorMode(mode);
  }, [mode]);

  const value = useMemo(() => ({
    mode,
    setMode,
    toggleMode: () => setMode((current) => current === "dark" ? "light" : "dark"),
  }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) throw new Error("useThemeMode must be used inside ThemeModeProvider");
  return context;
}
