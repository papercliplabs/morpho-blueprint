"use client";

import "@tanstack/react-table";
import {
  ColumnDef,
  RowData,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { HTMLAttributes, useEffect, useRef, useState } from "react";
import { ScrollSync, ScrollSyncPane } from "react-scroll-sync";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/shadcn";

// Add a tooltip column to meta
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  if (action?.type == "link") {
    return (
      // Annoying hack for the scroll sync to work
      <div className="border-border w-fit min-w-full border-b">
        <Link
          href={action.href}
          className={cn("hover:bg-accent flex w-full min-w-fit items-center transition-colors", className)}
        >
          {children}
        </Link>
      </div>
    );
  } else {
    return (
      // Annoying hack for the scroll sync to work
      <div className="border-border w-fit min-w-full transition-colors not-last:border-b first:border-b">
        <div
          className={cn(
            "flex w-full min-w-fit items-center transition-colors",
            action?.type == "callback" && "hover:bg-accent hover:cursor-pointer",
            className
          )}
          onClick={action?.type == "callback" ? action.callback : undefined}
        >
          {children}
        </div>
      </div>
    );
  }
}

export interface TableCellProps extends HTMLAttributes<HTMLDivElement> {
  minWidth?: number;
}

export function TableCell({ minWidth, className, style, ...props }: TableCellProps) {
  return (
    <div
      className={cn(
        "flex h-full w-[0px] flex-1 shrink-0 grow items-center overflow-hidden px-4 text-nowrap text-ellipsis",
        className
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
  initialSort?: SortingState;
  rowAction: (row: TData) => TableRowAction | null;
}

export function Table<TData, TValue>({ columns, data, initialSort, rowAction }: TableProps<TData, TValue>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>(initialSort ?? []);

  // Scroll to top of the table on sort change if its above the header
  useEffect(() => {
    const tableTop = (tableRef.current?.getBoundingClientRect().top ?? 0) + 18; // Accounts for top padding and small overlap
    const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-height"));
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
    state: {
      sorting,
    },
  });

  return (
    <ScrollSync>
      <div className="border-border relative h-fit min-w-0 grow overflow-x-visible rounded-md border" ref={tableRef}>
        {/* Gradients on left and right for mobile */}
        <div className="from-background absolute top-0 bottom-0 left-0 z-[10] w-4 rounded-l-md bg-gradient-to-r to-transparent md:hidden" />
        <div className="from-background absolute top-0 right-0 bottom-0 z-[10] w-4 rounded-r-md bg-gradient-to-l to-transparent md:hidden" />
        <div className="sticky top-[calc(var(--header-height)-2px)] z-[5] min-w-full">
          <ScrollSyncPane>
            <div className="scrollbar-none overflow-auto overscroll-x-none">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="text-muted-foreground body-small-plus h-12 hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => {
                    const cellContent = (
                      <div
                        className={clsx(
                          "flex h-12 items-center gap-1 select-none",
                          header.column.columnDef.enableSorting !== false && "hover:cursor-pointer"
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.columnDef.enableSorting == false ? null : (
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow action={rowAction(row.original) ?? undefined} className="group h-[72px] gap-0" key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell minWidth={cell.column.columnDef.minSize} key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <div className="text-muted-foreground flex h-[100px] flex-col items-center justify-center gap-1">
                <span>No items</span>
              </div>
            )}
          </div>
        </ScrollSyncPane>
      </div>
    </ScrollSync>
  );
}
