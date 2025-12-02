// src/components/familia/DebugInfo.js
import React from 'react';

const DebugInfo = ({ familias, familiaSeleccionada, miembros, usuarioActual }) => {
  if (!familias && !familiaSeleccionada && !miembros && !usuarioActual) {
    return null;
  }

  return (
    <div style={{
      background: '#f7fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '1rem',
      margin: '1rem 0',
      fontSize: '0.875rem'
    }}>
      <h4 style={{ margin: '0 0 1rem 0', color: '#2d3748' }}>Debug Info</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <strong>Usuario Actual:</strong>
          <pre style={{ fontSize: '0.75rem', background: '#edf2f7', padding: '0.5rem', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(usuarioActual, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>Familias ({familias?.length || 0}):</strong>
          <pre style={{ fontSize: '0.75rem', background: '#edf2f7', padding: '0.5rem', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(familias, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>Familia Seleccionada:</strong>
          <pre style={{ fontSize: '0.75rem', background: '#edf2f7', padding: '0.5rem', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(familiaSeleccionada, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>Miembros ({miembros?.length || 0}):</strong>
          <pre style={{ fontSize: '0.75rem', background: '#edf2f7', padding: '0.5rem', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(miembros, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DebugInfo;