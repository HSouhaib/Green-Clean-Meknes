declare module "better-sqlite3" {
  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): void;
  }
  interface Statement {
    run(...params: unknown[]): { lastInsertRowid: number | bigint; changes: number };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }
  export default function Database(filename: string): Database;
}
