import { useState } from 'react';

interface DataTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    width?: string;
  }>;
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({ data, columns, keyExtractor, onRowClick }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = [...data];
  if (sortKey) {
    sortedData.sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--bg-surface-light)' }}>
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr style={{ background: 'var(--bg-surface)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 sm:px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
                style={{ color: 'var(--text-tertiary)', width: col.width }}
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {sortKey === col.key && (
                    <span style={{ color: 'var(--accent-green)' }}>
                      {sortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="transition-colors hover:bg-[var(--bg-surface-light)]"
              style={{ borderTop: '1px solid var(--bg-surface-light)' }}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-3 sm:px-4 py-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm"
                style={{ color: 'var(--text-tertiary)' }}
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
