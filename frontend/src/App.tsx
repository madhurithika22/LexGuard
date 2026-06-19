import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import ContractDetail from "./pages/ContractDetail";
import Compare from "./pages/Compare";
import Navbar from "./components/Navbar";

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {isAuthenticated ? (
          <Route
            path="/*"
            element={
              <Navbar>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/documents/:id" element={<ContractDetail />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Navbar>
            }
          />
        ) : (
          <>
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
