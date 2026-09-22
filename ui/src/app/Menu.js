import { useEffect, useState } from "react";
import { AppBar, Box, Container, Link, Stack, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import Tasks from "../features/tasks/Tasks";
import Agents from "../features/agent/Agents";
import Home from "../Home";
import Frameworks from "../features/frameworks/Frameworks";
import ClusterInfo from "../ClusterInfo";
import Offers from "../features/offers/Offers";
import Logo from "./Logo";
import { useAuth } from "../auth/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { hashFromTabValue, tabValueFromHash } from "./hashNavigation";

const WEBUI_VERSION = process.env.REACT_APP_VERSION || "development";

function Footer() {
  return (
    <Box component="footer" className="app-footer">
      <Typography variant="body2" component="span" fontWeight={700}>ClusterD WebUI</Typography>
      <Typography variant="body2" component="span">v{WEBUI_VERSION}</Typography>
      <Link href="https://github.com/m3scluster/clusterd-webui/blob/master/LICENSE" target="_blank" rel="noreferrer">EUPL 1.2</Link>
      <Typography variant="body2" component="span">© 2026 AVENTER</Typography>
      <Link href="https://github.com/m3scluster/clusterd-webui" target="_blank" rel="noreferrer">GitHub repository</Link>
      <Typography variant="body2" component="span">Apache Mesos® © Apache Software Foundation</Typography>
    </Box>
  );
}

export default function MainMenu() {
  const [tabValue, setTabValue] = useState(() => tabValueFromHash(window.location.hash));
  const { principal } = useAuth();

  useEffect(() => {
    const updateActiveTabFromHash = () => setTabValue(tabValueFromHash(window.location.hash));
    window.addEventListener("hashchange", updateActiveTabFromHash);
    return () => window.removeEventListener("hashchange", updateActiveTabFromHash);
  }, []);

  const handleTabsChange = (event, value) => {
    setTabValue(value);
  };

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Logo />
          <Box flexGrow={1} />
          <Stack direction="row" spacing={2} alignItems="center">
            <ThemeToggle />
            {principal && <Typography variant="body2">{principal}</Typography>}
          </Stack>
        </Toolbar>
        <Tabs
          value={tabValue}
          onChange={handleTabsChange}
          textColor="inherit"
          indicatorColor="secondary"
          variant="scrollable"
          scrollButtons="auto"
          className="main-tabs"
        >
          <Tab label="Overview" value={0} href={hashFromTabValue(0)} />
          <Tab label="Tasks" value={1} href={hashFromTabValue(1)} />
          <Tab label="Frameworks" value={2} href={hashFromTabValue(2)} />
          <Tab label="Offers" value={5} href={hashFromTabValue(5)} />          
          <Tab label="Agents" value={3} href={hashFromTabValue(3)} />
          <Tab label="Manager details" value={4} href={hashFromTabValue(4)} />        
        </Tabs>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
        {tabValue === 0 && <Home />}
        {tabValue === 1 && <Tasks />}
        {tabValue === 2 && <Frameworks />}
        {tabValue === 3 && <Agents />}
        {tabValue === 4 && <ClusterInfo />}
        {tabValue === 5 && <Offers />}
      </Container>
      <Footer />
    </Box>
  );
}
