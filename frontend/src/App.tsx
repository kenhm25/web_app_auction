import { Navigate, Route, Routes } from "react-router-dom";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";
import { ArchitecturePage } from "./pages/ArchitecturePage";
import { DemoPage } from "./pages/DemoPage";
import { LandingPage } from "./pages/LandingPage";
import { RaceConditionPage } from "./pages/RaceConditionPage";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/race-condition" element={<RaceConditionPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  );
}
