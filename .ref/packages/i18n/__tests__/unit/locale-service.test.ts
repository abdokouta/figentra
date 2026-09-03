import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nLocaleService } from '../../src/core/services/i18n-locale.service';
import { DirectionService } from '../../src/core/services/direction.service';
import type { ILocaleStorage } from '../../src/core/services/i18n-locale.service';
import type { IDirectionAdapter } from '../../src/core/interfaces';

describe('I18nLocaleService', () => {
  let service: I18nLocaleService;
  let directionService: DirectionService;
  let mockStorage: ILocaleStorage;
  let mockAdapter: IDirectionAdapter;

  beforeEach(() => {
    mockAdapter = {
      apply: vi.fn().mockReturnValue(false),
      getCurrentDirection: vi.fn().mockReturnValue('ltr'),
    };

    mockStorage = {
      getLocale: vi.fn().mockResolvedValue(null),
      setLocale: vi.fn().mockResolvedValue(undefined),
      clearLocale: vi.fn().mockResolvedValue(undefined),
    };

    directionService = new DirectionService(mockAdapter);

    service = new I18nLocaleService(
      { defaultLocale: 'en', supportedLocales: ['en', 'ar', 'fr'] } as any,
      directionService,
      mockStorage
    );
  });

  it('starts with the default locale', () => {
    expect(service.getLocale()).toBe('en');
  });

  it('returns correct direction for default locale', () => {
    expect(service.getDir()).toBe('ltr');
    expect(service.isRTL()).toBe(false);
  });

  it('returns supported locales', () => {
    expect(service.getSupportedLocales()).toEqual(['en', 'ar', 'fr']);
  });

  describe('setLocale()', () => {
    it('switches to a supported locale', async () => {
      await service.setLocale('ar');
      expect(service.getLocale()).toBe('ar');
    });

    it('persists locale to storage', async () => {
      await service.setLocale('fr');
      expect(mockStorage.setLocale).toHaveBeenCalledWith('fr');
    });

    it('applies direction via adapter', async () => {
      await service.setLocale('ar');
      expect(mockAdapter.apply).toHaveBeenCalledWith('rtl', 'ar');
    });

    it('triggers onLocaleChange callback', async () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      service.setOnLocaleChange(callback);

      await service.setLocale('ar');
      expect(callback).toHaveBeenCalledWith('ar');
    });

    it('throws for unsupported locale', async () => {
      await expect(service.setLocale('de')).rejects.toThrow('not supported');
    });

    it('returns false when locale does not change', async () => {
      const result = await service.setLocale('en');
      expect(result).toBe(false);
    });

    it('returns true when adapter signals restart needed', async () => {
      (mockAdapter.apply as any).mockReturnValue(true);
      const result = await service.setLocale('ar');
      expect(result).toBe(true);
    });
  });

  describe('getPersistedLocale()', () => {
    it('returns stored locale if supported', async () => {
      (mockStorage.getLocale as any).mockResolvedValue('fr');
      expect(await service.getPersistedLocale()).toBe('fr');
    });

    it('returns null if stored locale is not supported', async () => {
      (mockStorage.getLocale as any).mockResolvedValue('de');
      expect(await service.getPersistedLocale()).toBeNull();
    });

    it('returns null if no stored locale', async () => {
      (mockStorage.getLocale as any).mockResolvedValue(null);
      expect(await service.getPersistedLocale()).toBeNull();
    });
  });
});
