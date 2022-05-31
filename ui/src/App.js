import CssBaseline from '@mui/material/CssBaseline';
import { DockerMuiThemeProvider } from '@docker/docker-mui-theme';
import Logo from './Logo';
import Menu from "./Menu";
import "./App.css";


function App() {
  return (
    <DockerMuiThemeProvider>
      <CssBaseline />
      <Logo />
      <Menu />
    </DockerMuiThemeProvider>
  );
}

export default App;
