import { useState } from 'react';
import { Card, CardHeader, CardContent, IconButton, List, ListItem, ListItemText, Box, Button, Tooltip } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { EditRounded } from '@mui/icons-material';
import { LoginRounded } from '@mui/icons-material';

export default function CurrentContext() {
  const [expanded, setExpanded] = useState(false);  

  const handleLogin = () => {
  };  

  const handleExpand = () => {
    setExpanded(!expanded);
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
                  onClick={handleLogin}>
                  <LoginRounded />
                </IconButton>
              </Tooltip>
              <Tooltip title={expanded ? "Collapse context details" : "Expand details"} placement='bottom-end' >
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
