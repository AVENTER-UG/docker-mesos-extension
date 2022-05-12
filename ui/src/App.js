import CssBaseline from '@mui/material/CssBaseline';
import { DockerMuiThemeProvider } from '@docker/docker-mui-theme';
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { useState } from 'react';
import { Box } from "@mui/material";
import Logo from './Logo';
import Menu from "./Menu";
import "./App.css";


function App() {
  const [dockerInfo, setDockerInfo] = useState(null);
  const ddClient = createDockerDesktopClient();   


  return (
    <DockerMuiThemeProvider>
      <CssBaseline />
      <Logo />
      <Menu />
    </DockerMuiThemeProvider>
  );
}

export default App;
