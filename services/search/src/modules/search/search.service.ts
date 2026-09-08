import { Injectable } from '@nestjs/common';
import { SearchProvider, SearchQuery } from './search.port';

@Injectable()
export class SearchService {
  constructor(private readonly provider: SearchProvider) {}

  search(query: SearchQuery, tenantId: string) {
    return this.provider.search(query, { tenantId });
  }

  autocomplete(prefix: string, resourceTypes: string[] | undefined, tenantId: string) {
    return this.provider.autocomplete(prefix, resourceTypes, { tenantId });
  }

  suggest(input: string, tenantId: string) {
    return this.provider.suggest(input, { tenantId });
  }
}
