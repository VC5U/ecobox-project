// src/services/websocket.js
class EcoBoxWebSocket {
  constructor() {
    this.socket = null;
    this.reconnectInterval = 5000;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect() {
    try {
      // Solo conectar si estamos en producción o si realmente necesitamos WebSocket
      if (process.env.NODE_ENV === 'development') {
        console.log('⚡ WebSocket deshabilitado en desarrollo');
        return;
      }
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/ai/`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('✅ WebSocket conectado');
        this.isConnected = true;
        this.emit('connected');
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = () => {
        console.log('⚠️ WebSocket desconectado');
        this.isConnected = false;
        setTimeout(() => this.connect(), this.reconnectInterval);
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.log('⚠️ WebSocket no disponible:', error.message);
    }
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
  
  send(data) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify(data));
    }
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export const ecoBoxWebSocket = new EcoBoxWebSocket();