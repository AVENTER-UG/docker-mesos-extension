import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import AgentsDetails from './dialogs/detail.js';
import ShowAgent from '@mui/icons-material/OpenInNew';
import { useState } from 'react';


export default function AgentsTable({agents}) {
  const [details, setDetails] = useState([]);  
    
  const data = agents;

  const showDetails = (id) => {
    setDetails({[id]: !details[id] });
  };

  return (
    <TableContainer component={Paper}>
      <h4>Agents</h4>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Agent ID</TableCell>
            <TableCell>Hostname</TableCell>
            <TableCell>Mesos Version</TableCell>
            <TableCell>Active</TableCell>
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
              <TableCell>{row.hostname}</TableCell>
              <TableCell>{row.version}</TableCell>
              <TableCell>{row.active.toString()}</TableCell>
              <TableCell align="right">
                <ShowAgent variant="outlined" onClick={(event) => showDetails(row.id)}></ShowAgent>
                {details[row.id] ? (<AgentsDetails key={row.id} show={details[row.id]} data={row} title="Show Agent"/>) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>    
  );
}
