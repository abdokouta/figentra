/**
 * @file logger-error-boundary-props.interface.ts
 * @module @stackra/logger/src/interfaces
 * @description ILoggerErrorBoundaryProps interface.
 */

/**
 * Props for the LoggerErrorBoundary component.
 */
export interface ILoggerErrorBoundaryProps {
  /** Children to render inside the boundary. */
  children: ReactNode;

  /** Optional fallback UI to render when an error is caught. */
  fallback?: ReactNode | ((error: Error) => ReactNode);

  /** Optional context name for the logger. Defaults to 'ErrorBoundary'. */
  context?: string;
}
