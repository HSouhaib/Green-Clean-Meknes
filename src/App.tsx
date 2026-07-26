import { Routes, Route, useLocation } from "react-router";
import { lazy, Suspense } from "react";
import { PageLoader } from "@/components/PageLoader";
import MaintenanceModal from "@/components/MaintenanceModal";
import LoginModal from "@/components/LoginModal";
import { useLoginModalTrigger } from "@/hooks/useLoginModal";
import { trpc } from '@/lib/trpc';

const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Admin = lazy(() => import("@/pages/Admin"));
const Profile = lazy(() => import("@/pages/Profile"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const LeaderboardPage = lazy(() => import("@/pages/LeaderboardPage"));

function MaintenanceGuard() {
  const location = useLocation();
  const { data: settings } = trpc.settings.list.useQuery();

  const isMaintenance = settings?.maintenance_mode === "true";
  const isExemptRoute =
    location.pathname === "/admin" || location.pathname === "/login";

  if (!isMaintenance || isExemptRoute) return null;

  return <MaintenanceModal message={settings?.maintenance_message || null} />;
}

function App() {
  const { isOpen, setIsOpen } = useLoginModalTrigger();

  return (
    <Suspense fallback={<PageLoader />}>
      <MaintenanceGuard />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <LoginModal open={isOpen} onClose={() => setIsOpen(false)} />
    </Suspense>
  );
}

export default App;
