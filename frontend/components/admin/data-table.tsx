'use client'

import { memo, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'

export interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  total?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onExport?: () => void
  actions?: (row: T) => React.ReactNode
}

function DataTableComponent<T extends { id: string }>({
  columns,
  data,
  loading = false,
  total = data.length,
  page = 1,
  pageSize = 50,
  onPageChange,
  onExport,
  actions,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize)

  const renderCell = (column: Column<T>, row: T) => {
    const value = row[column.key]
    if (column.render) {
      return column.render(value, row)
    }
    if (value instanceof Date) {
      return value.toLocaleDateString()
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    return String(value || '-')
  }

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
        </p>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-surface-raised border border-border rounded-lg hover:bg-surface-base transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  className="text-left px-4 py-3 text-sm font-semibold text-neutral-400"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
              {actions && <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-400">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-neutral-400">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-neutral-400">
                  No data found
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr key={row.id} className="border-b border-border hover:bg-surface-raised/50 transition-colors">
                  {columns.map(column => (
                    <td key={String(column.key)} className="px-4 py-3 text-sm text-foreground">
                      {renderCell(column, row)}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3 text-sm">{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 1}
              className="p-2 text-neutral-400 hover:text-foreground hover:bg-surface-raised disabled:opacity-50 rounded-lg transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-sm text-neutral-400">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page === totalPages}
              className="p-2 text-neutral-400 hover:text-foreground hover:bg-surface-raised disabled:opacity-50 rounded-lg transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export const DataTable = memo(DataTableComponent) as typeof DataTableComponent
