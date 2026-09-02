/**
 * @file registration-and-discovery.test.ts
 * @description End-to-end integration tests for Application Registry API, D1 database, and KV caching.
 */
import { describe, expect, it, beforeEach } from "vitest";
import { createRegistry } from "@/app";
import { createTestD1Database, type MockD1Database } from "../helpers/d1-memory.helper";
import { MockKVNamespace } from "../helpers/kv-memory.helper";
import {
  createTestJwt,
  getTestJwtEnvironment,
  setupMockJwksFetch,
} from "../helpers/jwt.helper";

describe("Application Registry Integration & API Test Suite", () => {
  let db: MockD1Database;
  let kv: MockKVNamespace;
  let env: Record<string, unknown>;

  beforeEach(async () => {
    await setupMockJwksFetch();
    const jwtEnv = await getTestJwtEnvironment();
    db = createTestD1Database();
    kv = new MockKVNamespace();

    env = {
      DB: db,
      REGISTRY_CACHE: kv,
      IDENTITY_JWKS_URL: jwtEnv.jwksUrl,
      IDENTITY_ISSUER: jwtEnv.issuer,
      IDENTITY_AUDIENCE: "figentra:registry",
      REGISTRY_REGISTRATION_AUDIENCE: "figentra:registry:registration",
      REGISTRY_ROUTE_RESOLUTION_AUDIENCE: "figentra:registry:route-resolution",
      REGISTRY_ALLOWED_UPSTREAM_SUFFIX: "figentra.com",
    };
  });

  it("verifies health endpoints (live and ready)", async () => {
    const app = createRegistry();

    const liveRes = await app.request("https://registry.internal/health/live", {}, env as never);
    expect(liveRes.status).toBe(200);
    const liveBody = (await liveRes.json()) as { status: string };
    expect(liveBody.status).toBe("ok");

    const readyRes = await app.request("https://registry.internal/health/ready", {}, env as never);
    expect(readyRes.status).toBe(200);
    const readyBody = (await readyRes.json()) as { status: string };
    expect(readyBody.status).toBe("ready");
  });

  it("registers a complete application manifest and verifies database persistence across all tables", async () => {
    const app = createRegistry();
    const serviceToken = await createTestJwt({
      principal_type: "service",
      sub: "svc_billing_deployer",
      permissions: ["registry:application:register", "registry:read", "registry:route:resolve"],
      aud: ["figentra:registry", "figentra:registry:registration", "figentra:registry:route-resolution"],
    });

    const manifest = {
      slug: "figentra-billing",
      displayName: "Figentra Billing & Subscriptions",
      description: "Enterprise billing, invoice generation and multi-tenant payment handling",
      version: "1.0.0",
      branding: {
        primaryColor: "#4f46e5",
        logoUrl: "https://assets.figentra.com/billing-logo.svg",
      },
      metadata: {
        tier: "core",
        compliance: ["PCI-DSS", "SOC2"],
      },
      environments: [
        {
          environment: "development",
          deploymentUrl: "https://billing.dev.figentra.com",
          metadata: { region: "auto" },
        },
        {
          environment: "production",
          deploymentUrl: "https://billing.figentra.com",
          metadata: { region: "global" },
        },
      ],
      capabilities: ["iam", "multi-tenant", "audit-logging"],
      modules: [
        { key: "invoices", description: "Invoice generation and lifecycle" },
        { key: "subscriptions", description: "Recurring billing plans" },
      ],
      resources: [
        { moduleKey: "invoices", key: "invoice", label: "Customer Invoice" },
        { moduleKey: "subscriptions", key: "subscription", label: "Billing Plan" },
      ],
      actions: [
        {
          resourceKey: "invoice",
          key: "create",
          permission: "billing:invoices:create",
          metadata: { audit: true },
        },
        {
          resourceKey: "invoice",
          key: "read",
          permission: "billing:invoices:read",
          metadata: { audit: false },
        },
        {
          resourceKey: "subscription",
          key: "manage",
          permission: "billing:subscriptions:manage",
          metadata: { audit: true },
        },
      ],
      navigation: [
        {
          key: "invoices-nav",
          path: "/billing/invoices",
          label: "Invoices",
          icon: "receipt-tax",
          permission: "billing:invoices:read",
          metadata: { order: 10 },
        },
        {
          key: "subscriptions-nav",
          path: "/billing/subscriptions",
          label: "Subscriptions",
          icon: "credit-card",
          permission: "billing:subscriptions:manage",
          metadata: { order: 20 },
        },
      ],
      workflowDefinitions: [
        {
          key: "invoice-reconciliation",
          version: "1.0",
          description: "Nightly invoice reconciliation workflow",
          runtime: "cloudflare-workflow" as const,
          worker: "figentra-billing-worker",
          permissions: ["billing:invoices:manage"],
          metadata: { frequency: "cron:0_0_*_*_*" },
        },
      ],
      eventDefinitions: [
        {
          key: "invoice.paid",
          version: "1",
          direction: "produces" as const,
          topic: "figentra.billing.invoice.paid",
          metadata: { schemaVersion: "v1" },
        },
      ],
      integrations: [
        {
          key: "stripe-payments",
          provider: "stripe",
          kind: "payment-gateway",
          metadata: { webhookSupported: true },
        },
      ],
      settings: [
        {
          key: "default_currency",
          type: "string" as const,
          required: true,
          metadata: { defaultValue: "USD" },
        },
      ],
      features: [
        {
          key: "usage_based_billing",
          defaultEnabled: true,
          metadata: { beta: false },
        },
      ],
      widgets: [
        {
          key: "mrr-metric-widget",
          component: "@figentra/billing-widgets/MRRCard",
          version: "1.0.0",
          metadata: { slot: "dashboard.overview" },
        },
      ],
      localization: [
        {
          key: "billing-locales",
          namespace: "billing",
          locales: ["en", "fr", "de", "ar"],
          metadata: { fallback: "en" },
        },
      ],
      routes: [
        {
          method: "POST" as const,
          pathPattern: "/v1/invoices",
          upstream: "https://billing.figentra.com/v1/invoices",
          audience: "figentra:billing",
          requiredPermission: "billing:invoices:create",
          metadata: { rateLimit: 100 },
        },
        {
          method: "GET" as const,
          pathPattern: "/v1/invoices/:id",
          upstream: "https://billing.figentra.com/v1/invoices/:id",
          audience: "figentra:billing",
          requiredPermission: "billing:invoices:read",
          metadata: { rateLimit: 500 },
        },
      ],
    };

    // 1. Submit registration
    const regRes = await app.request(
      "https://registry.internal/v1/registrations",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${serviceToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(manifest),
      },
      env as never,
    );

    expect(regRes.status).toBe(201);
    const regBody = (await regRes.json()) as { id: string; slug: string; version: string; contentHash: string };
    expect(regBody.slug).toBe("figentra-billing");
    expect(regBody.version).toBe("1.0.0");
    expect(regBody.contentHash).toBeDefined();

    // 2. Query application root endpoint
    const appRes = await app.request(
      "https://registry.internal/v1/applications/figentra-billing",
      {
        headers: { authorization: `Bearer ${serviceToken}` },
      },
      env as never,
    );
    expect(appRes.status).toBe(200);
    const appData = (await appRes.json()) as { slug: string; display_name: string; current_version: string };
    expect(appData.slug).toBe("figentra-billing");
    expect(appData.display_name).toBe("Figentra Billing & Subscriptions");
    expect(appData.current_version).toBe("1.0.0");

    // 3. Query immutable version endpoint
    const versionRes = await app.request(
      "https://registry.internal/v1/applications/figentra-billing/versions/1.0.0",
      {
        headers: { authorization: `Bearer ${serviceToken}` },
      },
      env as never,
    );
    expect(versionRes.status).toBe(200);
    const versionData = (await versionRes.json()) as { version: string; manifest_hash: string };
    expect(versionData.version).toBe("1.0.0");
    expect(versionData.manifest_hash).toBeDefined();

    // 4. Query aggregated metadata endpoint
    const metaRes = await app.request(
      "https://registry.internal/v1/applications/figentra-billing/metadata",
      {
        headers: { authorization: `Bearer ${serviceToken}` },
      },
      env as never,
    );
    expect(metaRes.status).toBe(200);
    const metaData = (await metaRes.json()) as {
      capabilities: unknown[];
      modules: unknown[];
      resources: unknown[];
      actions: unknown[];
      navigation: unknown[];
      environments: unknown[];
      catalog: unknown[];
      workflows: unknown[];
      events: unknown[];
      integrations: unknown[];
      settings: unknown[];
      features: unknown[];
      widgets: unknown[];
      localization: unknown[];
    };
    expect(metaData.capabilities.length).toBe(3);
    expect(metaData.modules.length).toBe(2);
    expect(metaData.resources.length).toBe(2);
    expect(metaData.actions.length).toBe(3);
    expect(metaData.navigation.length).toBe(2);
    expect(metaData.environments.length).toBe(2);
    expect(metaData.workflows.length).toBe(1);
    expect(metaData.events.length).toBe(1);
    expect(metaData.integrations.length).toBe(1);
    expect(metaData.settings.length).toBe(1);
    expect(metaData.features.length).toBe(1);
    expect(metaData.widgets.length).toBe(1);
    expect(metaData.localization.length).toBe(1);

    // 5. Query first-class catalog categories
    const catalogWorkflows = await app.request(
      "https://registry.internal/v1/catalog/workflow?application=figentra-billing",
      {
        headers: { authorization: `Bearer ${serviceToken}` },
      },
      env as never,
    );
    expect(catalogWorkflows.status).toBe(200);
    const workflowCatalogBody = (await catalogWorkflows.json()) as { count: number };
    expect(workflowCatalogBody.count).toBe(1);

    // 6. Query workflow endpoint
    const workflowsRes = await app.request(
      "https://registry.internal/v1/workflows?application=figentra-billing",
      {
        headers: { authorization: `Bearer ${serviceToken}` },
      },
      env as never,
    );
    expect(workflowsRes.status).toBe(200);
    const workflowList = (await workflowsRes.json()) as { count: number; workflows: { workflow: string }[] };
    expect(workflowList.count).toBe(1);
    expect(workflowList.workflows[0]?.workflow).toBe("invoice-reconciliation");

    // 7. Query permissions inventory
    const permRes = await app.request(
      "https://registry.internal/v1/permissions?application=figentra-billing",
      {
        headers: { authorization: `Bearer ${serviceToken}` },
      },
      env as never,
    );
    expect(permRes.status).toBe(200);
    const permBody = (await permRes.json()) as { count: number; permissions: { permission: string }[] };
    const permissions = permBody.permissions.map((p) => p.permission);
    expect(permissions).toContain("billing:invoices:create");
    expect(permissions).toContain("billing:invoices:read");
    expect(permissions).toContain("billing:subscriptions:manage");

    // 8. Test Route Resolution
    const resolveRes = await app.request(
      "https://registry.internal/v1/routes/resolve?method=POST&path=/v1/invoices",
      {
        headers: { authorization: `Bearer ${serviceToken}` },
      },
      env as never,
    );
    expect(resolveRes.status).toBe(200);
    const route = (await resolveRes.json()) as {
      upstream: string;
      audience: string;
      requiredPermission: string;
    };
    expect(route.upstream).toBe("https://billing.figentra.com/v1/invoices");
    expect(route.audience).toBe("figentra:billing");
    expect(route.requiredPermission).toBe("billing:invoices:create");

    // 9. Verify KV caching
    expect(kv.has("route:POST:/v1/invoices")).toBe(true);
    expect(kv.has("application:figentra-billing")).toBe(true);
    expect(kv.has("metadata:figentra-billing")).toBe(true);
  });
});
