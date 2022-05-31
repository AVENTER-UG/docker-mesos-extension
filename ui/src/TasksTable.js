import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TasksDetails from './TasksDetails.js';
import ShowTask from '@mui/icons-material/OpenInNew';
import { useState } from 'react';


export default function TasksTable({tasks}) {
  const [details, setDetails] = useState([]);  
    
  const data = tasks

  const showDetails = (id) => {
    setDetails({[id]: !details[id] });
  };

  return (
    <TableContainer component={Paper}>
      <h4>Tasks</h4>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Task ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Framework ID</TableCell>
            <TableCell>State</TableCell>
            <TableCell align="right">&nbsp;</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.id}
              </TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.framework_id}</TableCell>
              <TableCell>{row.state.toString()}</TableCell>
              <TableCell align="right">
                <ShowTask variant="outlined" onClick={(event) => showDetails(row.id)}></ShowTask>
                {details[row.id] ? (<TasksDetails key={row.id} show={details[row.id]} data={row}/>) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>    
  );
}
