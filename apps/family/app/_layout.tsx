import "reflect-metadata";

import { ApplicationFactory } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { SplashScreen } from "expo-router";
import { useEffect, useState, type ReactElement } from "react";

import { AppModule } from "@/app.module";
import { AppProviders } from "@/provider";
import "../src/styles/global.css";

void SplashScreen.preventAutoHideAsync();

type AppContext = Awaited<ReturnType<typeof ApplicationFactory.create>>;

/** Expo Router root bootstrap; DI is resolved before routes mount. */
export default function RootLayout(): ReactElement | null {
  const [context, setContext] = useState<AppContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap(): Promise<void> {
      try {
        const app = await ApplicationFactory.create(AppModule, { shutdownHooks: true });
        if (!cancelled) setContext(app);
      } catch (error) {
        console.error("Container bootstrap failed:", error);
      } finally {
        await SplashScreen.hideAsync().catch(() => undefined);
      }
    }
    void bootstrap();
    return () => { cancelled = true; };
  }, []);

  if (!context) return null;
  return <ContainerProvider context={context}><AppProviders /></ContainerProvider>;
}
