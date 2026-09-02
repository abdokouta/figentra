import 'reflect-metadata';

/** Stable reflection key consumed by Registry producer discovery. */
export const EVENT_METADATA = Symbol.for('figentra:event');

export interface EventMetadata {
  type: string;
  version: string;
  topic?: string;
  description?: string;
  direction?: 'produces' | 'consumes';
}

/** Declares an event type without coupling the events package to Registry. */
export function Event(type: string, options: Omit<EventMetadata, 'type'> = {}): ClassDecorator {
  return (target) => Reflect.defineMetadata(EVENT_METADATA, { type, version: '1', ...options }, target);
}
