"use client";

import { type ReactNode } from "react";

/* ─── Column definition ─── */
export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T, index: number) => ReactNode;
}

/* ─── Table props ─── */
interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
}

export default function Table<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyMessage = "데이터가 없습니다",
}: TableProps<T>) {
  return (
    <div
      className="overflow-x-auto bg-white"
      style={{
        borderRadius: "12px",
        boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
      }}
    >
      <table className="w-full text-left">
        {/* Head */}
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2.5 text-[12px] font-medium text-[#777169] uppercase tracking-wider"
                style={{ width: col.width, letterSpacing: "0.5px" }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-[14px] text-[#777169]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={() => onRowClick?.(row, i)}
                className="transition-colors hover:bg-[#f9f9f9]"
                style={{
                  borderBottom: i < data.length - 1 ? "1px solid rgba(0,0,0,0.05)" : undefined,
                  cursor: onRowClick ? "pointer" : "default",
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-[14px]"
                    style={{ letterSpacing: "0.14px" }}
                  >
                    {col.render
                      ? col.render(row, i)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
