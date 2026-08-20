import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoadingSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 select-none">
    <div className="h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-xs font-bold text-slate-500 tracking-[0.15em] uppercase">
      Connecting to ChitChat...
    </p>
  </div>
);

export const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) {
    if (!user.isVerified) return <Navigate to="/email-verification" replace />;
    return <Navigate to={user.role === "Admin" ? "/admin" : "/chat"} replace />;
  }
  return <Navigate to="/login" replace />;
};

export const ProtectedRoute = ({ children, role, userOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isVerified) return <Navigate to="/email-verification" replace />;
  if (userOnly && user.role === "Admin") return <Navigate to="/admin" replace />;
  if (role && user.role !== role) return <Navigate to="/chat" replace />;
  return children;
};

export default ProtectedRoute;
