import React from 'react';
import { useTable } from 'react-table';

export default function FrameworksTable({frameworks}) {
  
  const data = frameworks

  const columns = React.useMemo(
      () => [
        {
          Header: 'ID',
          accessor: 'id', 
        },
        {
          Header: 'Name',
          accessor: 'name',
        },
        {
          Header: 'URL',
          accessor: 'webui_url', 
        },
        {
          Header: 'Active',
          accessor: d => d.active.toString()
        },
      ],
      []
  )

  const headerStyle = {
    textAlign: 'left'
  }

  const cellStyle = {
    textAlign: 'left',
    paddingRight: '50px'
  }

  const center = {
    marginLeft: 'auto',
    marginRight: 'auto'
  }

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }) 

  return (
    <div>
       <table style={center} {...getTableProps()}>
         <thead>
         {headerGroups.map(headerGroup => (
             <tr {...headerGroup.getHeaderGroupProps()}>
               {headerGroup.headers.map(column => (
                   <th style={headerStyle} 
                       {...column.getHeaderProps()}
                   >
                     {column.render('Header')}
                   </th>
               ))}
             </tr>
         ))}
         </thead>
         <tbody {...getTableBodyProps()}>
         {rows.map(row => {
           prepareRow(row)
           return (
               <tr {...row.getRowProps()}>
                 {row.cells.map(cell => {
                   return (
                       <td style={cellStyle}
                           {...cell.getCellProps()}
                       >
                         {cell.render('Cell')}
                       </td>
                   )
                 })}
               </tr>
           )
         })}
         </tbody>
       </table>
     </div>    
  );
}
