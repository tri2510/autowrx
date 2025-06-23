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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/atoms/dropdown-menu'
import mockRequirements from './mockup_requirements'
import {
  Requirement,
  RequirementSource,
  RequirementRating,
} from '@/types/model.type'
import { TbDots } from 'react-icons/tb'
import DaTooltip from '@/components/atoms/DaTooltip'

const DaRequirementTable: React.FC = () => {
  // 1) memoize your mock data
  const data = useMemo<Requirement[]>(() => mockRequirements, [])

  // 2) define your columns
  const columns = useMemo<ColumnDef<Requirement, any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
      },
      {
        accessorKey: 'title',
        header: 'Title',
      },
      {
        accessorKey: 'description',
        header: 'Description',
      },
      {
        accessorKey: 'type',
        header: 'Type',
      },
      {
        // we need both type & link
        id: 'source',
        header: 'Source',
        accessorFn: (row) => row.source,
        cell: (info) => {
          const src = info.getValue() as RequirementSource
          return src.type === 'external' ? (
            <DaTooltip content={src.link}>
              <a
                href={src.link}
                target="_blank"
                rel="noopener noreferrer"
                className="capitalize text-blue-600 underline"
              >
                external
              </a>
            </DaTooltip>
          ) : (
            <span className="capitalize">internal</span>
          )
        },
      },
      {
        // average rating
        id: 'rating',
        header: 'Rating',
        cell: (info) => {
          const r = info.row.original.rating
          const avg = (r.priority + r.relevance + r.impact) / 3
          return <span>{avg.toFixed(1)}</span>
        },
      },
      {
        // the "..." column
        id: 'actions',
        header: '', // no header label
        cell: ({ row }) => {
          const req = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-8 w-8 p-0 flex items-center justify-center hover:bg-gray-100 rounded"
                  aria-label="Open details"
                >
                  <TbDots className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                className="bg-white"
              >
                <DropdownMenuLabel className="font-medium text-da-primary-500">
                  Metadata
                </DropdownMenuLabel>
                <DropdownMenuItem>
                  <div className="font-medium text-da-gray-dark">
                    Created At:
                  </div>{' '}
                  {req.createdAt
                    ? new Date(req.createdAt).toLocaleString()
                    : ''}
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <div className="font-medium text-da-gray-dark">
                    Updated At:
                  </div>{' '}
                  {req.updatedAt
                    ? new Date(req.updatedAt).toLocaleString()
                    : ''}
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <div className="font-medium text-da-gray-dark">
                    Creator ID:
                  </div>{' '}
                  {req.creatorUserId}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuLabel className="font-medium text-da-primary-500">
                  Rating Detail
                </DropdownMenuLabel>
                <DropdownMenuItem>
                  <div className="font-medium text-da-gray-dark">Priority:</div>{' '}
                  {req.rating.priority}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="font-medium text-da-gray-dark">
                    Relevance:
                  </div>{' '}
                  {req.rating.relevance}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="font-medium text-da-gray-dark">Impact:</div>{' '}
                  {req.rating.impact}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [],
  )

  // 3) build the table instance
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
                <TableHead
                  key={header.id}
                  className="font-semibold text-da-primary-500"
                >
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
