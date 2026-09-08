import { Injectable } from '@nestjs/common';
import { ReportQuery, ReportingQueryProvider } from '../../modules/reporting/reporting.port';

/** OpenSearch query adapter. Query compilation will grow into a semantic/query-plan module. */
@Injectable()
export class OpenSearchReportingProvider implements ReportingQueryProvider {
  private readonly endpoint = (process.env.OPENSEARCH_URL ?? '').replace(/\/$/, '');
  private readonly indexPrefix = process.env.REPORTING_INDEX_PREFIX ?? 'facts';

  async execute(query: ReportQuery, context: { tenantId: string }): Promise<unknown> {
    if (!this.endpoint) throw new Error('OPENSEARCH_URL is not configured');
    const body: Record<string, any> = {
      size: query.pageSize ?? 0,
      query: { bool: { filter: [{ term: { tenant_id: context.tenantId } }] } },
      aggs: {},
    };

    if (query.from || query.to) {
      body.query.bool.filter.push({ range: { occurred_at: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } });
    }

    for (const dimension of query.dimensions ?? []) {
      body.aggs[dimension] = { terms: { field: `${dimension}.keyword`, size: 1000 } };
    }

    for (const metric of query.metrics ?? []) {
      body.aggs[metric] = { sum: { field: metric } };
    }

    const response = await fetch(`${this.endpoint}/${this.indexPrefix}-${query.dataset}/_search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`OpenSearch request failed: ${response.status}`);
    return response.json();
  }
}
