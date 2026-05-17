import { Navigate, useLocation } from "react-router-dom";

export function DemoPage() {
  const location = useLocation();

  return <Navigate to={`/demo/auth${location.search}`} replace />;
}
