/**
 * @file logger-error-boundary.component.tsx
 * @module @stackra/logger/react/components
 * @description React error boundary that auto-logs caught errors via LoggerManager.
 *   Catches unhandled errors in the component tree and emits them at FATAL level
 *   with the component stack trace as metadata.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { LoggerManager } from '../../core/services/logger-manager.service';

/**
 * State for the LoggerErrorBoundary component.
 */
export interface ILoggerErrorBoundaryState {
  /** Whether an error has been caught. */
  hasError: boolean;

  /** The caught error instance. */
  error: Error | null;
}

/**
 * React error boundary that auto-logs caught errors at FATAL level.
 *
 * When an error is caught in the component tree, this boundary:
 * 1. Logs the error at FATAL level via LoggerManager
 * 2. Includes the component stack in the log metadata
 * 3. Renders a fallback UI (if provided) or nothing
 *
 * @example
 * ```tsx
 * import { LoggerErrorBoundary } from '@stackra/logger/react';
 *
 * function App() {
 *   return (
 *     <LoggerErrorBoundary
 *       fallback={<div>Something went wrong</div>}
 *       context="App"
 *     >
 *       <MainContent />
 *     </LoggerErrorBoundary>
 *   );
 * }
 * ```
 */
export class LoggerErrorBoundary extends Component<ILoggerErrorBoundaryProps, ILoggerErrorBoundaryState> {
  public state: ILoggerErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  /**
   * Update state when an error is caught during rendering.
   *
   * @param error - The error that was thrown
   * @returns Updated state
   */
  public static getDerivedStateFromError(error: Error): ILoggerErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Log the error at FATAL level when caught.
   *
   * @param error - The error that was thrown
   * @param errorInfo - React error info with component stack
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const context = this.props.context ?? 'ErrorBoundary';
    const manager = LoggerManager.instance;

    if (manager) {
      const logger = manager.create(context);
      logger.fatal('Unhandled React error caught by ErrorBoundary', error, {
        componentStack: errorInfo.componentStack ?? undefined,
      });
    }
  }

  /**
   * Render children or fallback based on error state.
   *
   * @returns React element
   */
  public render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return fallback(this.state.error!);
      }

      return fallback ?? null;
    }

    return this.props.children;
  }
}
