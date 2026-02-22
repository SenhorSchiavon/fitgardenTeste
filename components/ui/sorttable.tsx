import { TableHead } from "@/components/ui/table";

type SortState<K extends string> = {
  key: K | null;
  direction: "asc" | "desc";
};

type SortableHeadProps<K extends string> = {
  label: string;
  field: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  className?: string;
};

export function SortableHead<K extends string>({
  label,
  field,
  sort,
  onSort,
  className,
}: SortableHeadProps<K>) {
  return (
    <TableHead
      className={className}
      sortable
      sortKey={field}
      sortDirection={sort.key === field ? sort.direction : null}
      onSort={(k) => onSort(k as K)}
    >
      {label}
    </TableHead>
  );
}