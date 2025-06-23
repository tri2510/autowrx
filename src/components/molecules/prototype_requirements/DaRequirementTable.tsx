// DaRequirementExplorer.tsx
import React, { useMemo } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/atoms/table' // or '@/components/ui/table'
import mockRequirements from './mockup_requirements'
import { Requirement } from '@/types/model.type'

const DaRequirementTable: React.FC = () => {
  // 1) grab your mock data
  const data = useMemo<Requirement[]>(() => mockRequirements, [])

  // 2) define your column definitions
  const columns = useMemo<ColumnDef<Requirement, any>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'description', header: 'Description' },
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'source', header: 'Source' },
      { accessorKey: 'rating', header: 'Rating' },
      { accessorKey: 'creatorUserId', header: 'Creator ID' },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue() as Date).toLocaleString()
            : '-',
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated At',
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue() as Date).toLocaleString()
            : '-',
      },
    ],
    [],
  )

  // 3) wire up useReactTable
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full h-full overflow-auto rounded-xl border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default DaRequirementTable
