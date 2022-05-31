import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { styled } from '@mui/material/styles';

export default function TasksDetails({data}) {

  const cssHeader = {
    fontWeight: "bold",
    width: "100px",
    verticalAlign: "top"
  };

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    'td': {
      borderBottom: "0px",
    },
  }));  

  const getValue = (val) => {
    if (typeof val === 'object') {
      return (
          <Table sx={{ minWidth: 100 }} size="small">
            <TableBody>
            {
              Object.entries(val).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell style={cssHeader}>{key}:</TableCell>
                  <TableCell>{getValue(value)}</TableCell>
                </TableRow>
              ))
            }    
            </TableBody>
          </Table>
      );
    } else {
      return (
        val.toString()
      );
    }
  }


  return (
     <Table sx={{ minWidth: 650 }} size="small">
       <TableBody>
       {
         Object.entries(data).map(([key, value]) => (
           <StyledTableRow key={key}>
             <TableCell style={cssHeader}>{key}:</TableCell>
             <TableCell>{getValue(value)}</TableCell>
           </StyledTableRow>
         ))
       }    
       </TableBody>
   </Table>
  );
}
