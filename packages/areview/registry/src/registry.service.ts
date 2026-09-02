import { Inject, Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { REGISTRY_OPTIONS, type RegistryFeature, type RegistryModuleOptions, type RegistryManifestExtras } from "./registry.types.js";
import { RegistryDiscoveryService } from "./registry.discovery.js";

/** Composes and registers the application manifest. */
@Injectable()
export class RegistryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RegistryService.name);
  private readonly features: RegistryFeature[] = [];
  private extras: RegistryManifestExtras = {};

  constructor(
    @Inject(REGISTRY_OPTIONS) private readonly options: RegistryModuleOptions,
    private readonly discovery?: RegistryDiscoveryService,
  ) {}

  addFeature(feature: RegistryFeature): void {
    this.features.push(feature);
  }

  /** Adds manifest-only future category metadata without creating ad-hoc D1 writes. */
  addManifestExtras(extras: RegistryManifestExtras): void {
    this.extras = { ...this.extras, ...extras };
  }

  getManifest(): Record<string, unknown> {
    const discovered = this.discovery?.collect() ?? [];
    const discoveredFeature: RegistryFeature = {
      modules: discovered.filter((record) => record.kind === "module").map((record) => record.value),
      resources: discovered.filter((record) => record.kind === "resource").map((record) => record.value),
      actions: discovered.filter((record) => record.kind === "action").map((record) => record.value),
      navigation: discovered.filter((record) => record.kind === "navigation").map((record) => record.value),
      capabilities: discovered.filter((record) => record.kind === "capability").map((record) => record.value),
    };
    const allFeatures = [...this.features, discoveredFeature];
    const uniqueByKey = <T extends { key: string }>(items: T[]): T[] => {
      const seen = new Set<string>();
      return items.filter((item) => {
        if (seen.has(item.key)) return false;
        seen.add(item.key);
        return true;
      });
    };
    const discoveredCatalog = {
      workflowDefinitions: discovered.filter((record) => record.kind === 'workflow').map((record) => record.value),
      eventDefinitions: discovered.filter((record) => record.kind === 'event').map((record) => record.value),
      integrations: discovered.filter((record) => record.kind === 'integration').map((record) => record.value),
      settings: discovered.filter((record) => record.kind === 'setting').map((record) => record.value),
      features: discovered.filter((record) => record.kind === 'feature').map((record) => record.value),
      widgets: discovered.filter((record) => record.kind === 'widget').map((record) => record.value),
      localization: discovered.filter((record) => record.kind === 'localization').map((record) => record.value),
    };

    return {
      slug: this.options.application,
      displayName: this.options.application,
      version: this.options.version,
      environments: this.options.environment ? [{ environment: this.options.environment }] : [],
      capabilities: allFeatures.flatMap((f) => (f.capabilities ?? []).map((x) => x.key)),
      modules: allFeatures.flatMap((f) => f.modules ?? []),
      resources: allFeatures.flatMap((f) => f.resources ?? []),
      actions: allFeatures.flatMap((f) => f.actions ?? []),
      navigation: allFeatures.flatMap((f) => f.navigation ?? []),
      workflowDefinitions: uniqueByKey([...allFeatures.flatMap((f) => f.workflows ?? []), ...discoveredCatalog.workflowDefinitions]),
      eventDefinitions: uniqueByKey([...allFeatures.flatMap((f) => f.events ?? []), ...discoveredCatalog.eventDefinitions]),
      integrations: uniqueByKey([...allFeatures.flatMap((f) => f.integrations ?? []), ...discoveredCatalog.integrations]),
      settings: uniqueByKey([...allFeatures.flatMap((f) => f.settings ?? []), ...discoveredCatalog.settings]),
      features: uniqueByKey([...allFeatures.flatMap((f) => f.features ?? []), ...discoveredCatalog.features]),
      widgets: uniqueByKey([...allFeatures.flatMap((f) => f.widgets ?? []), ...discoveredCatalog.widgets]),
      localization: uniqueByKey([...allFeatures.flatMap((f) => f.localization ?? []), ...discoveredCatalog.localization]),
      routes: [],
      ...this.extras,
    };
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.register();
  }

  async register(): Promise<void> {
    if (this.options.enabled === false) return;
    if (!this.options.registrationToken) {
      const required = this.options.requireRegistrationToken ?? this.options.environment === 'production';
      if (required) throw new Error('Registry registration token is required when Registry registration is enabled.');
      this.logger.warn('Registry registration skipped because no registration token was configured.');
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.registrationTimeoutMs ?? 10_000);
    const requestId = crypto.randomUUID();

    try {
      const response = await fetch(`${this.options.registryUrl.replace(/\/$/, "")}/v1/registrations`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.options.registrationToken}`,
          "x-request-id": requestId,
        },
        body: JSON.stringify(this.getManifest()),
        signal: controller.signal,
      });

      if (!response.ok && response.status !== 409) {
        const body = await response.text();
        const message = `Registry registration failed (${response.status}): ${body.slice(0, 500)}`;
        if (this.options.failOnRegistrationError) throw new Error(message);
        this.logger.error(message);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
