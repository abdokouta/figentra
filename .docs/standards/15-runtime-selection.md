# Runtime and HTTP Framework Selection

| Workload                            | Runtime            | Framework        |
| ----------------------------------- | ------------------ | ---------------- |
| Edge gateway                        | Cloudflare Workers | Hono             |
| Application Registry                | Cloudflare Workers | Hono             |
| Domain/platform service             | Node.js 24+        | NestJS + Fastify |
| Lightweight standalone edge adapter | Cloudflare Workers | Hono             |
| Webhook delivery                    | Container          | Convoy           |

## Rule

Do not replace NestJS domain services with Hono simply because Hono is faster.
Hono is the edge framework; NestJS is the application architecture for
substantial business services.

Do not use Express by default. Fastify is the standard Nest adapter.

## Why Fastify

Nest officially supports Fastify through `@nestjs/platform-fastify`, and Fastify
is designed as a low-overhead HTTP framework. citeturn2search0turn2search1
