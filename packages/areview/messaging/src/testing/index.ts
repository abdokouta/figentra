/** @file index.ts @description Messaging testing exports. */
export const createNoopPublisher = () => ({ publish: async () => undefined });
