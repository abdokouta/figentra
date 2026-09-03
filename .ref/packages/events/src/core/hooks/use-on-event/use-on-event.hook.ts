/**
 * @file use-on-event.hook.ts
 * @module @stackra/events/react
 * @description React hook for subscribing to events with automatic
 *   cleanup. Subscribes on mount and unsubscribes on unmount (or
 *   when the event name / caller-supplied deps change). Prevents
 *   memory leaks from orphaned listeners.
 *
 *   Signature matches `.kiro/steering/events-authoring.md` —
 *   `useOnEvent<TPayload>(name, handler, deps?)`.
 */

import { useInject } from "@stackra/container/react";
import { EVENT_EMITTER } from "@stackra/contracts";
import { useEffect, useRef } from "react";

import type { EventListener } from "../../interfaces/listener-entry.interface";

import { type EventEmitter } from "../../services/event-emitter.service";

/**
 * Subscribe to an event with automatic cleanup on unmount, typed
 * against the payload the emitter will deliver.
 *
 * The handler is subscribed when the component mounts and
 * automatically unsubscribed when it unmounts, when the event name
 * changes, or when any value in the optional `deps` array changes.
 * The handler REFERENCE is held on a ref that gets refreshed each
 * render — a component that closes over changing state does NOT
 * cause a re-subscribe just because the handler identity changed.
 *
 * @typeParam TPayload - Payload type the emitter delivers for this
 *   event. Defaults to `unknown` when the caller does not
 *   parameterise it, keeping the runtime lenient at the cost of the
 *   handler needing a runtime narrow.
 * @param event - Event name or wildcard pattern to subscribe to.
 * @param handler - Callback invoked when the event fires. Receives
 *   the payload as its sole argument.
 * @param deps - Optional additional dependencies that trigger a
 *   re-subscribe when any change. Rare — the ref pattern above
 *   handles handler-identity changes without a resubscribe, so
 *   `deps` is only needed when the SUBSCRIPTION itself should
 *   change with a value (e.g. a channel id embedded in `event` is
 *   the more idiomatic path).
 *
 * @example
 * ```typescript
 * interface IOrderCreatedPayload {
 *   readonly orderId: string;
 * }
 *
 * function OrderNotification() {
 *   useOnEvent<IOrderCreatedPayload>('order.created', (payload) => {
 *     toast.success(`New order: ${payload.orderId}`);
 *   });
 *
 *   return null; // renders nothing, just listens
 * }
 * ```
 *
 * @example
 * ```typescript
 * function ChatMessage({ channelId }: Props) {
 *   const [messages, setMessages] = useState<Message[]>([]);
 *
 *   useOnEvent<Message>(`chat.${channelId}.message`, (msg) => {
 *     setMessages(prev => [...prev, msg]);
 *   });
 *
 *   return <MessageList messages={messages} />;
 * }
 * ```
 */
export function useOnEvent<TPayload = unknown>(
  event: string | symbol,
  handler: (payload: TPayload) => void | Promise<void>,
  deps?: readonly unknown[],
): void {
  const emitter = useInject<EventEmitter>(EVENT_EMITTER);

  // Keep a stable reference to the latest handler so a re-render
  // with a new handler identity does NOT tear down the subscription.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  // Subscription lifecycle — resubscribes when the emitter, the
  // event name, or any caller-supplied dep changes. React's
  // exhaustive-deps rule cannot statically verify a spread deps
  // array, but the shape mirrors every "extra deps" hook API in
  // the workspace, and the ref above keeps handler-identity churn
  // isolated from this effect.
  useEffect(
    () => {
      // Wrapper preserves the emitter's `(...args)` calling shape
      // while presenting a single-arg typed handler upstream. Most
      // Stackra events emit a single payload; wildcard listeners
      // that observe an emitter's `(name, payload, meta)` triple
      // are the edge case and should keep using the untyped
      // `EventListener` shape from `@stackra/events`.
      const listener: EventListener = (...args: unknown[]) => {
        return handlerRef.current(args[0] as TPayload);
      };

      emitter.on(event, listener);

      return () => {
        emitter.off(event, listener);
      };
    },
    // Base deps stay `[emitter, event]`; optional `deps` merges in
    // for the rare consumer that needs subscription lifetime tied
    // to caller state.

    deps ? [emitter, event, ...deps] : [emitter, event],
  );
}
