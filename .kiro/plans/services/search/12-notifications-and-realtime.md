# Search — Notifications and Realtime

Search sends no business notifications. Search APIs are request/response. Realtime may emit a lightweight `search-index-updated` signal only for clients that explicitly subscribe; clients re-query Search after notification. No index payload is pushed through realtime.