/**
 * @file check-messaging-contracts.mjs
 * @description Static repository gate for required messaging/security packages.
 */
import { access, readFile } from "node:fs/promises";

const required = [
  "packages/contracts/src/index.ts",
  "packages/areview/events/src/index.ts",
  "packages/areview/messaging/src/index.ts",
  "packages/areview/security/src/index.ts",
];

for (const file of required) {
  await access(file);
  const source = await readFile(file, "utf8");
  if (!source.includes("@file")) {
    throw new Error(`${file} is missing the required @file docblock`);
  }
}

console.log("Messaging/security contract gate passed.");
