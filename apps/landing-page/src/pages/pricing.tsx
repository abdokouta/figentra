/**
 * pricing — Figentra-owned source module.
 *
 * This file follows the repository documentation, security, and layering
 * standards. Public symbols must remain explicitly documented.
 */
import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

/**
 * Public Figentra API symbol.
 */
export default function DocsPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg justify-center text-center">
          <h1 className={title()}>Pricing</h1>
        </div>
      </section>
    </DefaultLayout>
  );
}
