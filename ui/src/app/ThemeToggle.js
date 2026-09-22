import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { IconButton, Tooltip } from "@mui/material";
import { useThemeMode } from "./ThemeModeContext";

export default function ThemeToggle({ sx }) {
  const { mode, toggleMode } = useThemeMode();
  const target = mode === "dark" ? "light" : "dark";

  return (
    <Tooltip title={`Switch to ${target} mode`}>
      <IconButton
        aria-label={`Switch to ${target} mode`}
        color="inherit"
        onClick={toggleMode}
        sx={sx}
      >
        {mode === "dark" ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}
