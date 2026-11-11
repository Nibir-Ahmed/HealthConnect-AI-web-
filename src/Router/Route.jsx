import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import Landingpage from "../PublicView/Landingpage";
import Login from "../Pages/Shared/Login";
import Register from "../Pages/Shared/Register";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute";

// Patient Pages
import PatientDashboard from "../Pages/Patient/Dashboard";
import DiagnosisPage from "../Pages/Patient/DiagnosisPage";
import DoctorListPage from "../Pages/Patient/DoctorListPage";
import DoctorProfilePage from "../Pages/Patient/DoctorProfilePage";
import AppointmentsPage from "../Pages/Patient/AppointmentsPage";
import ChatPage from "../Pages/Patient/ChatPage";
import HealthVaultPage from "../Pages/Patient/HealthVaultPage";
import ProfilePage from "../Pages/Patient/ProfilePage";

// Doctor Pages
import DoctorDashboard from "../Pages/Doctor/DoctorDashboard";
import DoctorAppointmentsPage from "../Pages/Doctor/DoctorAppointmentsPage";
import DoctorChatPage from "../Pages/Doctor/DoctorChatPage";
import PrescriptionPage from "../Pages/Doctor/PrescriptionPage";
import DoctorSettingsPage from "../Pages/Doctor/DoctorSettingsPage";

// Admin Pages
import AdminDashboard from "../Pages/Admin/AdminDashboard";
import DoctorVerificationPage from "../Pages/Admin/DoctorVerificationPage";
import UserDirectoryPage from "../Pages/Admin/UserDirectoryPage";
import BlogManagerPage from "../Pages/Admin/BlogManagerPage";
import AdminSettingsPage from "../Pages/Admin/AdminSettingsPage";

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        index: true,
        Component: Landingpage,
      },
      {
        path: "login",
        Component: Login,
      },
      {
        path: "register",
        Component: Register,
      },

      // Patient Routes
      {
        path: "patient",
        element: <ProtectedRoute allowedRoles={["patient"]} />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { index: true, element: <Navigate to="/patient/dashboard" replace /> },
              { path: "dashboard", Component: PatientDashboard },
              { path: "diagnosis", Component: DiagnosisPage },
              { path: "doctors", Component: DoctorListPage },
              { path: "doctors/:id", Component: DoctorProfilePage },
              { path: "appointments", Component: AppointmentsPage },
              { path: "chat", Component: ChatPage },
              { path: "chat/:id", Component: ChatPage },
              { path: "vault", Component: HealthVaultPage },
              { path: "profile", Component: ProfilePage },
            ],
          },
        ],
      },

      // Doctor Routes
      {
        path: "doctor",
        element: <ProtectedRoute allowedRoles={["doctor"]} />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { index: true, element: <Navigate to="/doctor/dashboard" replace /> },
              { path: "dashboard", Component: DoctorDashboard },
              { path: "appointments", Component: DoctorAppointmentsPage },
              { path: "chat", Component: DoctorChatPage },
              { path: "chat/:id", Component: DoctorChatPage },
              { path: "prescriptions", Component: PrescriptionPage },
              { path: "settings", Component: DoctorSettingsPage },
            ],
          },
        ],
      },

      // Admin Routes
      {
        path: "admin",
        element: <ProtectedRoute allowedRoles={["admin"]} />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { index: true, element: <Navigate to="/admin/dashboard" replace /> },
              { path: "dashboard", Component: AdminDashboard },
              { path: "verifications", Component: DoctorVerificationPage },
              { path: "users", Component: UserDirectoryPage },
              { path: "blogs", Component: BlogManagerPage },
              { path: "settings", Component: AdminSettingsPage },
            ],
          },
        ],
      },

      // Fallback
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
