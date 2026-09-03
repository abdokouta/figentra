import { z } from "zod";
import { environmentSchema } from "./environment.schema";
import { moduleSchema, resourceSchema, actionSchema } from "./structure.schema";
import { workflowDefinitionSchema } from "./workflow.schema";
import { eventDefinitionSchema } from "./event.schema";
import { integrationSchema } from "./integration.schema";
import { settingSchema } from "./setting.schema";
import { featureSchema } from "./feature.schema";
import { widgetSchema } from "./widget.schema";
import { localizationSchema } from "./localization.schema";
import { navigationSchema } from "./navigation.schema";
import { routeSchema } from "./route.schema";

export const applicationManifestSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/),
  displayName: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  version: z.string().regex(/^v?\d+\.\d+\.\d+([+-][0-9A-Za-z.-]+)?$/),
  branding: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  environments: z.array(environmentSchema).max(100).optional(),
  capabilities: z.array(z.string().min(1).max(100)).max(100).optional(),
  modules: z.array(moduleSchema).max(100).optional(),
  resources: z.array(resourceSchema).max(100).optional(),
  actions: z.array(actionSchema).max(100).optional(),
  workflowDefinitions: z.array(workflowDefinitionSchema).max(500).optional(),
  eventDefinitions: z.array(eventDefinitionSchema).max(500).optional(),
  integrations: z.array(integrationSchema).max(500).optional(),
  settings: z.array(settingSchema).max(500).optional(),
  features: z.array(featureSchema).max(500).optional(),
  widgets: z.array(widgetSchema).max(500).optional(),
  localization: z.array(localizationSchema).max(500).optional(),
  navigation: z.array(navigationSchema).max(500).optional(),
  routes: z.array(routeSchema),
});

export type ApplicationManifest = z.infer<typeof applicationManifestSchema>;
