import { Column } from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div>{title}</div>;
  }

  const handleSort = () => {
    const currentSort = column.getIsSorted();
    if (currentSort === false) {
      column.toggleSorting(false);
    } else if (currentSort === "asc") {
      column.toggleSorting(true);
    } else {
      column.clearSorting();
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleSort}
      className="p-0"
    >
      {title}
      {column.getIsSorted() === "asc" && <ChevronUp className="ml-2 h-4 w-4" />}
      {column.getIsSorted() === "desc" && (
        <ChevronDown className="ml-2 h-4 w-4" />
      )}
      {column.getIsSorted() === false && (
        <ChevronsUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}