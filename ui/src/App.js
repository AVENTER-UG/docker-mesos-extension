import CssBaseline from '@mui/material/CssBaseline';
import { DockerMuiThemeProvider } from '@docker/docker-mui-theme';
import Logo from './Logo';
import "./App.css";


function App() {

  return (
    <DockerMuiThemeProvider>
      <CssBaseline />
      <Logo />
    </DockerMuiThemeProvider>
  );
}

export default App;
