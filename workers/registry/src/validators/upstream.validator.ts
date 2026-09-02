/**
 * @file upstream.validator.ts
 * @description SSRF validation for registered application upstreams.
 */

/**
 * Rejects unsafe or non-Figentra upstream targets before they enter the routing catalog.
 */
export function validateUpstreams(routes: readonly { upstream: string }[], allowedSuffix: string): void {
  const suffix = allowedSuffix.toLowerCase().replace(/^\./, '');
  for (const route of routes) {
    const url = new URL(route.upstream);
    if (url.protocol !== 'https:') throw new Error('upstream must use HTTPS');
    if (url.username || url.password) throw new Error('upstream credentials are forbidden');
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.internal')) {
      throw new Error('private/internal upstream host is forbidden');
    }
    if (hostname !== suffix && !hostname.endsWith(`.${suffix}`)) {
      throw new Error(`upstream host is outside the approved suffix: ${hostname}`);
    }
  }
}
