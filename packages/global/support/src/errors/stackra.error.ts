/**
 * @file stackra.error.ts
 * @module @stackra/support/errors
 * @description Base error class for every framework-thrown error in
 *   the `@stackra/*` workspace. Every package-level base
 *   (`HttpError`, `CacheError`, `SduiError`, `ScopeError`, …)
 *   extends this class so a single `instanceof StackraError` check
 *   catches any framework failure across the graph.
 *
 *   ## Shape
 *   - `code` — machine-readable identifier (`HTTP_ERROR`,
 *     `CACHE_DRIVER_NOT_FOUND`, …). Defaults to `"STACKRA_ERROR"`.
 *   - `context` — optional structured payload for logs / telemetry.
 *   - `cause` — native ES2022 chaining. Anything (string, Error,
 *     unknown-thrown value) is accepted.
 *   - `toJSON()` — deterministic serialisation for the logger,
 *     `serializeError`, and wire transport.
 *
 *   ## Constructor signatures
 *   Accepts both the legacy 2-arg `(message, code)` form used by
 *   most existing base classes AND the richer
 *   `(message, { code, context, cause })` options bag. Migration
 *   scripts can safely swap `extends Error` for `extends StackraError`
 *   without touching downstream `super(message, code)` calls.
 *
 *   ## Instance-of safety
 *   Every constructor path restores the prototype via
 *   `Object.setPrototypeOf(this, new.target.prototype)` and invokes
 *   `Error.captureStackTrace` when the engine supports it. Subclasses
 *   inherit both behaviours for free.
 */

// ════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════

/**
 * Structured options accepted by {@link StackraError}'s constructor.
 */
export interface IStackraErrorOptions {
  /** Machine-readable code (default: `"STACKRA_ERROR"`). */
  readonly code?: string;
  /** Optional structured payload attached to logs / telemetry. */
  readonly context?: Record<string, unknown>;
  /** Native ES2022 error chaining — accepts anything thrown. */
  readonly cause?: unknown;
}

/**
 * Structured shape returned by {@link StackraError.toJSON}. Consumers
 * that need the exact JSON shape can type-check against this.
 */
export interface ISerializedStackraError {
  readonly name: string;
  readonly code: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
  readonly cause?: unknown;
  readonly stack?: string;
}

// ════════════════════════════════════════════════════════════════════
// Error
// ════════════════════════════════════════════════════════════════════

/**
 * Base error for every framework-thrown error in the `@stackra/*`
 * workspace. See the file-level docblock for the design contract.
 */
export class StackraError extends Error {
  /** Machine-readable code — subclasses override with their own. */
  public readonly code: string;

  /** Optional structured payload attached to logs / telemetry. */
  public readonly context?: Record<string, unknown>;

  /** Native ES2022 chaining — narrowed to `unknown` (accepts anything). */
  public override readonly cause?: unknown;

  /**
   * @param message - Human-readable description.
   * @param codeOrOptions - Either a string code (legacy 2-arg form
   *   for compatibility with existing base-error constructors that
   *   call `super(message, code)`) OR an options bag with `code`,
   *   `context`, `cause`.
   */
  public constructor(
    message: string,
    codeOrOptions?: string | IStackraErrorOptions,
  ) {
    super(message);

    // Normalise the polymorphic 2nd arg into the options bag.
    const options: IStackraErrorOptions =
      typeof codeOrOptions === "string"
        ? { code: codeOrOptions }
        : (codeOrOptions ?? {});

    // Subclass name — visible in stack traces without every
    // subclass having to remember `this.name = "XxxError"`.
    this.name = new.target.name;
    this.code = options.code ?? "STACKRA_ERROR";
    if (options.context !== undefined) {
      this.context = options.context;
    }
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }

    // Legacy pre-ES2015 instanceof-safety — required for TS
    // compile targets < ES2015 where extending built-ins loses
    // the prototype. Modern targets are safe but this is a
    // cheap no-op.
    Object.setPrototypeOf(this, new.target.prototype);

    // V8-style stack-trace clean-up when available.
    const withCapture = Error as unknown as {
      captureStackTrace?: (target: object, constructorOpt?: Function) => void;
    };
    if (typeof withCapture.captureStackTrace === "function") {
      withCapture.captureStackTrace(this, new.target);
    }
  }

  /**
   * Deterministic serialisation of this error into a plain object
   * suitable for logger transports, `serializeError`, and wire
   * transport. Unset fields (`context`, `cause`, `stack`) are
   * omitted rather than emitted as `undefined`.
   */
  public toJSON(): ISerializedStackraError {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      ...(this.context !== undefined ? { context: this.context } : {}),
      ...(this.cause !== undefined ? { cause: this.cause } : {}),
      ...(this.stack !== undefined ? { stack: this.stack } : {}),
    };
  }
}
