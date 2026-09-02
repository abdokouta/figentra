import fs from "node:fs";
const checks = [
  ["workers/registry/README.md", "Registry category inventory"],
  ["workers/registry/database/migrations/0011_application_navigation.sql", "Registry navigation schema"],
  ["packages/areview/registry/src/registry.module.ts", "Nest RegistryModule"],
  ["workers/infrastructure-orchestrator/database/migrations/0002_environment_execution_lock.sql", "Orchestrator environment lock"],
  ["workers/infrastructure-orchestrator/src/workflows/infrastructure.workflow.ts", "Orchestrator retries"],
  ["workers/workflow-runtime/src/workflow.runtime.ts", "Generic Cloudflare workflow runtime"],
  ["packages/areview/workflows/src/nest/workflow.discovery.service.ts", "Workflow Nest discovery"],
];
const missing = checks.filter(([file]) => !fs.existsSync(file));
if (missing.length) { console.error(missing.map(([f,d]) => `${d}: ${f}`).join("\n")); process.exit(1); }
console.log("Control-plane architecture checks passed.");
