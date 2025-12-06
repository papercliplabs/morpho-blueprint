"use client";

import "@tanstack/react-table";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type Row,
  type RowData,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { type HTMLAttributes, useEffect, useMemo, useRef, useState } from "react";
import { ScrollSync, ScrollSyncPane } from "react-scroll-sync";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/shadcn";

// Add a tooltip column to meta
declare module "@tanstack/react-table" {
  // biome-ignore lint/correctness/noUnusedVariables: Allow unused type parameters here for extending
  interface ColumnMeta<TData extends RowData, TValue> {
    tooltip?: string;
  }
}

type TableRowAction =
  | {
      type: "link";
      href: string;
    }
  | {
      type: "callback";
      callback: () => void;
    };

type SortIconProps = {
  state: "asc" | "desc" | false;
};

const sortIconVariants = cva("size-4", {
  variants: {
    state: {
      asc: "[&>path:last-child]:stroke-foreground [&>path:last-child]:transition",
      desc: "[&>path:first-child]:stroke-foreground [&>path:first-child]:transition",
      false: null,
    },
  },
  defaultVariants: {
    state: false,
  },
});

function SortIcon({ state }: SortIconProps) {
  return <ChevronsUpDown className={sortIconVariants({ state })} />;
}

export function TableRow({
  action,
  className,
  children,
}: HTMLAttributes<HTMLDivElement> & { action?: TableRowAction }) {
  const tableRowColors = "bg-[var(--row-color)] [--row-color:var(--card)]";

  if (action?.type === "link") {
    return (
      // Annoying hack for the scroll sync to work
      <div className="w-fit min-w-full border-border not-last:border-b">
        <Link
          href={action.href}
          className={cn(
            "flex w-full min-w-fit items-center transition-colors",
            tableRowColors,
            "hover:[--row-color:var(--accent)]",
            className,
          )}
        >
          {children}
        </Link>
      </div>
    );
  }

  return (
    // Annoying hack for the scroll sync to work
    <div className="w-fit min-w-full border-border not-last:border-b transition-colors first:border-b">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Allow for now... */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Allow for now... */}
      <div
        className={cn(
          "flex w-full min-w-fit items-center transition-colors",
          tableRowColors,
          action?.type === "callback" && "hover:cursor-pointer hover:[--row-color:var(--accent)]",
          className,
        )}
        onClick={action?.type === "callback" ? action.callback : undefined}
      >
        {children}
      </div>
    </div>
  );
}

export interface TableCellProps extends HTMLAttributes<HTMLDivElement> {
  minWidth?: number;
}

export function TableCell({ minWidth, className, style, ...props }: TableCellProps) {
  return (
    <div
      className={cn(
        "flex h-full w-[0px] flex-1 shrink-0 grow items-center overflow-hidden text-ellipsis text-nowrap px-4",
        className,
      )}
      style={{
        minWidth,
        ...style,
      }}
      {...props}
    />
  );
}

interface TableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  initialPagination?: PaginationState;
  initialSort?: SortingState;
  rowAction: (row: TData) => TableRowAction | null;
  groupBy?: keyof TData & string;
  groupLabels?: Record<string, string>;
}

export function Table<TData, TValue>({
  columns,
  data,
  initialPagination = {
    pageSize: 10,
    pageIndex: 0,
  },
  initialSort,
  rowAction,
  groupBy,
  groupLabels,
}: TableProps<TData, TValue>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>(initialSort ?? []);

  const grouping = useMemo(() => (groupBy ? [groupBy] : []), [groupBy]);

  // Scroll to top of the table on sort change if its above the header
  // biome-ignore lint/correctness/useExhaustiveDependencies: Need to re-scroll on sort change
  useEffect(() => {
    const tableTop = (tableRef.current?.getBoundingClientRect().top ?? 0) + 18; // Accounts for top padding and small overlap
    const headerHeight = Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--header-height"),
    );
    if (tableTop < headerHeight) {
      window.scrollTo({ top: window.scrollY + (tableTop - headerHeight), behavior: "smooth" });
    }
  }, [sorting]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...(groupBy && {
      getGroupedRowModel: getGroupedRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      groupedColumnMode: false,
    }),
    state: {
      sorting,
      ...(groupBy && { grouping, expanded: true }),
    },
    initialState: {
      pagination: initialPagination,
      ...(groupBy && { columnVisibility: { [groupBy]: false } }),
    },
  });

  const renderGroupHeader = (row: Row<TData>) => {
    const groupValue = String(row.getValue(groupBy!));
    const label = groupLabels?.[groupValue] ?? groupValue;
    return (
      <div key={row.id} className="w-fit min-w-full border-border border-b">
        <div className="body-small-plus flex h-8 items-center px-4 text-muted-foreground">{label}</div>
      </div>
    );
  };

  const rows = table.getRowModel().rows;

  const renderRow = (row: Row<TData>) => (
    <TableRow action={rowAction(row.original) ?? undefined} className="group h-[72px] gap-0" key={row.id}>
      {row.getVisibleCells().map((cell) => (
        <TableCell minWidth={cell.column.columnDef.minSize} key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );

  return (
    <>
      <ScrollSync>
        <div className="relative h-fit min-w-0 grow overflow-hidden rounded-md border border-border" ref={tableRef}>
          {/* Gradients on left and right for mobile */}
          <div className="absolute top-0 bottom-0 left-0 z-[10] w-4 rounded-l-md bg-gradient-to-r from-card to-transparent md:hidden" />
          <div className="absolute top-0 right-0 bottom-0 z-[10] w-4 rounded-r-md bg-gradient-to-l from-card to-transparent md:hidden" />
          <div className="sticky top-[calc(var(--header-height)-2px)] z-[5] min-w-full">
            <ScrollSyncPane>
              <div className="scrollbar-none overflow-auto overscroll-x-none">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="body-small-plus h-12 text-muted-foreground hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => {
                      const cellContent = (
                        <div
                          className={clsx(
                            "flex h-12 select-none items-center gap-1",
                            header.column.columnDef.enableSorting !== false && "hover:cursor-pointer",
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.columnDef.enableSorting === false ? null : (
                            <SortIcon state={header.column.getIsSorted()} />
                          )}
                        </div>
                      );

                      const tooltip = header.column.columnDef.meta?.tooltip;
                      return (
                        <TableCell
                          minWidth={header.column.columnDef.minSize}
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {tooltip ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>{cellContent}</TooltipTrigger>
                                <TooltipContent>{tooltip}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            cellContent
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </div>
            </ScrollSyncPane>
          </div>
          <ScrollSyncPane>
            <div className="scrollbar-none body-medium-plus flex w-full flex-col overflow-x-auto overscroll-x-none">
              {rows.length > 0 ? (
                rows.map((row) => (row.getIsGrouped() ? renderGroupHeader(row) : renderRow(row)))
              ) : (
                <div className="flex h-[100px] flex-col items-center justify-center gap-1 text-muted-foreground">
                  <span>No items</span>
                </div>
              )}
            </div>
          </ScrollSyncPane>
        </div>
      </ScrollSync>
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end gap-2 pt-6">
          <Button
            size="sm"
            variant="outline"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="body-medium text-muted-foreground">
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button size="sm" variant="outline" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </>
  );
}
