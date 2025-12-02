import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Login from './pages/Login';
import Register from './pages/Register'; // ← Agregar import
import ForgotPassword from './pages/ForgotPassword'; // ← Agregar import
import ResetPassword from './pages/ResetPassword'; // ← Agregar import
import Dashboard from './pages/Dashboard';
import Plantas from './pages/Plantas';
import Familia from './components/familia/Familia';
import Notificaciones from './pages/Notificaciones';
import Layout from './components/Layout';
import Configuracion from './pages/Configuracion';
import './App.css';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente para rutas públicas (redirige si ya está autenticado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <div className="App">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
              
              {/* Rutas protegidas */}
              <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/plantas" element={<ProtectedRoute><Layout><Plantas /></Layout></ProtectedRoute>} />
              <Route path="/familia" element={<ProtectedRoute><Layout><Familia /></Layout></ProtectedRoute>} />
              <Route path="/notificaciones" element={<ProtectedRoute><Layout><Notificaciones /></Layout></ProtectedRoute>} />
              <Route path="/configuracion" element={<ProtectedRoute><Layout><Configuracion /></Layout></ProtectedRoute>} />
              
              {/* Ruta por defecto */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}


export default App;