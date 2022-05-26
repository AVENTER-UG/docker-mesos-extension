import { useState } from 'react';
import { Card, CardHeader, CardContent, IconButton, Tooltip } from "@mui/material";
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';

export default function MainMenu() {
  const [expanded, setExpanded] = useState(false);  


  const handleExpand = () => {
    setExpanded(!expanded);
  }  

  return (
    <>
      <Card>
        <CardHeader
          action={
            <>
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
