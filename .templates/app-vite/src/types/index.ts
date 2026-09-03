/**
 * index — Figentra-owned source module.
 *
 * This file follows the repository documentation, security, and layering
 * standards. Public symbols must remain explicitly documented.
 */
import { SVGProps } from "react";

/**
 * Public Figentra API symbol.
 */
export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};
