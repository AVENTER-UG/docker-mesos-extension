import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TasksDetails from './dialogs/detail.js';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { useState } from 'react';
import * as React from 'react';


export default function TasksTable({tasks}) {
  const data = tasks

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
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.framework_id}</TableCell>
              <TableCell align="right">{row.state.toString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ paddingBottom: 0, paddingTop: 0, paddingLeft: "100px" }} colSpan={5}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                   <TasksDetails key={row.id} data={row} />
               </Collapse>
              </TableCell>            
            </TableRow>
         </React.Fragment>
    );
  };

  return (
    <TableContainer component={Paper}>
      <h4>Tasks</h4>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>Task ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Framework ID</TableCell>
            <TableCell align="right">State</TableCell>
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
