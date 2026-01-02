import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  SortingState,
  PaginationState,
} from '@tanstack/react-table';
import React, { useState } from 'react';
import { FaLongArrowAltDown, FaLongArrowAltUp } from 'react-icons/fa';
import { LuArrowUpDown } from 'react-icons/lu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ServerDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  pageSize: number;
  pageIndex: number;
  totalRows: number;
  onPaginationChange: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onFilterChange?: (filters: ColumnFiltersState) => void;
  searchColumn?: string;
  isLoading?: boolean;
  noDataText: string;
}

interface SortIconProps {
  column: {
    getCanSort: () => boolean;
    getIsSorted: () => 'asc' | 'desc' | false;
  };
}

const SortIcon: React.FC<SortIconProps> = ({ column }) => {

  if (!column.getCanSort()) return null;

  const sorted = column.getIsSorted();

  return (
    <span className="w-5 h-5 flex justify-center items-center ml-2 cursor-pointer">
      {!sorted && <ChevronsUpDown className="w-4 h-4" />}
      {sorted === 'asc' && (
        <ChevronUp className="w-4 h-4 text-custom-green-start" />
      )}
      {sorted === 'desc' && (
        <ChevronDown className="w-4 h-4 text-custom-green-start" />
      )}
    </span>
  );
};

function ServerDataTable<TData, TValue>({
  columns,
  data,
  pageCount = 1,
  pageSize = 5,
  pageIndex = 0,
  totalRows = 100,
  onPaginationChange,
  onSortingChange,
  onFilterChange,
  isLoading = false,
  noDataText,
}: ServerDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [
    { pageSize: tablePageSize, pageIndex: tablePageIndex },
    setPagination,
  ] = useState<PaginationState>({
    pageSize: pageSize,
    pageIndex: pageIndex,
  });

  const pagination = {
    pageSize: tablePageSize,
    pageIndex: tablePageIndex,
  };

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    enableSorting: true,
    autoResetPageIndex: false,
  });

  // Effect to handle pagination changes
  React.useEffect(() => {
    if (data.length === 0 && pageIndex !== 0) {
      table.resetPagination(); // or table.setPageIndex(0)
    }
    onPaginationChange(pagination);
  }, [pagination]);

  // Effect to handle sorting changes
  React.useEffect(() => {
    onSortingChange?.(sorting);
  }, [sorting]);

  // Effect to handle filter changes
  React.useEffect(() => {
    onFilterChange?.(columnFilters);
  }, [columnFilters]);

  // Function to generate page numbers
  const generatePaginationNumbers = () => {
    const totalPages = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex + 1;
    const delta = 1;

    let pages: (number | string)[] = [];

    pages.push(1);

    let startPage = Math.max(2, currentPage - delta);
    let endPage = Math.min(totalPages - 1, currentPage + delta);

    if (startPage > 2) {
      pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div>
      {/* Columns Visibility */}
      <div className="rounded-md w-full overflow-x-auto scrollbarHorizontal">
        <Table className='border shadow-lg shadow-card'>
          {/* Table Header */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[#989898] text-sm px-4 py-3 border"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      width: header.getSize(),
                      minWidth: header.column.columnDef.minSize,
                      maxWidth: header.column.columnDef.maxSize,
                    }}
                  >
                    <div className="flex items-center">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      {header.column.getCanSort() && (
                        <SortIcon column={header.column} />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-slate-300">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`}>
                  {columns.map((_, colIndex) => (
                    <TableCell
                      key={`skeleton-cell-${rowIndex}-${colIndex}`}
                      className="h-12 text-start animate-pulse"
                    >
                      <div className="h-2.5 bg-gray-400 rounded-full dark:bg-gray-700"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="px-4 py-3 h-50 text-center"
                >
                  <span className="text-base md:text-lg">
                    {noDataText ? noDataText : 'No results found.'}
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-primary hover:text-white"
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 border">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 mb-4 w-full flex justify-center items-center md:justify-end">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4 px-4">
          {/* Showing entries */}
          {totalRows > 0 && (
            <div className="flex-1 text-xs sm:text-sm text-slate-500">
              {`Showing ${totalRows > 0 ? pageIndex * pageSize + 1 : 0} to ${(pageIndex + 1) * pageSize} of ${totalRows} entries`}
            </div>
          )}

          {/* Pagination controls */}
          <div className="flex flex-col w-full md:flex-row justify-start md:justify-between xl:justify-start items-center gap-4  md:w-full xl:w-auto">
            {/* Rows per page */}
            <div className="flex justify-center items-center space-x-2">
              <span className="text-xs sm:text-sm font-medium text-slate-500">
                Rows per page
              </span>
              <Select
                disabled={!data || !data.length}
                value={pageSize.toString()} // Select expects a string value
                onValueChange={(value) => table.setPageSize(Number(value))} // Convert back to number
              >
                <SelectTrigger className="h-8 w-auto border">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 40, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      <span className='font-medium'>{size}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center space-x-2">
              <Button
               
                onClick={() => table.setPageIndex(1)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-3 sm:h-4 w-3 sm:w-4" />
              </Button>
              <Button
               
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-3 sm:h-4 w-3 sm:w-4" />
              </Button>

              {/* Numeric page Buttons */}
              <div className="flex items-center space-x-1">
                {generatePaginationNumbers().map((pageNum, idx) => (
                  <React.Fragment key={idx}>
                    {pageNum === '...' ? (
                      <span className="px-2 text-slate-500">...</span>
                    ) : (
                      <Button
                       
                        className={`${pageIndex == pageNum ? "bg-secondary-foreground text-secondary hover:bg-secondary-foreground hover:text-secondary" : "hover:bg-primary-foreground hover:text-primary"} `}
                        onClick={() =>
                          table.setPageIndex(Number(pageNum))
                        }

                      >
                        {pageNum}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <Button
                
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-3 sm:h-4 w-3 sm:w-4" />
              </Button>
              <Button
               
                onClick={() => table.setPageIndex(table.getPageCount())}
                disabled={!table.getCanNextPage()}

              >
                <ChevronsRight className="h-3 sm:h-4 w-3 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ServerDataTable };