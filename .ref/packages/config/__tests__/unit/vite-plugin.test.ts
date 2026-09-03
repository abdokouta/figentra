import { describe, it, expect } from 'vitest';
import { stackraConfigPlugin } from '@/vite/stackra-config.plugin';

describe('stackraConfigPlugin', () => {
  it('should return a plugin with correct name', () => {
    const plugin = stackraConfigPlugin();
    expect(plugin.name).toBe('stackra-config');
  });

  it('should resolve the virtual module ID', () => {
    const plugin = stackraConfigPlugin();
    const resolved = plugin.resolveId!('virtual:stackra-config');
    expect(resolved).toBe('\0virtual:stackra-config');
  });

  it('should not resolve non-virtual IDs', () => {
    const plugin = stackraConfigPlugin();
    const resolved = plugin.resolveId!('some-other-module');
    expect(resolved).toBeNull();
  });

  it('should return empty export for missing config dir', async () => {
    const plugin = stackraConfigPlugin({ configDir: '/nonexistent/path' });
    const code = await plugin.load!('\0virtual:stackra-config');
    expect(code).toBe('export default {};');
  });

  it('should not load non-virtual module IDs', async () => {
    const plugin = stackraConfigPlugin();
    const result = await plugin.load!('regular-module');
    expect(result).toBeNull();
  });

  it('should accept custom configDir option', () => {
    const plugin = stackraConfigPlugin({ configDir: 'my-config' });
    expect(plugin.name).toBe('stackra-config');
  });

  it('should accept envPrefix as string', () => {
    const plugin = stackraConfigPlugin({ envPrefix: 'MYAPP_' });
    expect(plugin.name).toBe('stackra-config');
  });

  it('should accept envPrefix as array', () => {
    const plugin = stackraConfigPlugin({ envPrefix: ['VITE_', 'NEXT_PUBLIC_'] });
    expect(plugin.name).toBe('stackra-config');
  });

  it('should inject env vars into HTML via transformIndexHtml', () => {
    process.env.VITE_APP_NAME = 'TestApp';
    const plugin = stackraConfigPlugin({ envPrefix: ['VITE_'] });
    const html = '<html><head></head><body></body></html>';
    const result = plugin.transformIndexHtml!(html);
    expect(result).toContain('window.__APP_CONFIG__');
    expect(result).toContain('TestApp');
    delete process.env.VITE_APP_NAME;
  });

  it('should not modify HTML when no matching env vars', () => {
    const plugin = stackraConfigPlugin({ envPrefix: ['NONEXISTENT_PREFIX_'] });
    const html = '<html><head></head><body></body></html>';
    const result = plugin.transformIndexHtml!(html);
    expect(result).toBe(html);
  });
});
