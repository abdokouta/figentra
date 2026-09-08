export const SEARCH_PROVIDER = Symbol('SEARCH_PROVIDER');

export interface SearchQuery {
  query: string;
  resourceTypes?: string[];
  filters?: Record<string, unknown>;
  page?: number;
  pageSize?: number;
  highlight?: boolean;
  facets?: string[];
}

export interface SearchResult {
  resourceType: string;
  id: string;
  title: string;
  subtitle?: string;
  url?: string;
  score?: number;
  highlights?: Record<string, string[]>;
}

/** Provider-neutral search boundary. OpenSearch is the initial adapter. */
export interface SearchProvider {
  search(query: SearchQuery, context: { tenantId: string }): Promise<{ results: SearchResult[]; total: number }>;
  autocomplete(prefix: string, resourceTypes: string[] | undefined, context: { tenantId: string }): Promise<SearchResult[]>;
  suggest(input: string, context: { tenantId: string }): Promise<string[]>;
}
