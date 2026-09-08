import { Inject, Injectable } from '@nestjs/common';
import { REPORTING_PROVIDER, ReportQuery, ReportingQueryProvider } from './reporting.port';

@Injectable()
export class ReportingService {
  constructor(@Inject(REPORTING_PROVIDER) private readonly provider: ReportingQueryProvider) {}

  execute(query: ReportQuery, tenantId: string) {
    return this.provider.execute(query, { tenantId });
  }
}
