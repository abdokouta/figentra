import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineController } from '@/http/generators/crud-controller.factory';
import { NotFoundException } from '@nestjs/common';

// ============================================================================
// Mock Entity
// ============================================================================

class Product {
  id!: string;
  name!: string;
  price!: number;
}

// ============================================================================
// Mock Service
// ============================================================================

function createMockService() {
  return {
    findById: vi.fn(),
    paginateLengthAware: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    forceDelete: vi.fn(),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('defineController', () => {
  let mockService: ReturnType<typeof createMockService>;

  beforeEach(() => {
    mockService = createMockService();
  });

  it('returns a class (constructor function)', () => {
    const Controller = defineController({ entity: Product, path: 'products' });
    expect(typeof Controller).toBe('function');
  });

  it('can be instantiated and has service property', () => {
    const Controller = defineController({ entity: Product, path: 'products' });
    const instance = new (Controller as any)();
    instance.service = mockService;
    expect(instance.service).toBe(mockService);
  });

  describe('list action', () => {
    it('calls paginateLengthAware with parsed query params', async () => {
      const Controller = defineController({ entity: Product, path: 'products' });
      const instance = new (Controller as any)();
      instance.service = mockService;

      mockService.paginateLengthAware.mockResolvedValue({
        items: [{ id: '1', name: 'Widget' }],
        meta: { total: 1, page: 1, limit: 20 },
      });

      const result = await instance.list({ page: '1', limit: '20' });

      expect(mockService.paginateLengthAware).toHaveBeenCalledWith(1, 20, undefined, undefined);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('passes sort from query to service', async () => {
      const Controller = defineController({ entity: Product, path: 'products' });
      const instance = new (Controller as any)();
      instance.service = mockService;

      mockService.paginateLengthAware.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 1, limit: 20 },
      });

      await instance.list({ page: '1', limit: '10', sort: '-price,name' });

      expect(mockService.paginateLengthAware).toHaveBeenCalledWith(1, 10, undefined, {
        price: 'desc',
        name: 'asc',
      });
    });

    it('throws NotFoundException when list action is disabled', async () => {
      const Controller = defineController({
        entity: Product,
        path: 'products',
        actions: { list: false },
      });
      const instance = new (Controller as any)();
      instance.service = mockService;

      await expect(instance.list({})).rejects.toThrow(NotFoundException);
    });
  });

  describe('show action', () => {
    it('returns formatted entity when found', async () => {
      const Controller = defineController({ entity: Product, path: 'products' });
      const instance = new (Controller as any)();
      instance.service = mockService;

      const product = { id: 'abc', name: 'Widget', price: 9.99 };
      mockService.findById.mockResolvedValue(product);

      const result = await instance.show('abc');

      expect(mockService.findById).toHaveBeenCalledWith('abc');
      expect(result.data).toEqual(product);
      expect(result.statusCode).toBe(200);
    });

    it('throws NotFoundException when entity not found', async () => {
      const Controller = defineController({ entity: Product, path: 'products' });
      const instance = new (Controller as any)();
      instance.service = mockService;

      mockService.findById.mockResolvedValue(null);

      await expect(instance.show('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when show action is disabled', async () => {
      const Controller = defineController({
        entity: Product,
        path: 'products',
        actions: { show: false },
      });
      const instance = new (Controller as any)();
      instance.service = mockService;

      await expect(instance.show('abc')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create action', () => {
    it('calls service.create and returns 201', async () => {
      const Controller = defineController({ entity: Product, path: 'products' });
      const instance = new (Controller as any)();
      instance.service = mockService;

      const input = { name: 'New Product', price: 19.99 };
      const created = { id: 'new-id', ...input };
      mockService.create.mockResolvedValue(created);

      const result = await instance.create(input);

      expect(mockService.create).toHaveBeenCalledWith(input);
      expect(result.data).toEqual(created);
      expect(result.statusCode).toBe(201);
    });

    it('throws NotFoundException when create action is disabled', async () => {
      const Controller = defineController({
        entity: Product,
        path: 'products',
        actions: { create: false },
      });
      const instance = new (Controller as any)();
      instance.service = mockService;

      await expect(instance.create({})).rejects.toThrow(NotFoundException);
    });
  });

  describe('update action', () => {
    it('calls service.update with id merged into input', async () => {
      const Controller = defineController({ entity: Product, path: 'products' });
      const instance = new (Controller as any)();
      instance.service = mockService;

      const updated = { id: 'abc', name: 'Updated', price: 29.99 };
      mockService.update.mockResolvedValue(updated);

      const result = await instance.update('abc', { name: 'Updated', price: 29.99 });

      expect(mockService.update).toHaveBeenCalledWith({ id: 'abc', name: 'Updated', price: 29.99 });
      expect(result.data).toEqual(updated);
    });
  });

  describe('remove action', () => {
    it('calls service.softDelete', async () => {
      const Controller = defineController({ entity: Product, path: 'products' });
      const instance = new (Controller as any)();
      instance.service = mockService;

      const deleted = { id: 'abc', name: 'Widget', deletedAt: new Date() };
      mockService.softDelete.mockResolvedValue(deleted);

      const result = await instance.remove('abc');

      expect(mockService.softDelete).toHaveBeenCalledWith('abc');
      expect(result.data).toEqual(deleted);
    });
  });

  describe('restore action', () => {
    it('calls service.restore', async () => {
      const Controller = defineController({ entity: Product, path: 'products' });
      const instance = new (Controller as any)();
      instance.service = mockService;

      const restored = { id: 'abc', name: 'Widget', deletedAt: null };
      mockService.restore.mockResolvedValue(restored);

      const result = await instance.restore('abc');

      expect(mockService.restore).toHaveBeenCalledWith('abc');
      expect(result.data).toEqual(restored);
    });
  });

  describe('forceDelete action', () => {
    it('throws NotFoundException when forceDelete is disabled (default)', async () => {
      const Controller = defineController({ entity: Product, path: 'products' });
      const instance = new (Controller as any)();
      instance.service = mockService;

      await expect(instance.forceDelete('abc')).rejects.toThrow(NotFoundException);
    });

    it('calls service.forceDelete when enabled', async () => {
      const Controller = defineController({
        entity: Product,
        path: 'products',
        actions: { forceDelete: true },
      });
      const instance = new (Controller as any)();
      instance.service = mockService;

      mockService.forceDelete.mockResolvedValue(true);

      await instance.forceDelete('abc');

      expect(mockService.forceDelete).toHaveBeenCalledWith('abc');
    });
  });

  describe('resourceName option', () => {
    it('uses custom resourceName in error messages', async () => {
      const Controller = defineController({
        entity: Product,
        path: 'products',
        resourceName: 'Item',
      });
      const instance = new (Controller as any)();
      instance.service = mockService;

      mockService.findById.mockResolvedValue(null);

      await expect(instance.show('x')).rejects.toThrow('Item not found');
    });

    it('defaults resourceName to entity class name', async () => {
      const Controller = defineController({ entity: Product, path: 'products' });
      const instance = new (Controller as any)();
      instance.service = mockService;

      mockService.findById.mockResolvedValue(null);

      await expect(instance.show('x')).rejects.toThrow('Product not found');
    });
  });
});
