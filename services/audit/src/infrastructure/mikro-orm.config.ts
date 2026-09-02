/**
 * @file mikro-orm.config.ts
 * @description PostgreSQL configuration for the Audit Service.
 *
 * Credentials are runtime secrets. This configuration is shared by NestJS and
 * the MikroORM migration CLI.
 */
import { Migrator } from "@mikro-orm/migrations";
import { defineConfig } from "@mikro-orm/postgresql";
import { AuditEntry } from "../audit/domain/audit-entry.entity.js";

/**
 * Defines the Audit Service persistence boundary.
 */
export default defineConfig({
  entities: [AuditEntry],
  extensions: [Migrator],
  dbName: process.env.DATABASE_NAME ?? "figentra_audit",
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 5432),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  migrations: {
    path: "./dist/database/migrations",
    pathTs: "./src/database/migrations",
    transactional: true,
    allOrNothing: true,
    emit: "ts",
  },
  connect: process.env.MIKRO_ORM_CONNECT !== "false",
  debug: process.env.MIKRO_ORM_DEBUG === "true",
});
