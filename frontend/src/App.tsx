import { Navigate, Route, Routes } from "react-router-dom";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";
import { ArchitecturePage } from "./pages/ArchitecturePage";
import { AuctionDemoPage } from "./pages/AuctionDemoPage";
import { AuthDemoPage } from "./pages/AuthDemoPage";
import { DemoPage } from "./pages/DemoPage";
import { LandingPage } from "./pages/LandingPage";
import { RaceConditionPage } from "./pages/RaceConditionPage";
import { DemoSessionProvider } from "./hooks/useDemoSession";

export default function App() {
  return (
    <DemoSessionProvider>
      <div className="min-h-screen bg-white text-zinc-950">
        <SiteHeader />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/demo/auth" element={<AuthDemoPage />} />
            <Route path="/demo/app" element={<AuctionDemoPage />} />
            <Route path="/race-condition" element={<RaceConditionPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </DemoSessionProvider>
  );
}
