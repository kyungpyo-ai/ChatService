import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchX } from "lucide-react";
import { DataTableSearchInput } from "@/components/admin/data-table-search-input";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

/**
 * 관리자 화면 공통 테이블 — 기존 components/ui/table.tsx 위에 검색 인풋을 얹은 얇은 래퍼
 * (§DEVELOPMENT_PLAN 7.5.4). 검색어는 `?q=` 쿼리 파라미터로 관리해 URL 공유/새로고침에도
 * 유지되며, Server Component 페이지가 이 값을 읽어 서버에서 재조회한다(페이지네이션은
 * 이번 Phase 범위에서는 100건 상한으로 대체).
 *
 * 이 컴포넌트 자체는 Client Component가 아니다 — 각 /admin/* 페이지(Server Component)가
 * 넘기는 `columns[].render`는 함수라서 Client Component 경계를 건널 수 없기 때문에,
 * 실제 라우팅이 필요한 검색 인풋만 `DataTableSearchInput`으로 분리했다.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchPlaceholder = "검색",
  emptyMessage = "결과가 없습니다.",
}: DataTableProps<T>) {
  return (
    <div className="space-y-3">
      <DataTableSearchInput placeholder={searchPlaceholder} />

      {rows.length === 0 ? (
        <EmptyState icon={SearchX} title={emptyMessage} />
      ) : (
        <div className="bg-surface rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key}>{col.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>{col.render(row)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
