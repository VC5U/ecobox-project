// src/components/familia/LoginModal/LoginModal.js
import React, { useState } from 'react';
import { authService } from '../../../services/authService';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.login(credentials.email, credentials.password);
      onLogin(data.user || { email: credentials.email });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-content">
        <div className="login-modal-header">
          <h2 className="login-modal-title">Iniciar Sesión</h2>
          <button onClick={onClose} className="login-modal-close">
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="login-modal-form">
          {error && (
            <div className="login-modal-error">
              {error}
            </div>
          )}
          
          <div className="login-modal-field">
            <label htmlFor="email" className="login-modal-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              className="login-modal-input"
              required
            />
          </div>
          
          <div className="login-modal-field">
            <label htmlFor="password" className="login-modal-label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="login-modal-input"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-modal-submit"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;