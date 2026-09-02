# Favicon wiring

Every consumer app copies this folder to `public/` (or the framework's
static-assets root) and adds the following markup + manifest.

## HTML head

```html
<!-- Modern favicon stack -->
<link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32">
<link rel="icon" type="image/png" href="/favicon-16.png" sizes="16x16">
<link rel="apple-touch-icon" href="/apple-touch-180.png" sizes="180x180">
<link rel="icon" type="image/x-icon" href="/favicon.ico"><!-- fallback -->

<!-- PWA -->
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#141414">
```

## manifest.webmanifest

```json
{
  "name": "Figentra",
  "short_name": "Figentra",
  "description": "AI-agent-first infrastructure.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#141414",
  "theme_color": "#141414",
  "icons": [
    { "src": "/android-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/pwa-512.png",     "sizes": "512x512", "type": "image/png" },
    { "src": "/pwa-512.png",     "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## Notes

- Every PNG carries the same F-Cursor mark composed on a `#141414`
  (ink) background. Same brand tokens as `docs/brand/14-color-system.md`.
- Browser-tab favicons (16/32/64) render with sharp corners because
  the browser paints its own tab chrome around them.
- Touch/PWA icons (180/192/512) carry a `--radius-5`-equivalent
  rounded corner (24 units at the source 120 viewBox) so they read
  as consumer-app icons on iOS + Android home screens.
- To regenerate: `node .tmp/scripts/export-favicons.mjs`
