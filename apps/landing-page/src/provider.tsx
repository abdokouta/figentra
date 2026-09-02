import { Component, type ErrorInfo, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/app";

interface Props { children: ReactNode }
interface State { error: Error | null }

class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[AppErrorBoundary] React render crash", error, info);
  }
  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <main role="alert" className="min-h-screen grid place-items-center p-6">
        <section className="max-w-xl rounded-xl border p-6">
          <h1 className="text-xl font-semibold">Application error</h1>
          <p className="mt-2 text-sm opacity-80">{this.state.error.message}</p>
          <button className="button button--primary button--md mt-4 rounded-full"
            type="button" onClick={() => window.location.reload()}>Reload</button>
        </section>
      </main>
    );
  }
}

/** Canonical web provider stack. DI is established by main.tsx. */
export function AppProviders(): ReactNode {
  return <BrowserRouter><AppErrorBoundary><AppRoutes /></AppErrorBoundary></BrowserRouter>;
}
