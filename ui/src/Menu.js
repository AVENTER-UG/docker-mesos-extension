import { useState } from 'react';
import { Card, CardHeader, CardContent, IconButton, Tooltip } from "@mui/material";
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import MesosTasksIcon from '@mui/icons-material/Apps';
import MesosFrameworksIcon from '@mui/icons-material/AutoAwesomeMotion';
import Tasks from "./Tasks";
import Frameworks from "./Frameworks";

export default function MainMenu() {
  const [tasks, setTasks] = useState(false);  
  const [frameworks, setFrameworks] = useState(false);  
  
  return (
    <>
      <Card>
        <CardHeader
          action={
            <>
              <Tooltip title="Show Tasks" placement='bottom-end' >
                <IconButton onClick={() => setTasks(!tasks)}>
                  <MesosTasksIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Show Frameworks" placement='bottom-end' >
                <IconButton onClick={() => setFrameworks(!frameworks)}>
                  <MesosFrameworksIcon />
                </IconButton>
              </Tooltip>
            </>
          }
          title={
            "Mini Cluster"
          }
        />
      </Card >    
     {frameworks && <Frameworks />}
     {tasks && <Tasks />}
    </>
  );
}
