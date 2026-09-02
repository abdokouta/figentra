import { Navigate, Route, Routes } from "react-router-dom";
import AboutPage from "@/pages/about";
import BlogPage from "@/pages/blog";
import DocsPage from "@/pages/docs";
import IndexPage from "@/pages/index";
import PricingPage from "@/pages/pricing";

/** Canonical route tree for the application. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
