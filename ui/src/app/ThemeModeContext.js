import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { createClusterTheme, getStoredColorMode, persistColorMode } from "./theme";

const ThemeModeContext = createContext(null);

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => getStoredColorMode());
  const theme = useMemo(() => createClusterTheme(mode), [mode]);

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
