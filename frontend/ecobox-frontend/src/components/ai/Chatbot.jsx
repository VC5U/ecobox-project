import React, { useState } from 'react';
import './Chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { text: "¡Hola! Soy el asistente de IA de EcoBox. ¿En qué puedo ayudarte?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Agregar mensaje del usuario
    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    
    // Simular respuesta
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: `Recibí: "${input}". Esta es una respuesta de prueba del chatbot.`, 
        sender: 'bot' 
      }]);
    }, 1000);
    
    setInput('');
  };

  return (
    <div className="chatbot">
      <div className="chatbotHeader">
        <h2>🤖 Chatbot de IA</h2>
      </div>
      <div className="chatbotMessages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="chatbotInput">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>Enviar</button>
      </div>
    </div>
  );
};

export default Chatbot;