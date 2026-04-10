import React from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.organizationId !== "SENTINELADMINUNIQUE") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
