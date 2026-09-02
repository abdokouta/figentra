/** @file index.ts @description Event contract testing helpers. */
export const assertEventType = (actual: string, expected: string): void => { if (actual !== expected) throw new Error(`Unexpected event type: ${actual}`); };
