---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
package: '@stackra/ai'
---
# `@stackra/ai` — Provider-neutral AI Capability

## Boundary
Reusable contracts for model invocation, embeddings, structured output, tool calls, streaming, retrieval and safety. AI is not a fifth business data owner. Domain services own prompts/business workflows and the Analytics/Files/Search services retain their ownership boundaries.

## Subpaths
```text
@stackra/ai
@stackra/ai/openai
@stackra/ai/anthropic
@stackra/ai/google
@stackra/ai/embeddings
@stackra/ai/rag
@stackra/ai/tools
@stackra/ai/nestjs
@stackra/ai/react
@stackra/ai/testing
```
Provider SDKs are imported only by adapters. Application code consumes normalized contracts.

## Public API
```ts
interface AiClient { generate(input:GenerateInput):Promise<GenerateResult>; stream(input:GenerateInput):AsyncIterable<GenerateChunk>; embed(input:EmbeddingInput):Promise<EmbeddingResult>; structured<T>(input:StructuredInput<T>):Promise<T>; }
interface AiTool { name:string; inputSchema:JsonSchema; execute(ctx:RequestContext,input:unknown):Promise<unknown>; }
interface RetrievalSource { retrieve(ctx:RequestContext,input:RetrievalInput):Promise<readonly RetrievedChunk[]>; }
```

## E2E
```text
React/mobile
 → @stackra/ai client
 → Gateway
 → owning NestJS service
 → AI adapter
 → provider
```
RAG:
```text
source service/files
 → chunk/embed
 → Search/vector provider
 → retrieve
 → policy filters
 → model
 → typed answer
```
No frontend provider keys. No unrestricted model-generated SQL or commands.

## Security
Models receive least-privilege tool capabilities and tenant-scoped retrieval. Prompt/data classification is enforced. Secrets and restricted PII are redacted according to policy. Tool calls are explicit typed operations and pass IAM/domain authorization before execution.

## Reliability/cost
Timeout, token/byte limits, retryability and provider fallback are explicit per model class. Streaming handles disconnect/cancel. Usage is emitted to Usage/Analytics as appropriate; AI package never invents billing semantics.

## Testing
Provider conformance with record/replay fixtures, structured-output validation, tool authorization, prompt-injection defenses, tenant isolation, stream cancellation, provider outage/fallback and cost-budget tests.
