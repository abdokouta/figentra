import { Module } from '@nestjs/common';
import { ReportingController } from './modules/reporting/reporting.controller';
import { ReportingService } from './modules/reporting/reporting.service';
import { REPORTING_PROVIDER } from './modules/reporting/reporting.port';
import { OpenSearchReportingProvider } from './infrastructure/opensearch/opensearch-reporting.provider';

@Module({
  controllers: [ReportingController],
  providers: [ReportingService, { provide: REPORTING_PROVIDER, useClass: OpenSearchReportingProvider }],
})
export class AppModule {}
