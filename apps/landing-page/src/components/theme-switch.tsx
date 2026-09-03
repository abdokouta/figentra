/**
 * theme-switch — Figentra-owned source module.
 *
 * This file follows the repository documentation, security, and layering
 * standards. Public symbols must remain explicitly documented.
 */
import { FC, useCallback } from "react";
import { useTheme } from "@heroui/react";
import clsx from "clsx";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

/**
 * Public Figentra API symbol.
 */
export interface ThemeSwitchProps {
  className?: string;
}

/**
 * Public Figentra API symbol.
 */
export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const { resolvedTheme, setTheme } = useTheme("light");

  const isLight = resolvedTheme === "light";

  const toggleTheme = useCallback(() => {
    setTheme(isLight ? "dark" : "light");
  }, [isLight, setTheme]);

  if (!resolvedTheme) {
    return <div aria-hidden className="h-6 w-6" />;
  }

  return (
    <button
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      className={clsx(
        "cursor-pointer px-px transition-opacity hover:opacity-80",
        "inline-flex items-center justify-center",
        "h-auto w-auto rounded-lg border-none bg-transparent",
        className,
      )}
      onClick={toggleTheme}
    >
      {isLight ? <MoonFilledIcon size={22} /> : <SunFilledIcon size={22} />}
    </button>
  );
};
