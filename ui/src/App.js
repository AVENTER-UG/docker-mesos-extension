import CssBaseline from '@mui/material/CssBaseline';
import { DockerMuiThemeProvider } from '@docker/docker-mui-theme';
import Logo from './Logo';
import Menu from "./Menu";
import Data from "./Data";
import "./App.css";


function App() {
  return (
    <DockerMuiThemeProvider>
      <CssBaseline />
      <Logo />
      <Menu />
      <Data />
    </DockerMuiThemeProvider>
  );
}

export default App;
