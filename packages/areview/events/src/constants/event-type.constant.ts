/** Platform event type registry. Domain services extend this vocabulary in their own contracts. */
export const FIGENTRA_EVENT_TYPES = {
  AUDIT_RECORDED: 'audit.recorded',
} as const;

export type FigentraEventType = typeof FIGENTRA_EVENT_TYPES[keyof typeof FIGENTRA_EVENT_TYPES];
