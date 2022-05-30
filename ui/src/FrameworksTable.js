import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import FrameworksDetails from './FrameworksDetails.js';
import ShowFramework from '@mui/icons-material/OpenInNew';
import { useState } from 'react';


export default function FrameworksTable({frameworks, title}) {
  const [details, setDetails] = useState({id: "", show: false});  
 
  const data = frameworks;

  const showDetails = (id) => {
    setDetails({[id]: !details[id] })
  };

  return (
    <div>
      <TableContainer component={Paper}>
        <h4>{title}</h4>
        <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell>Framework ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Principal</TableCell>
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
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell>{row.principal}</TableCell>
                <TableCell>{row.active.toString()}</TableCell>
                <TableCell align="right">
                  <ShowFramework variant="outlined" onClick={(event) => showDetails(row.id)}></ShowFramework>
                 {details[row.id] && (<FrameworksDetails show="{details[row.id]}" data={row}/>)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>    
    </div>
  );
}
