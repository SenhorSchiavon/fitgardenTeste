"use client";

import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";
export type SortState<K extends string> = { key: K | null; direction: SortDirection };

type Options<T> = {
  initialKey?: string | null;
  initialDirection?: SortDirection;
  /**
   * Se quiser tratar valores (ex: datas string -> Date, boolean -> number)
   */
  accessor?: (row: T, key: string) => unknown;
};

function defaultAccessor<T>(row: T, key: string) {
  return (row as any)?.[key];
}

function compareValues(a: unknown, b: unknown) {
  // null/undefined sempre por último
  const aNil = a === null || a === undefined;
  const bNil = b === null || b === undefined;
  if (aNil && bNil) return 0;
  if (aNil) return 1;
  if (bNil) return -1;

  // boolean
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }

  // number
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  // Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  // fallback string (case-insensitive)
  const sa = String(a).toLowerCase();
  const sb = String(b).toLowerCase();
  return sa.localeCompare(sb);
}

export function useTableSort<T, K extends string = string>(
  rows: T[],
  options?: Options<T>
) {
  const [sort, setSort] = useState<SortState<K>>({
    key: (options?.initialKey as K | null) ?? null,
    direction: options?.initialDirection ?? "asc",
  });

  const onSort = (key: K) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const accessor = options?.accessor ?? defaultAccessor;

  const sortedRows = useMemo(() => {
    if (!sort.key) return rows;

    const key = sort.key as string;
    const dir = sort.direction;

    const copy = [...rows];
    copy.sort((ra, rb) => {
      const va = accessor(ra, key);
      const vb = accessor(rb, key);
      const cmp = compareValues(va, vb);
      return dir === "asc" ? cmp : -cmp;
    });

    return copy;
  }, [rows, sort.key, sort.direction, accessor]);

  return {
    sort,          
    onSort,       
    sortedRows,    
    setSort,      
  };
}