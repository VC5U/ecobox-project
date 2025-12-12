import React, { useState, useRef, useEffect } from 'react';
import API from '../../services/api';
import './ChatbotMini.css';

const ChatbotMini = ({ onClose, plantId, plantName }) => {
  const [messages, setMessages] = useState([
    {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: plantName 
        ? `¡Hola! Soy el asistente de IA de EcoBox. ¿En qué puedo ayudarte con ${plantName} hoy? 🌱`
        : "¡Hola! Soy el asistente de IA de EcoBox. ¿En qué puedo ayudarte con tus plantas hoy? 🌱",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [userPlants, setUserPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [awaitingPlantSelection, setAwaitingPlantSelection] = useState(false);
  const messagesEndRef = useRef(null);
  const messageIdCounter = useRef(1);
  const hasLoadedRef = useRef(false);
  const justSelectedPlantRef = useRef(false);

  // Generar ID único para mensajes
  const generateMessageId = () => {
    messageIdCounter.current += 1;
    return `msg-${Date.now()}-${messageIdCounter.current}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Verificar conexión y cargar plantas al cargar
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadUserPlants();
    }
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
    
    // Si acaba de seleccionar una planta y no hay mensajes pendientes, preguntar automáticamente
    if (justSelectedPlantRef.current && !isLoading && inputMessage === '') {
      justSelectedPlantRef.current = false;
      
      // Pequeño delay para mejor UX
      setTimeout(() => {
        setInputMessage('¿Cómo está mi planta?');
        setTimeout(() => {
          handleAutoQuestion();
        }, 300);
      }, 500);
    }
  }, [messages, isLoading, inputMessage]);

  // Cargar plantas del usuario
  const loadUserPlants = async () => {
    try {
      console.log('🌿 Cargando plantas del usuario...');
      const response = await API.get('plantas/');
      
      if (response.data && Array.isArray(response.data)) {
        setUserPlants(response.data);
        console.log(`✅ ${response.data.length} plantas cargadas:`, 
          response.data.map(p => `${p.idPlanta || p.id}: ${p.nombrePersonalizado}`));
        
        // Si viene con plantId prop, seleccionarla
        if (plantId && response.data.length > 0) {
          const plantaProp = response.data.find(p => 
            p.idPlanta === plantId || p.id === plantId
          );
          if (plantaProp) {
            setSelectedPlant(plantaProp);
            console.log(`🎯 Planta seleccionada desde prop: ${plantaProp.nombrePersonalizado}`);
          }
        }
      } else {
        console.log('⚠️ No se pudieron cargar las plantas');
      }
    } catch (error) {
      console.error('❌ Error cargando plantas:', error);
    }
  };

  // Buscar planta por nombre
  const buscarPlantaPorNombre = (nombreBuscado) => {
    if (!nombreBuscado || userPlants.length === 0) return null;
    
    const nombreNormalizado = nombreBuscado.toLowerCase().trim().replace(/[^a-záéíóúñ\s]/g, '');
    console.log(`🔍 Búsqueda normalizada: "${nombreNormalizado}"`);
    
    if (!nombreNormalizado || nombreNormalizado.length < 2) return null;
    
    // 1. Coincidencia EXACTA en nombrePersonalizado
    const exactMatch = userPlants.find(planta => 
      planta.nombrePersonalizado?.toLowerCase().trim() === nombreNormalizado
    );
    if (exactMatch) {
      console.log(`✅ Coincidencia exacta: ${exactMatch.nombrePersonalizado}`);
      return exactMatch;
    }
    
    // 2. Buscar por coincidencia parcial
    const partialMatch = userPlants.find(planta => 
      planta.nombrePersonalizado?.toLowerCase().includes(nombreNormalizado) ||
      nombreNormalizado.includes(planta.nombrePersonalizado?.toLowerCase())
    );
    if (partialMatch) {
      console.log(`✅ Coincidencia parcial: ${partialMatch.nombrePersonalizado}`);
      return partialMatch;
    }
    
    // 3. Buscar en especie
    const especieMatch = userPlants.find(planta => 
      planta.especie?.toLowerCase().includes(nombreNormalizado)
    );
    if (especieMatch) {
      console.log(`✅ Coincidencia en especie: ${especieMatch.especie}`);
      return especieMatch;
    }
    
    console.log(`❌ No se encontró planta para: "${nombreNormalizado}"`);
    return null;
  };

  // Extraer nombre de planta del mensaje
  const extraerNombrePlanta = (mensaje) => {
    const mensajeLower = mensaje.toLowerCase().trim();
    console.log(`📝 Extrayendo nombre de: "${mensajeLower}"`);
    
    // Si el mensaje es solo una palabra, devolverla directamente
    if (!mensajeLower.includes(' ')) {
      console.log(`🔍 Mensaje de una palabra: "${mensajeLower}"`);
      return mensajeLower;
    }
    
    // Si es una pregunta general, retornar null
    if (mensajeLower.includes('mi planta') || mensajeLower.includes('mi planta?') || 
        mensajeLower.includes('cómo está') || mensajeLower.includes('necesita')) {
      console.log(`🔍 Es pregunta general`);
      return null;
    }
    
    const palabrasIgnorar = [
      'cómo', 'como', 'qué', 'que', 'está', 'tiene', 'necesita', 'mi', 'la', 'el', 
      'las', 'los', 'esta', 'este', 'mis', 'tus', 'sus', 'plantas', 'planta', 
      'sobre', 'acerca', 'para', 'hoy', 'día', 'dias', 'omitir', 'planta?'
    ];
    
    const patrones = [
      /(?:mi|la|el|las|los|esta|este|esa|ese|mis)\s+([a-zA-ZáéíóúñÑ\s]{2,})(?:\s|$|\.|\?)/i,
      /([a-zA-ZáéíóúñÑ\s]{2,})\s+(?:está|necesita|tiene|se ve|parece|qué|como|de)/i,
      /(?:sobre|acerca de|de|para)\s+([a-zA-ZáéíóúñÑ\s]{2,})(?:\s|$|\.|\?)/i,
    ];
    
    for (const patron of patrones) {
      const match = mensajeLower.match(patron);
      if (match && match[1]) {
        let posibleNombre = match[1].trim();
        posibleNombre = posibleNombre.replace(/[^a-zA-ZáéíóúñÑ\s]/g, '');
        
        const palabrasFinal = posibleNombre.split(' ');
        const ultimaPalabra = palabrasFinal[palabrasFinal.length - 1];
        
        if (palabrasIgnorar.includes(ultimaPalabra.toLowerCase()) && palabrasFinal.length > 1) {
          posibleNombre = palabrasFinal.slice(0, -1).join(' ');
        }
        
        const palabrasNombre = posibleNombre.split(' ');
        const palabrasFiltradas = palabrasNombre.filter(palabra => 
          palabra.length > 1 && !palabrasIgnorar.includes(palabra.toLowerCase())
        );
        
        if (palabrasFiltradas.length > 0) {
          const nombreFinal = palabrasFiltradas.join(' ');
          console.log(`🔍 Nombre extraído: "${nombreFinal}"`);
          return nombreFinal;
        }
      }
    }
    
    console.log(`❌ No se pudo extraer nombre de planta específica`);
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Función para pregunta automática después de seleccionar planta
  const handleAutoQuestion = async () => {
    if (!selectedPlant || isLoading) return;

    const userMessage = {
      id: generateMessageId(),
      text: '¿Cómo está mi planta?',
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const payload = {
        message: '¿Cómo está esta planta? Dame un análisis detallado.',
        plant_id: selectedPlant.idPlanta || selectedPlant.id,
        context: {
          plant_name: selectedPlant.nombrePersonalizado,
          plant_species: selectedPlant.especie,
          plant_state: selectedPlant.estado,
          request_type: 'plant_health_check'
        }
      };
      
      console.log(`📤 Enviando análisis de salud para: ${selectedPlant.nombrePersonalizado}`);
      
      const response = await API.post('ai/chat/', payload);
      const data = response.data;

      let botMessageText = '';
      let isError = false;

      if (response.status === 200 && data.status === 'success') {
        if (data.data?.text) {
          botMessageText = `## 📊 **Análisis de ${selectedPlant.nombrePersonalizado}**\n\n${data.data.text}`;
        } else {
          botMessageText = `## 📊 **Análisis de ${selectedPlant.nombrePersonalizado}**\n\n✅ Estado: ${selectedPlant.estado || 'Normal'}\n🌱 Especie: ${selectedPlant.especie || 'No especificada'}`;
        }
      } else {
        isError = true;
        botMessageText = `⚠️ **Error al obtener información de ${selectedPlant.nombrePersonalizado}**\n\n${data.message || 'Intenta nuevamente.'}`;
      }

      const botMessage = {
        id: generateMessageId(),
        text: botMessageText,
        sender: 'bot',
        timestamp: new Date(),
        isError: isError
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('❌ Error en análisis automático:', error);
      
      const errorMessage = {
        id: generateMessageId(),
        text: `⚠️ **Error de conexión**\n\nNo se pudo obtener información de ${selectedPlant.nombrePersonalizado}.`,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };

  // Manejar "omitir"
  const manejarPalabraOmitir = (mensaje) => {
    const mensajeLower = mensaje.toLowerCase().trim();
    if (mensajeLower === 'omitir') {
      setSelectedPlant(null);
      setAwaitingPlantSelection(false);
      
      const message = {
        id: generateMessageId(),
        text: '✅ Continuando sin planta específica. Puedes preguntar sobre plantas en general.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      setIsLoading(false);
      return true;
    }
    return false;
  };

  // FUNCIÓN PRINCIPAL MEJORADA
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: generateMessageId(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const mensajeOriginal = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      let targetPlant = selectedPlant;
      let mensajeParaIA = mensajeOriginal;
      
      console.log(`📝 Procesando: "${mensajeOriginal}"`);
      console.log(`🎯 Planta actual seleccionada:`, targetPlant);
      
      // 1. VERIFICAR SI EL USUARIO QUIERE OMITIR
      if (manejarPalabraOmitir(mensajeOriginal)) {
        return;
      }
      
      // 2. SI ESTAMOS ESPERANDO SELECCIÓN POR NÚMERO
      if (awaitingPlantSelection) {
        const num = parseInt(mensajeOriginal.trim());
        
        if (!isNaN(num) && num >= 1 && num <= userPlants.length) {
          const plantaSeleccionada = userPlants[num - 1];
          console.log(`✅ Planta seleccionada por número ${num}: ${plantaSeleccionada.nombrePersonalizado}`);
          
          targetPlant = plantaSeleccionada;
          setSelectedPlant(plantaSeleccionada);
          setAwaitingPlantSelection(false);
          justSelectedPlantRef.current = true;
          
          // Mensaje de confirmación mejorado
          const confirmMessage = {
            id: generateMessageId(),
            text: `✅ **${plantaSeleccionada.nombrePersonalizado}** seleccionada. Te ayudo a analizarla...`,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, confirmMessage]);
          
          setIsLoading(false);
          return;
        }
      }
      
      // 3. BUSCAR PLANTA POR NOMBRE EN EL MENSAJE
      if (!targetPlant && userPlants.length > 0) {
        const nombrePlantaExtraido = extraerNombrePlanta(mensajeOriginal);
        
        if (nombrePlantaExtraido) {
          console.log(`🔍 Buscando planta: "${nombrePlantaExtraido}"`);
          const plantaEncontrada = buscarPlantaPorNombre(nombrePlantaExtraido);
          
          if (plantaEncontrada) {
            targetPlant = plantaEncontrada;
            setSelectedPlant(plantaEncontrada);
            console.log(`✅ Planta encontrada: ${targetPlant.nombrePersonalizado}`);
            
            const regex = new RegExp(`\\b${nombrePlantaExtraido}\\b`, 'gi');
            mensajeParaIA = mensajeOriginal.replace(regex, 'esta planta').trim();
          } else {
            console.log(`⚠️ No se encontró planta "${nombrePlantaExtraido}"`);
            
            const clarificationMessage = {
              id: generateMessageId(),
              text: `🤔 No encuentro **"${nombrePlantaExtraido}"** en tus plantas.\n\n**Tus plantas disponibles:**\n${userPlants.map((p, i) => `${i + 1}. ${p.nombrePersonalizado} ${p.especie ? `(${p.especie})` : ''}`).join('\n')}\n\nResponde con el **número** de la planta o escribe **"omitir"** para continuar.`,
              sender: 'bot',
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, clarificationMessage]);
            setAwaitingPlantSelection(true);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // 4. SI NO HAY PLANTA SELECCIONADA Y HAY PLANTAS DISPONIBLES, MOSTRAR LISTA
      if (!targetPlant && userPlants.length > 0) {
        const plantListMessage = {
          id: generateMessageId(),
          text: `🌿 **Tus plantas disponibles:**\n\n${userPlants.map((p, i) => `${i + 1}. ${p.nombrePersonalizado} ${p.especie ? `(${p.especie})` : ''}`).join('\n')}\n\nResponde con el **número** de la planta o escribe **"omitir"** para preguntas generales.`,
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, plantListMessage]);
        setAwaitingPlantSelection(true);
        setIsLoading(false);
        return;
      }
      
      // 5. ENVIAR A LA IA CON CONTEXTO MEJORADO
      const payload = {
        message: mensajeParaIA,
        context: {
          plant_name: targetPlant?.nombrePersonalizado,
          plant_species: targetPlant?.especie,
          plant_state: targetPlant?.estado,
          plant_family: targetPlant?.familia,
          user_question: mensajeOriginal,
          response_type: 'detailed_plant_advice'
        }
      };
      
      if (targetPlant) {
        const plantIdToSend = targetPlant.idPlanta || targetPlant.id;
        payload.plant_id = plantIdToSend;
        console.log(`📤 Enviando consulta específica para: ${targetPlant.nombrePersonalizado}`);
      } else {
        console.log(`📤 Enviando consulta general`);
      }
      
      const response = await API.post('ai/chat/', payload);
      const data = response.data;

      let botMessageText = '';
      let isError = false;

      if (response.status === 200 && data.status === 'success') {
        if (data.data?.text) {
          // Personalizar respuesta según el tipo de planta
          if (targetPlant) {
            botMessageText = `## 🌱 **${targetPlant.nombrePersonalizado}**\n*${targetPlant.especie || 'Planta'}*\n\n${data.data.text}\n\n---\n💡 *Sugerencia: Puedes preguntar sobre riego, luz, temperatura o plagas.*`;
          } else {
            botMessageText = `## 🌿 **Información General**\n\n${data.data.text}`;
          }
        } else {
          botMessageText = '✅ He procesado tu consulta sobre plantas.';
        }
      } else {
        isError = true;
        botMessageText = `⚠️ **Error del servidor**\n\n${data.message || 'Por favor, intenta nuevamente.'}`;
      }

      const botMessage = {
        id: generateMessageId(),
        text: botMessageText,
        sender: 'bot',
        timestamp: new Date(),
        isError: isError
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('❌ Error con el chatbot:', error);
      
      let errorText = '';
      
      if (error.response) {
        errorText = `⚠️ **Error ${error.response.status}**\n\n${error.response.data?.message || error.message}`;
      } else {
        errorText = `⚠️ **Error de conexión**\n\n${error.message}`;
      }
      
      const errorMessage = {
        id: generateMessageId(),
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar clic en sugerencia
  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    
    if (selectedPlant || userPlants.length > 0) {
      setTimeout(() => {
        handleSendMessage();
      }, 100);
    }
  };

  // Manejar tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Manejar clic en "omitir" (botón)
  const handleOmitir = () => {
    setSelectedPlant(null);
    setAwaitingPlantSelection(false);
    setInputMessage('');
    
    const message = {
      id: generateMessageId(),
      text: '✅ Continuando sin planta específica. Puedes preguntar sobre plantas en general.',
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  // Sugerencias dinámicas
  const getDynamicSuggestions = () => {
    if (selectedPlant) {
      return [
        `¿Cómo está mi ${selectedPlant.nombrePersonalizado}?`,
        `¿Necesita agua mi ${selectedPlant.nombrePersonalizado}?`,
        `¿La luz es adecuada para mi ${selectedPlant.nombrePersonalizado}?`,
        `¿Tiene plagas mi ${selectedPlant.nombrePersonalizado}?`,
        `¿Cuándo debo fertilizar mi ${selectedPlant.nombrePersonalizado}?`
      ];
    }
    
    return [
      "¿Cómo está mi planta?",
      "¿Necesito regar hoy?",
      "¿La temperatura es adecuada?",
      "¿Hay plagas en mis plantas?"
    ];
  };

  const formatMessage = (text) => {
    if (!text) return null;
    
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h4 key={i} className="message-title">{line.slice(3)}</h4>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={i}>{line.slice(2, -2)}</strong>;
      }
      if (line.match(/^[✅⚠️🔍🌿🤔📝🎯🔑📤💧🌱💡📊]/)) {
        return <div key={i} className="message-icon-line">{line}</div>;
      }
      if (line.match(/^\d+\.\s/)) {
        return <div key={i} className="message-numbered">{line}</div>;
      }
      if (line === '---') {
        return <hr key={i} className="message-divider" />;
      }
      return <div key={i}>{line}</div>;
    });
  };

  const getConnectionStatusText = () => {
    switch(connectionStatus) {
      case 'connected': return '✅ Conectado';
      case 'disconnected': return '❌ Desconectado';
      default: return '🔍 Conectando...';
    }
  };

  return (
    <div className="chatbotMini">
      <div className="chatbotMiniHeader">
        <div className="chatbotTitle">
          <div className="chatbotIcon">🤖</div>
          <div>
            <h3>Asistente IA</h3>
            <p className="chatbotSubtitle">
              Beta • {getConnectionStatusText()}
              {userPlants.length > 0 && ` • ${userPlants.length} plantas`}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="closeButton">
          ×
        </button>
      </div>

      {selectedPlant && (
        <div className="selectedPlantBanner">
          <div className="plantBannerContent">
            <span className="plantIcon">🌱</span>
            <div className="plantBannerInfo">
              <strong>{selectedPlant.nombrePersonalizado}</strong>
              <span className="plantSpecies">{selectedPlant.especie}</span>
            </div>
            <div className="plantBannerStatus">
              <span className={`statusBadge ${selectedPlant.estado || 'normal'}`}>
                {selectedPlant.estado || 'Normal'}
              </span>
            </div>
            <button 
              onClick={() => {
                setSelectedPlant(null);
                setInputMessage('');
              }}
              className="changePlantButton"
            >
              Cambiar
            </button>
          </div>
        </div>
      )}

      <div className="chatbotMiniMessages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.sender} ${message.isError ? 'error' : ''}`}
          >
            <div className="messageContent">
              {formatMessage(message.text)}
              <div className="messageTime">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot">
            <div className="messageContent">
              <div className="typingIndicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {awaitingPlantSelection && (
        <div className="plantSelectionQuickActions">
          <button 
            onClick={handleOmitir}
            className="quickActionButton"
          >
            ⏭️ Omitir y continuar
          </button>
          <div className="selectionHint">
            O escribe el número de la planta (1-{userPlants.length})
          </div>
        </div>
      )}

      <div className="chatbotMiniSuggestions">
        <div className="suggestionsLabel">
          {selectedPlant 
            ? `💡 Sugerencias para ${selectedPlant.nombrePersonalizado}:` 
            : "💡 Sugerencias rápidas:"}
        </div>
        <div className="suggestionsList">
          {getDynamicSuggestions().map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="suggestionChip"
              disabled={isLoading || connectionStatus !== 'connected'}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="chatbotMiniInput">
        {connectionStatus === 'disconnected' && (
          <div className="connectionWarning">
            ⚠️ No hay conexión con el servidor de IA. Verifica tu autenticación.
          </div>
        )}
        
        {userPlants.length === 0 && connectionStatus === 'connected' && (
          <div className="infoMessage">
            ℹ️ No hay plantas registradas. Primero agrega plantas en la sección "Mis Plantas".
          </div>
        )}
        
        <div className="inputWrapper">
          <input
            type="text"
            placeholder={
              awaitingPlantSelection 
                ? `Escribe el número (1-${userPlants.length}) o "omitir"...`
                : selectedPlant
                  ? `Pregunta sobre ${selectedPlant.nombrePersonalizado}...`
                  : userPlants.length > 0 
                    ? 'Escribe el nombre de tu planta (ej: "lavanda")...'
                    : "Escribe tu pregunta sobre plantas..."
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || connectionStatus !== 'connected'}
            className="messageInput"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || connectionStatus !== 'connected'}
            className="sendButton"
          >
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              'Enviar'
            )}
          </button>
        </div>
        <div className="inputHint">
          {connectionStatus === 'connected' 
            ? awaitingPlantSelection
              ? 'Selecciona una planta para continuar'
              : selectedPlant
                ? `💬 Hablando sobre ${selectedPlant.nombrePersonalizado}`
                : '💡 Menciona el nombre de tu planta o selecciona una'
            : 'Servicio no disponible'}
        </div>
      </div>
    </div>
  );
};

export default ChatbotMini;