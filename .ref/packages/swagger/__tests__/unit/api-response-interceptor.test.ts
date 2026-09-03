import { describe, it, expect } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { ApiResponseInterceptor } from '@/interceptors/api-response.interceptor';

function createMockContext(url: string = '/api/products', statusCode: number = 200) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ url }),
      getResponse: () => ({ statusCode }),
    }),
  } as any;
}

function createMockHandler(data: any) {
  return { handle: () => of(data) } as any;
}

describe('ApiResponseInterceptor', () => {
  const interceptor = new ApiResponseInterceptor();

  it('wraps a plain object in the standard envelope', async () => {
    const data = { id: '1', name: 'Widget' };
    const ctx = createMockContext('/api/products/1');
    const handler = createMockHandler(data);

    const result = await firstValueFrom(interceptor.intercept(ctx, handler));

    expect(result.data).toEqual(data);
    expect(result.statusCode).toBe(200);
    expect(result.timestamp).toBeDefined();
    expect(result.path).toBe('/api/products/1');
  });

  it('wraps an array in the standard envelope', async () => {
    const data = [{ id: '1' }, { id: '2' }];
    const ctx = createMockContext('/api/products');
    const handler = createMockHandler(data);

    const result = await firstValueFrom(interceptor.intercept(ctx, handler));

    expect(result.data).toEqual(data);
    expect(result.statusCode).toBe(200);
  });

  it('preserves paginated responses (data + meta)', async () => {
    const paginatedData = {
      data: [{ id: '1' }],
      meta: { total: 50, page: 1, limit: 20 },
      links: { self: '?page=1', next: '?page=2' },
    };
    const ctx = createMockContext('/api/products');
    const handler = createMockHandler(paginatedData);

    const result = await firstValueFrom(interceptor.intercept(ctx, handler));

    expect(result.data).toEqual([{ id: '1' }]);
    expect(result.meta).toEqual({ total: 50, page: 1, limit: 20 });
    expect(result.links).toEqual({ self: '?page=1', next: '?page=2' });
    expect(result.statusCode).toBe(200);
    expect(result.timestamp).toBeDefined();
    expect(result.path).toBe('/api/products');
  });

  it('passes through already-enveloped responses (with statusCode)', async () => {
    const enveloped = {
      data: { id: '1' },
      statusCode: 201,
    };
    const ctx = createMockContext('/api/products', 201);
    const handler = createMockHandler(enveloped);

    const result = await firstValueFrom(interceptor.intercept(ctx, handler));

    expect(result.data).toEqual({ id: '1' });
    expect(result.statusCode).toBe(201);
    expect(result.timestamp).toBeDefined();
    expect(result.path).toBe('/api/products');
  });

  it('handles null response data', async () => {
    const ctx = createMockContext('/api/products/999');
    const handler = createMockHandler(null);

    const result = await firstValueFrom(interceptor.intercept(ctx, handler));

    expect(result.data).toBeNull();
    expect(result.statusCode).toBe(200);
  });

  it('uses the response statusCode from context', async () => {
    const data = { id: '1' };
    const ctx = createMockContext('/api/products', 201);
    const handler = createMockHandler(data);

    const result = await firstValueFrom(interceptor.intercept(ctx, handler));

    expect(result.statusCode).toBe(201);
  });
});
