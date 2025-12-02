📄 1. Descripción General del Proyecto
Título del Proyecto:
 EcoBox: Asistente Inteligente para el Cuidado de Plantas en el Hogar
Descripción:
 EcoBox es un sistema IoT inteligente diseñado para optimizar el cuidado de plantas en entornos domésticos. El sistema monitorea variables ambientales clave (humedad del suelo, temperatura y humedad ambiental) mediante sensores, y utiliza un modelo de Inteligencia Artificial para predecir el momento óptimo de riego.
El control es gestionado por un microcontrolador ESP32, el cual procesa la información, ejecuta el modelo predictivo y activa automáticamente un actuador de riego (bomba o válvula). El usuario puede visualizar el estado de sus plantas y controlar el sistema desde una interfaz web o móvil intuitiva.

🎯 Objetivo General
Desarrollar un sistema IoT autónomo que, mediante la recolección de datos ambientales y la aplicación de un modelo de Inteligencia Artificial, prediga las necesidades de riego de plantas domésticas y active automáticamente un sistema de irrigación, optimizando el uso de agua y promoviendo la salud de las plantas.

⚒️ Herramientas y Tecnologías
Elemento
Tecnología / Componente
Microcontrolador
ESP32
Sensores
DHT11 (temperatura y humedad del aire), Sensor de humedad del suelo (capacitivo recomendado)
Actuador
Bomba de agua o válvula de 5V controlada por relé
Plataforma IoT / Backend
ThingSpeak, Blynk, Node-RED o servidor propio
Inteligencia Artificial
TensorFlow Lite Micro embebido en el ESP32
Modelo Predictivo
Regresión para estimar humedad futura y Clasificación para determinar si regar


2. Flujo del Sistema


https://www.canva.com/design/DAG4read5ZE/sY31br0nEo3dvAhF0_J5VA/view?utm_content=DAG4read5ZE&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h5fe94f67ae

3. Aplicación de la Inteligencia Artificial
Aspecto
Descripción
Tipo de IA
Machine Learning Supervisado
Algoritmos utilizados
Regresión + Clasificación
Datos considerados
Humedad actual, temperatura, humedad ambiental, historial de riego
Función del modelo
Predecir si la planta requerirá agua en las próximas horas


Beneficios de la predicción:
Evita el riego excesivo → ahorro de agua.


Evita el riego tardío → protección de la planta.


Fomenta autonomía del sistema → menos intervención humana.


4. Flujo del Sistema
El ESP32 toma lecturas de los sensores cada 5–10 minutos.


Los datos se almacenan localmente y/o se envían a la nube.


El modelo de IA ejecuta una predicción basándose en los datos.


Si la predicción indica necesidad de riego → Se activa el actuador.


El usuario puede:


Visualizar los datos en tiempo real.


Ver gráficas históricas.


Activar riego manual.


Recibir alertas y notificaciones.


✨ Nivel de Innovación
Característica
Innovación
Cuidado automatizado de plantas
✅
Predicción inteligente del riego
✅
Modelo de IA ejecutado directamente en el microcontrolador (Edge AI)
✅ — Punto diferenciador clave



📄 Tema Sugerido para Artículo Académico
“EcoBox: Sistema IoT Predictivo para el Cuidado Inteligente de Plantas en el Hogar mediante Edge Machine Learning”
Tipo de Estudio:
 Experimental – Implementación y validación en entorno real.

5. Requerimientos del Sistema
Requerimientos Funcionales (RF)
Código
Descripción
RF-01
Lectura periódica de sensores cada 5–10 minutos.
RF-02
Envío seguro de datos a la nube.
RF-03
Almacenamiento de datos históricos con marca de tiempo.
RF-04
Ejecución del modelo de IA en cada nuevo dato recibido.
RF-05
Activación automática del riego cuando la predicción lo indique.
RF-06
Dashboard para visualizar datos en tiempo real.
RF-07
Gráficas históricas de monitoreo.
RF-08
Botón de riego manual en la aplicación.
RF-09
Notificaciones ante eventos críticos o riego automático.

Requerimientos No Funcionales (RNF)
Código
Descripción
RNF-01
Interfaz intuitiva y amigable.
RNF-02
Disponibilidad ≥ 95% y recuperación ante fallos.
RNF-03
Bajo consumo energético.
RNF-04
Comunicación encriptada y autenticada.
RNF-05
Precisión del modelo de IA ≥ 85%.
RNF-06
Bajo costo y fácil implementación doméstica.

