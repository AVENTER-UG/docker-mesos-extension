import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import AgentsDetails from './dialogs/detail.js';
import { useState } from 'react';
import * as React from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';

export default function AgentsTable({agents}) {
  const data = agents;

  const Row = ({row}) =>  {
    const [open, setOpen] = useState(false);  

    return (
        <React.Fragment>
            <TableRow
              key={row.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >

             <TableCell>
               <IconButton
                 aria-label="expand row"
                 size="small"
                 onClick={() => setOpen(!open)}
               >
                 {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
               </IconButton>
             </TableCell>            
              <TableCell component="th" scope="row">
                {row.id}
              </TableCell>
              <TableCell>{row.hostname}</TableCell>
              <TableCell>{row.version}</TableCell>
              <TableCell align="right">{row.active.toString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ paddingBottom: 0, paddingTop: 0, paddingLeft: "100px" }} colSpan={5}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                   <AgentsDetails key={row.id} data={row} />
               </Collapse>
              </TableCell>            
            </TableRow>
         </React.Fragment>
    );
  };

  

  return (
    <TableContainer component={Paper}>
      <h4>Agents</h4>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>Agent ID</TableCell>
            <TableCell>Hostname</TableCell>
            <TableCell>Mesos Version</TableCell>
            <TableCell align="right">Active</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <Row key={row.id} row={row} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>    
  );
}
