import * as React from "react"
import { ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"


type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  sortable?: boolean;
  sortKey?: string;
  sortDirection?: "asc" | "desc" | null;
  onSort?: (key: string) => void;
};

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  (
    {
      className,
      sortable,
      sortKey,
      sortDirection,
      onSort,
      onClick,
      onKeyDown,
      children,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
      if (sortable && sortKey) onSort?.(sortKey);
      onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTableCellElement>) => {
      if (sortable && sortKey && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onSort?.(sortKey);
      }
      onKeyDown?.(e);
    };

    return (
      <th
        ref={ref}
        onClick={sortable ? handleClick : onClick}
        onKeyDown={sortable ? handleKeyDown : onKeyDown}
        role={sortable ? "button" : undefined}
        tabIndex={sortable ? 0 : undefined}
        aria-sort={
          sortable && sortDirection
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : undefined
        }
        className={cn(
          "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
          sortable && "cursor-pointer select-none hover:text-foreground",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {children}
          {sortable && (
            <ArrowUpDown
              className={cn(
                "h-4 w-4",
                sortDirection ? "opacity-100" : "opacity-40"
              )}
            />
          )}
        </div>
      </th>
    );
  }
);
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
