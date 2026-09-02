import "reflect-metadata";

import { ApplicationFactory } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppModule } from "@/app.module";
import { AppProviders } from "@/provider";
import "@/styles/globals.css";

/** Bootstrap the DI graph before React mounts. */
async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error('Root element "#root" was not found in the document.');

  const app = await ApplicationFactory.create(AppModule, { shutdownHooks: true });

  createRoot(rootElement).render(
    <StrictMode>
      <ContainerProvider context={app}>
        <AppProviders />
      </ContainerProvider>
    </StrictMode>,
  );
}

bootstrap().catch((error: unknown) => {
  console.error("Application bootstrap failed:", error);
  const root = document.getElementById("root");
  if (root) root.innerHTML =
    '<main role="alert"><h1>Application failed to start</h1><p>See the console for details.</p></main>';
});
