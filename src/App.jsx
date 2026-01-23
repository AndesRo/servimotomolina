import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAppContext } from "./context/AppContext";
import Navbar from "./components/Navbar";

// Componentes lazy-loaded
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventario = lazy(() => import("./pages/Inventario"));
const Ordenes = lazy(() => import("./pages/Ordenes"));
const Calendario = lazy(() => import("./pages/Calendario.jsx"));
const Presupuestos = lazy(() => import("./pages/presupuestos.jsx")); // ← NUEVO

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Layout sin Sidebar - solo Navbar
const Layout = ({ children }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <Navbar />
    <main className="pt-16 md:pt-20">{children}</main>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/inventario"
            element={
              <PrivateRoute>
                <Layout>
                  <Inventario />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/ordenes"
            element={
              <PrivateRoute>
                <Layout>
                  <Ordenes />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/presupuestos"
            element={
              <PrivateRoute>
                <Layout>
                  <Presupuestos />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/calendario"
            element={
              <PrivateRoute>
                <Layout>
                  <Calendario />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

