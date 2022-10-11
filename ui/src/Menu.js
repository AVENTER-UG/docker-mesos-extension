import { useState } from 'react';
import { Box, Tabs, Tab } from "@mui/material";
import Tasks from "./Tasks";
import Agents from "./Agents";
import Home from "./Home";
import Frameworks from "./Frameworks";
import ClusterInfo from "./ClusterInfo";

export default function MainMenu() {

  const [tabValue, setTabValue] = useState(0);

  const tabStyle = {
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 600
  };

  const handleTabsChange = (event, value) => {
    setTabValue(value);
  };

  return (

    <>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>

        <Tabs value={tabValue} onChange={handleTabsChange}>
          <Tab label="Home" value={0} sx={tabStyle} />
          <Tab label="Tasks" value={1} sx={tabStyle} />
          <Tab label="Frameworks" value={2} sx={tabStyle} />
          <Tab label="Agents" value={3} sx={tabStyle} />
          <Tab label="Details" value={4} sx={tabStyle} />
        </Tabs>

      </Box>

      {tabValue === 0 && <Home />}
      {tabValue === 1 && <Tasks />}
      {tabValue === 2 && <Frameworks />}
      {tabValue === 3 && <Agents />}
      {tabValue === 4 && <ClusterInfo />}

    </>

  );

}
