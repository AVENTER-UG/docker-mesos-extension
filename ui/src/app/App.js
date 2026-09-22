import React from "react";
import Menu from "./Menu";
import { AuthProvider } from "../auth/AuthContext";
import { ThemeModeProvider } from "./ThemeModeContext";
import "./App.css";

function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <Menu />
      </AuthProvider>
    </ThemeModeProvider>
  );
}

export default App;