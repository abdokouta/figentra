export const REPORTING_PROVIDER = Symbol('REPORTING_PROVIDER');

export interface ReportQuery {
  dataset: string;
  dimensions?: string[];
  metrics?: string[];
  filters?: Record<string, unknown>;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface ReportingQueryProvider {
  execute(query: ReportQuery, context: { tenantId: string }): Promise<unknown>;
}
