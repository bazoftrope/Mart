declare module 'pg' {
  export class Client {
    constructor(config?: { connectionString?: string; [key: string]: unknown });
    connect(): Promise<void>;
    query(queryText: string, values?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>;
    end(): Promise<void>;
  }
}
