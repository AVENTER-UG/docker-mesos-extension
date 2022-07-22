import { useState } from 'react';
import { Card, CardHeader, CardContent, IconButton, Tooltip } from "@mui/material";
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import MesosTasksIcon from '@mui/icons-material/Apps';
import MesosFrameworksIcon from '@mui/icons-material/AutoAwesomeMotion';
import MesosAgentsIcon from '@mui/icons-material/Storage';
import HomeIcon from '@mui/icons-material/Home';
import Tasks from "./Tasks";
import Agents from "./Agents";
import Home from "./Home";
import Frameworks from "./Frameworks";
import ClusterInfo from "./ClusterInfo";

export default function MainMenu() {
  const [tasks, setTasks] = useState(false);  
  const [frameworks, setFrameworks] = useState(false);  
  const [agents, setAgents] = useState(false);  
  const [expanded, setExpanded] = useState(false);
  const [home, setHome] = useState(true);

  const handleExpand = () => {
    setExpanded(!expanded);
  }    

  const showTasks = () => {
    setTasks(!tasks);
    setFrameworks(false);
    setAgents(false);
    setHome(false);
  };

  const showFrameworks = () => {
    setTasks(false);
    setFrameworks(!frameworks);
    setAgents(false);
    setHome(false);
  };

  const showAgents = () => {
    setTasks(false);
    setFrameworks(false);
    setAgents(!agents);
    setHome(false);
  };

  const showHome = () => {
    setTasks(false);
    setFrameworks(false);
    setAgents(false);
    setHome(!home);
  };

  
  return (
    <>
      <Card>
        <CardHeader
          action={
            <>
              <Tooltip title="Home" placement='bottom-end' >
                <IconButton onClick={() => showHome()} >
                  <HomeIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Show Tasks" placement='bottom-end' >
                <IconButton onClick={() => showTasks()} >
                  <MesosTasksIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Show Frameworks" placement='bottom-end' >
                <IconButton onClick={() => showFrameworks()}>
                  <MesosFrameworksIcon />
                </IconButton>            
              </Tooltip>
              <Tooltip title="Show Agents" placement='bottom-end' >
                <IconButton onClick={() => showAgents()}>
                  <MesosAgentsIcon />
                </IconButton>            
              </Tooltip>
              <Tooltip title={expanded ? "Collapse details" : "Expand details"} placement='bottom-end' >
                <IconButton
                  onClick={handleExpand}>
                  {(expanded) && (
                    <ExpandLessRounded />
                  )}
                  {(!expanded) && (
                    <ExpandMoreRounded />
                  )}
                </IconButton>
              </Tooltip>            
            </>
          }
          title={
            "Mini Cluster"
          }
        />
        <CardContent hidden={!expanded} sx={{ paddingTop: "0px" }}>
          <ClusterInfo/>
        </CardContent>    
      </Card >    
     {frameworks && <Frameworks />}
     {tasks && <Tasks />}
     {agents && <Agents />}
     {home && <Home />}
    </>
  );
}
