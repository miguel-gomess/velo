import { Navigate, useLocation } from "react-router-dom";
import { authClient } from "../lib/authClient";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const location = useLocation();

  if (isPending) return null;

  if (!session?.user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
}
