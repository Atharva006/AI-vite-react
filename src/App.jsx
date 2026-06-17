import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Home from "./Home";
import { LenAi } from "./LenAi";
import AdminDashboard from "./pages/AdminDashboard";
import { SpeedInsights } from "@vercel/speed-insights/react";

import "./App.css";

// Security: Requires User to be logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  return user ? children : <Navigate to="/" replace />;
};

// Security: Requires Admin role
const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  return user && isAdmin ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* User-Only Workspace */}
        <Route
          path="/LenAi"
          element={
            <ProtectedRoute>
              <LenAi />
            </ProtectedRoute>
          }
        />

        {/* Admin-Only Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SpeedInsights />
    </>
  );
}

export default App;
