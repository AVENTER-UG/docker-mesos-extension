import React from 'react';
import { useTable } from 'react-table';

export default function TasksTable({tasks}) {
  
  const data = tasks

  const columns = React.useMemo(
      () => [
        {
          Header: 'ID',
          accessor: 'id', // accessor is the "key" in the data
        },
        {
          Header: 'Name',
          accessor: 'name',
        },
        {
          Header: 'State',
          accessor: 'state', // accessor is the "key" in the data
        },
      ],
      []
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }) 

  return (
    <div>
       <table {...getTableProps()}>
         <thead>
         {headerGroups.map(headerGroup => (
             <tr {...headerGroup.getHeaderGroupProps()}>
               {headerGroup.headers.map(column => (
                   <th
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
                       <td
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
