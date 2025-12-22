import React from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Plantas from './pages/Plantas';
import Perfil from './pages/Perfil';
import Configuracion2 from './pages/Configuracion';
import Configuracion from './components/AIControlPanel';

import Familia from './components/familia/Familia';
import Notificaciones from './components/Notificaciones/Notificaciones';
import Layout from './components/Layout';
import './App.css';

// ✅ IMPORTACIONES DE IA
import AIDashboard from './components/ai/AIDashboard';
import Chatbot from './components/ai/ChatbotMini';
import RecommendationsPanel from './components/ai/RecommendationsPanel';
import AIAssistant from './components/ai/AIAssistant';

// ❌ ELIMINAR estas importaciones - están causando conflictos
// import PlantForm from './components/plants/PlantForm';
// import PlantEdit from './components/plants/PlantEdit';
// import PlantDetail from './components/plants/PlantDetail';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-fullscreen">
        <div className="spinner-large"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente para rutas públicas (redirige si ya está autenticado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-fullscreen">
        <div className="spinner-large"></div>
        <p>Cargando...</p>
      </div>
    );
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
              {/* ========== RUTAS PÚBLICAS ========== */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

              {/* ========== RUTAS PROTEGIDAS CON LAYOUT ========== */}
              
              {/* Dashboard principal */}
              <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />

              {/* Perfil de usuario */}
              <Route path="/perfil" element={<ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>} />

              {/* ========== RUTAS DE PLANTAS ========== */}
              {/* ✅ SOLO UNA RUTA PARA PLANTAS - El componente Plantas maneja las subrutas */}
              <Route path="/plantas/*" element={<ProtectedRoute><Layout><Plantas /></Layout></ProtectedRoute>} />

              {/* ========== RUTAS DE IA ========== */}
              <Route path="/ai" element={<ProtectedRoute><Layout><AIDashboard /></Layout></ProtectedRoute>} />
              <Route path="/ai/chat" element={<ProtectedRoute><Layout><Chatbot /></Layout></ProtectedRoute>} />
              <Route path="/ai/recommendations" element={<ProtectedRoute><Layout><RecommendationsPanel /></Layout></ProtectedRoute>} />
              <Route path="/ai/assistant" element={<ProtectedRoute><Layout><AIAssistant /></Layout></ProtectedRoute>} />

              {/* ========== OTRAS RUTAS ========== */}
              <Route path="/familia" element={<ProtectedRoute><Layout><Familia /></Layout></ProtectedRoute>} />
              <Route path="/notificaciones" element={<ProtectedRoute><Layout><Notificaciones /></Layout></ProtectedRoute>} />
              <Route path="/configuracion" element={<ProtectedRoute><Layout><Configuracion /></Layout></ProtectedRoute>} />

              {/* ========== RUTAS ESPECIALES ========== */}
              
              {/* Redirige la raíz al dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" />} />

              {/* Ruta 404 */}
              <Route path="*" element={<ProtectedRoute><Layout><div className="not-found-page"><h1>404 - Página no encontrada</h1><p>La página que buscas no existe.</p><a href="/plantas" className="btn btn-primary">Volver a mis plantas</a></div></Layout></ProtectedRoute>} />
            </Routes>
          </div>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
