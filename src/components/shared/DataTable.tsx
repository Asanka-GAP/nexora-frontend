"use client";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
}

export default function DataTable<T>({ columns, data, keyExtractor, emptyMessage = "No data found" }: DataTableProps<T>) {
  if (!data.length) {
    return (
      <div className="rounded-2xl bg-bg-card border border-border p-12 text-center text-text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg">
            {columns.map((col) => (
              <th key={col.key} className={cn("px-4 py-3 text-left font-medium text-text-muted", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3 text-text", col.className)}>
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
