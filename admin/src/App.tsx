import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import AccessDenied from "./components/AccessDenied";
import AdminLoading from "./components/AdminLoading";
import DashboardLayout from "./components/DashboardLayout";
import NativeNavigation from "./components/NativeNavigation";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";

const Blog = lazy(() => import("./pages/Blog"));
const Commissions = lazy(() => import("./pages/Commissions"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Gallery = lazy(() => import("./pages/Gallery"));
const GaleriaPage = lazy(() => import("./pages/GaleriaPage"));

function RouteLoading() {
  return <AdminLoading label="Cargando página" />;
}

function ProtectedRoute() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <AdminLoading fullscreen />;

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <AccessDenied />;

  return (
    <DashboardLayout>
      <Suspense fallback={<RouteLoading />}>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
}

function AppRoutes() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <AdminLoading fullscreen />;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (isAdmin ? <Navigate to="/" replace /> : <AccessDenied />) : <Login />
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/galeria" element={<GaleriaPage />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/commissions" element={<Commissions />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <NativeNavigation />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
