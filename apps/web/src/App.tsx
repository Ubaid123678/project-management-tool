import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProjectBoard from "./pages/ProjectBoard.tsx";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <div className="page-loading">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/projects/:projectId"
      element={
        <ProtectedRoute>
          <Layout>
            <ProjectBoard />
          </Layout>
        </ProtectedRoute>
      }
    />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
