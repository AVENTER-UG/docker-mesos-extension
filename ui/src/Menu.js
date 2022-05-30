import { useState } from 'react';
import { Card, CardHeader, CardContent, IconButton, Tooltip } from "@mui/material";
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import MesosTasksIcon from '@mui/icons-material/Apps';
import MesosFrameworksIcon from '@mui/icons-material/AutoAwesomeMotion';
import Tasks from "./Tasks";
import Frameworks from "./Frameworks";
import ClusterInfo from "./ClusterInfo";

export default function MainMenu() {
  const [tasks, setTasks] = useState(false);  
  const [frameworks, setFrameworks] = useState(false);  
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    setExpanded(!expanded);
  }    

  const showTasks = () => {
    setTasks(!tasks);
    setFrameworks(false);
  };

  const showFrameworks = () => {
    setTasks(false);
    setFrameworks(!frameworks);
  };

  
  return (
    <>
      <Card>
        <CardHeader
          action={
            <>
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
    </>
  );
}
