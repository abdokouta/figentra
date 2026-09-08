import { Module } from '@nestjs/common';
import { SearchController } from './modules/search/search.controller';
import { SearchService } from './modules/search/search.service';
import { SEARCH_PROVIDER } from './modules/search/search.port';
import { OpenSearchSearchProvider } from './infrastructure/opensearch/opensearch-search.provider';

@Module({
  controllers: [SearchController],
  providers: [SearchService, { provide: SEARCH_PROVIDER, useClass: OpenSearchSearchProvider }],
})
export class AppModule {}
