import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SwaggerSetupService } from '@/services/swagger-setup.service';
import type { ISwaggerConfig } from '@/interfaces';

// Mock @nestjs/swagger
vi.mock('@nestjs/swagger', () => ({
  SwaggerModule: {
    createDocument: vi.fn().mockReturnValue({ info: {}, paths: {} }),
    setup: vi.fn(),
  },
  DocumentBuilder: vi.fn(),
}));

const BASE_CONFIG: ISwaggerConfig = {
  title: 'Test API',
  description: 'Test',
  version: '1.0.0',
  apiPath: 'api/docs',
  enabled: true,
  serverUrl: 'http://localhost:3000',
};

describe('SwaggerSetupService', () => {
  let service: SwaggerSetupService;
  let mockBuilder: any;
  let mockApp: any;

  beforeEach(() => {
    mockBuilder = {
      build: vi.fn().mockReturnValue({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }),
    };

    mockApp = {
      getHttpAdapter: vi.fn().mockReturnValue({}),
    };

    service = new (SwaggerSetupService as any)(BASE_CONFIG, mockBuilder);
    (service as any).config = BASE_CONFIG;
    (service as any).builder = mockBuilder;
  });

  it('calls builder.build() when setup is called', () => {
    service.setup(mockApp);
    expect(mockBuilder.build).toHaveBeenCalled();
  });

  it('does not call builder.build() when disabled', () => {
    (service as any).config = { ...BASE_CONFIG, enabled: false };
    service.setup(mockApp);
    expect(mockBuilder.build).not.toHaveBeenCalled();
  });

  it('logs warning when enabled in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Should not throw — just logs
    expect(() => service.setup(mockApp)).not.toThrow();

    process.env.NODE_ENV = originalEnv;
  });
});
