import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import HodLoginPage from "./pages/HodLoginPage";
import VolunteerLoginPage from "./pages/VolunteerLoginPage";
import HodDashboard from "./pages/HodDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import StudentsPage from "./pages/StudentsPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import UploadPage from "./pages/UploadPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <SocketProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/login/hod" element={<HodLoginPage />} />
              <Route path="/login/volunteer" element={<VolunteerLoginPage />} />
              <Route
                path="/hod/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["hod"]}>
                    <HodDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["volunteer"]}>
                    <VolunteerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students"
                element={
                  <ProtectedRoute>
                    <StudentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students/:id"
                element={
                  <ProtectedRoute>
                    <StudentDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute allowedRoles={["hod"]}>
                    <UploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/logs"
                element={
                  <ProtectedRoute allowedRoles={["hod"]}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </SocketProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
