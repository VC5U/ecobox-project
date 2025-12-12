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
import PlantForm from './components/plants/PlantForm';
import Perfil from './pages/Perfil';
import PlantEdit from './components/plants/PlantEdit';
import PlantDetail from './components/plants/PlantDetail';
import Familia from './components/familia/Familia';
import Notificaciones from './components/Notificaciones/Notificaciones';
import Layout from './components/Layout';
import Configuracion from './pages/Configuracion';
import './App.css';

// ✅ IMPORTACIONES DE IA - IMPORTANTE: Crea estos componentes primero
import AIDashboard from './components/ai/AIDashboard'; // Dashboard específico de IA
import Chatbot from './components/ai/ChatbotMini'; // Componente de chat completo
import RecommendationsPanel from './components/ai/RecommendationsPanel'; // Panel de recomendaciones
import AIAssistant from './components/ai/AIAssistant'; // Asistente principal de IA

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
              <Route path="/perfil" element={<ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>} />

              {/* RUTAS DE PLANTAS */}
              <Route path="/plantas" element={<ProtectedRoute><Layout><Plantas /></Layout></ProtectedRoute>} />
              <Route path="/plantas/:id/editar" element={<ProtectedRoute><Layout><PlantEdit /></Layout></ProtectedRoute>} />
              <Route path="/plantas/nueva" element={<ProtectedRoute><Layout><PlantForm /></Layout></ProtectedRoute>} />
              <Route path="/plantas/:id" element={<ProtectedRoute><Layout><PlantDetail /></Layout></ProtectedRoute>} />
              
              {/* RUTAS DE IA (NUEVAS) */}
              <Route path="/ai" element={<ProtectedRoute><Layout><AIDashboard /></Layout></ProtectedRoute>} />
              <Route path="/ai/chat" element={<ProtectedRoute><Layout><Chatbot /></Layout></ProtectedRoute>} />
              <Route path="/ai/recommendations" element={<ProtectedRoute><Layout><RecommendationsPanel /></Layout></ProtectedRoute>} />
              <Route path="/ai/assistant" element={<ProtectedRoute><Layout><AIAssistant /></Layout></ProtectedRoute>} />
              
              {/* RUTAS EXISTENTES */}
              <Route path="/familia" element={<ProtectedRoute><Layout><Familia /></Layout></ProtectedRoute>} />
              <Route path="/notificaciones" element={<ProtectedRoute><Layout><Notificaciones /></Layout></ProtectedRoute>} />
              <Route path="/configuracion" element={<ProtectedRoute><Layout><Configuracion /></Layout></ProtectedRoute>} />
              
              {/* Ruta por defecto */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              
              {/* Ruta 404 */}
              <Route path="*" element={
                <ProtectedRoute>
                  <Layout>
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                      <h1>404 - Página no encontrada</h1>
                      <p>La página que buscas no existe.</p>
                      <a href="/plantas">Volver a mis plantas</a>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;