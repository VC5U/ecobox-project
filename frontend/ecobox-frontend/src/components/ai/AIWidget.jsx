import React from 'react';
import './AIWidget.css';

const AIWidget = ({ stats, onChatClick, onViewRecommendations }) => {
  const aiStatus = stats?.ai_service || {};
  const aiStats = stats?.statistics || {};

  const getStatusColor = () => {
    return aiStatus.status === 'operational' ? '#2ed573' : '#ff4757';
  };

  const getStatusText = () => {
    return aiStatus.status === 'operational' ? 'Operativa' : 'Limitada';
  };

  return (
    <div className="aiWidget">
      <div className="aiWidgetHeader">
        <div className="aiStatus">
          <div 
            className="statusDot" 
            style={{ backgroundColor: getStatusColor() }}
          ></div>
          <span className="statusText">IA {getStatusText()}</span>
        </div>
        <div className="aiVersion">v{aiStatus.version || '1.0.0'}</div>
      </div>

      <div className="aiWidgetContent">
        <div className="aiStat">
          <div className="statValue">{aiStats.total_predictions || 0}</div>
          <div className="statLabel">Predicciones</div>
        </div>
        
        <div className="aiStat">
          <div className="statValue">{aiStats.pending_predictions || 0}</div>
          <div className="statLabel">Pendientes</div>
        </div>
        
        <div className="aiStat">
          <div className="statValue">{aiStats.user_plants_count || 0}</div>
          <div className="statLabel">Plantas</div>
        </div>
      </div>

      <div className="aiWidgetActions">
        <button onClick={onChatClick} className="aiActionButton chat">
          <span className="buttonIcon">💬</span>
          Preguntar
        </button>
        <button onClick={onViewRecommendations} className="aiActionButton recommendations">
          <span className="buttonIcon">📋</span>
          Ver Todo
        </button>
      </div>

      <div className="aiWidgetFooter">
        <div className="aiTimestamp">
          Última actualización: {stats?.timestamp ? 
            new Date(stats.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default AIWidget;