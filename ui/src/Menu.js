import { useState } from 'react';
import { Card, CardHeader, CardContent, IconButton, List, ListItem, ListItemText, Box, Button, Tooltip } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { EditRounded } from '@mui/icons-material';
import { LoginRounded } from '@mui/icons-material';
import { createDockerDesktopClient } from "@docker/extension-api-client";

export default function MainMenu() {
  const [expanded, setExpanded] = useState(false);  
  const ddClient = createDockerDesktopClient();   


  const handleExpand = () => {
    setExpanded(!expanded);
  }  

  const openMesosUI = () => {
    ddClient.host.openExternal("http://localhost:5050");
  }  

  const styles = {
    link: {
      color: '#00bcd4',
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          action={
            <>
              <Tooltip title='Open Mesos UI in Browser' placement='bottom-end'>
                <IconButton
                  aria-label="action"
                  onClick={openMesosUI}>
                  <LoginRounded />
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
            "Mini Mesos"
          }
        />
        <CardContent hidden={!expanded} sx={{ paddingTop: "0px" }}>
        </CardContent>
      </Card >
    </>
  );
}
