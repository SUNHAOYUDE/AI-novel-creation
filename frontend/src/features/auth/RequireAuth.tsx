import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-sm text-mist/70">
        正在加载用户信息...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

