import { useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { usePortalAuth } from "./lib/auth";
import Landing from "./pages/Landing";
import PortalDashboard from "./pages/PortalDashboard";
import PortalLogin from "./pages/PortalLogin";

function RequireTherapist({ children }: { children: ReactNode }) {
  const { access, hydrated } = usePortalAuth();
  const location = useLocation();
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-400">Loading…</div>
    );
  }
  if (!access) {
    return <Navigate to="/portal/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const hydrate = usePortalAuth((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/portal/login" element={<PortalLogin />} />
      <Route
        path="/portal"
        element={
          <RequireTherapist>
            <PortalDashboard />
          </RequireTherapist>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}