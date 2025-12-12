import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AIAssistant.css';

const AIAssistant = () => {
  const navigate = useNavigate();

  return (
    <div className="aiAssistant">
      <div className="assistantHeader">
        <h1>🧠 Asistente de IA EcoBox</h1>
        <p>Tu compañero inteligente para el cuidado de plantas</p>
      </div>
      
      <div className="assistantFeatures">
        <div className="featureCard" onClick={() => navigate('/ai/chat')}>
          <div className="featureIcon">💬</div>
          <h3>Chat Inteligente</h3>
          <p>Conversa con nuestro asistente sobre el cuidado de tus plantas</p>
        </div>
        
        <div className="featureCard" onClick={() => navigate('/ai/recommendations')}>
          <div className="featureIcon">📋</div>
          <h3>Recomendaciones</h3>
          <p>Sugerencias personalizadas basadas en datos</p>
        </div>
        
        <div className="featureCard" onClick={() => navigate('/plantas')}>
          <div className="featureIcon">🌿</div>
          <h3>Análisis de Plantas</h3>
          <p>Obtén análisis detallados de la salud de tus plantas</p>
        </div>
      </div>
      
      <div className="assistantInfo">
        <h3>¿Cómo funciona?</h3>
        <p>Nuestro sistema de IA analiza datos históricos, condiciones actuales y patrones para generar recomendaciones personalizadas.</p>
      </div>
    </div>
  );
};

export default AIAssistant;