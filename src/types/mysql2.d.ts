import 'mysql2/promise';

declare module 'mysql2/promise' {
  interface QueryResult {
    rows: any[];
    fields?: any;
  }

  interface Connection {
    query<T = any>(sql: string, values?: any): Promise<[T, FieldPacket[]]>;
  }
}