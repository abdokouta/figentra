import { Injectable } from '@nestjs/common';
import { SearchProvider, SearchQuery, SearchResult } from '../../modules/search/search.port';

/** Minimal HTTP adapter; OpenSearch-specific DSL stays inside this infrastructure boundary. */
@Injectable()
export class OpenSearchSearchProvider implements SearchProvider {
  private readonly endpoint = (process.env.OPENSEARCH_URL ?? '').replace(/\/$/, '');
  private readonly indexPrefix = process.env.SEARCH_INDEX_PREFIX ?? 'search';

  async search(query: SearchQuery, context: { tenantId: string }): Promise<{ results: SearchResult[]; total: number }> {
    const resources = query.resourceTypes?.length ? query.resourceTypes : ['customers', 'orders', 'products', 'projects', 'tasks'];
    const indices = resources.map((r) => `${this.indexPrefix}-${r}`).join(',');
    const body = {
      from: Math.max(0, ((query.page ?? 1) - 1) * (query.pageSize ?? 20)),
      size: Math.min(query.pageSize ?? 20, 100),
      query: { bool: { must: query.query ? [{ multi_match: { query: query.query, fields: ['title^5', 'name^4', 'code^6', 'description'] } }] : [{ match_all: {} }], filter: [{ term: { tenant_id: context.tenantId } }] } },
      highlight: query.highlight ? { fields: { title: {}, name: {}, description: {} } } : undefined,
    };
    const response = await this.request(`${indices}/_search`, body);
    const hits = response.hits?.hits ?? [];
    return { total: response.hits?.total?.value ?? hits.length, results: hits.map((h: any) => ({ ...h._source.result, id: h._id, score: h._score, highlights: h.highlight })) };
  }

  async autocomplete(prefix: string, resourceTypes: string[] | undefined, context: { tenantId: string }): Promise<SearchResult[]> {
    const resources = resourceTypes?.length ? resourceTypes : ['customers', 'orders', 'products', 'projects', 'tasks'];
    const indices = resources.map((r) => `${this.indexPrefix}-${r}`).join(',');
    const body = { size: 10, query: { bool: { must: [{ multi_match: { query: prefix, type: 'bool_prefix', fields: ['title.search_as_you_type', 'title.search_as_you_type._2gram', 'title.search_as_you_type._3gram', 'name.search_as_you_type'] } }], filter: [{ term: { tenant_id: context.tenantId } }] } } };
    const response = await this.request(`${indices}/_search`, body);
    return (response.hits?.hits ?? []).map((h: any) => ({ ...h._source.result, id: h._id, score: h._score }));
  }

  async suggest(input: string, context: { tenantId: string }): Promise<string[]> {
    const body = { size: 0, suggest: { autocomplete: { prefix: input, completion: { field: 'suggest', size: 8, fuzzy: { fuzziness: 'AUTO' } } } }, query: { term: { tenant_id: context.tenantId } } };
    const response = await this.request(`${this.indexPrefix}-suggest/_search`, body);
    return (response.suggest?.autocomplete?.[0]?.options ?? []).map((x: any) => x.text);
  }

  private async request(path: string, body: unknown): Promise<any> {
    if (!this.endpoint) throw new Error('OPENSEARCH_URL is not configured');
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (process.env.OPENSEARCH_BEARER_TOKEN) headers.authorization = `Bearer ${process.env.OPENSEARCH_BEARER_TOKEN}`;
    const response = await fetch(`${this.endpoint}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(`OpenSearch request failed: ${response.status}`);
    return response.json();
  }
}
