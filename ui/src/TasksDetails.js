import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useState } from 'react';

export default function TasksDetails({show, data}) {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  const cssTitle = {
    paddingLeft: "30px",
    fontWeight: "bold"
  }

  const cssHeader = {
    fontWeight: "bold",
    width: "100px",
    verticalAlign: "top"
  }

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
      <Dialog
        onClose={handleClose}
        open={open}   
        maxWidth="lg"
      >
        <DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <div style={cssTitle}>
          Show Task: {data.id}
        </div>
        <DialogContent dividers>
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell style={cssHeader}>Name</TableCell>
                <TableCell>&nbsp;</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {
              Object.entries(data).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell style={cssHeader}>{key}:</TableCell>
                  <TableCell>{getValue(value)}</TableCell>
                </TableRow>
              ))
            }    
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
  );
}
