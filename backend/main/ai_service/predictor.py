# main/ai_service/predictor.py
import pandas as pd
import numpy as np
import joblib
import logging
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, accuracy_score, classification_report
import json
import os
from django.conf import settings

logger = logging.getLogger(__name__)

class PlantPredictor:
    """
    Sistema de predicción de riego para plantas usando Machine Learning
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.label_encoders = {}
        self.model_dir = os.path.join(settings.BASE_DIR, 'main', 'ai_service', 'models')
        os.makedirs(self.model_dir, exist_ok=True)
        
    def load_training_data(self, plant_id, days_history=30):
        """
        Carga datos históricos de la base de datos para entrenamiento
        """
        from django.db import connection
        from django.utils import timezone
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days_history)
        
        query = """
        SELECT 
            sr.id,
            sr.temperature,
            sr.humidity,
            sr.reading_time,
            EXTRACT(HOUR FROM sr.reading_time) as hour_of_day,
            EXTRACT(DOW FROM sr.reading_time) as day_of_week,
            sr.soil_moisture,
            CASE 
                WHEN w.id IS NOT NULL THEN 1 
                ELSE 0 
            END as was_watered,
            CASE 
                WHEN sr.soil_moisture < 20 THEN 'CRITICAL'
                WHEN sr.soil_moisture < 40 THEN 'WARNING'
                ELSE 'NORMAL'
            END as moisture_level,
            CASE 
                WHEN sr.temperature > 35 THEN 'HIGH'
                WHEN sr.temperature < 15 THEN 'LOW'
                ELSE 'OPTIMAL'
            END as temperature_level
        FROM main_sensorreading sr
        LEFT JOIN main_wateringlevel w 
            ON sr.plant_id = w.plant_id 
            AND DATE(sr.reading_time) = DATE(w.watering_time)
            AND w.watering_time BETWEEN %s AND %s
        WHERE sr.plant_id = %s
        AND sr.reading_time BETWEEN %s AND %s
        ORDER BY sr.reading_time
        """
        
        with connection.cursor() as cursor:
            cursor.execute(query, [start_date, end_date, plant_id, start_date, end_date])
            columns = [col[0] for col in cursor.description]
            data = cursor.fetchall()
            
        if not data:
            logger.warning(f"No hay datos para entrenamiento de planta {plant_id}")
            return pd.DataFrame()
        
        df = pd.DataFrame(data, columns=columns)
        return df
    
    def preprocess_data(self, df):
        """
        Preprocesamiento de datos para ML
        """
        if df.empty:
            return df
            
        # Crear características adicionales
        df['hour_sin'] = np.sin(2 * np.pi * df['hour_of_day'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour_of_day'] / 24)
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        # Crear características de tendencia
        df['humidity_ma_6h'] = df['humidity'].rolling(6, min_periods=1).mean()
        df['temp_ma_6h'] = df['temperature'].rolling(6, min_periods=1).mean()
        
        # Crear target: ¿necesita riego en las próximas 6 horas?
        df['needs_watering'] = ((df['soil_moisture'].shift(-6) < 30) & 
                                (df['soil_moisture'] < 40)).astype(int)
        
        # Eliminar NaN
        df = df.dropna()
        
        return df
    
    def train_model(self, plant_id, model_type='random_forest'):
        """
        Entrena un modelo para una planta específica
        """
        logger.info(f"Iniciando entrenamiento para planta {plant_id}")
        
        # Cargar datos
        df = self.load_training_data(plant_id)
        if df.empty or len(df) < 50:
            logger.error(f"Datos insuficientes para planta {plant_id}: {len(df)} registros")
            return None
        
        # Preprocesar
        df = self.preprocess_data(df)
        
        # Definir características
        feature_columns = [
            'temperature', 'humidity', 'soil_moisture',
            'hour_sin', 'hour_cos', 'day_sin', 'day_cos',
            'humidity_ma_6h', 'temp_ma_6h'
        ]
        
        X = df[feature_columns]
        y = df['needs_watering']
        
        # Dividir datos
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Escalar características
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Entrenar modelo
        if model_type == 'random_forest':
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
        elif model_type == 'gradient_boosting':
            model = GradientBoostingRegressor(
                n_estimators=100,
                max_depth=5,
                random_state=42
            )
        else:
            model = RandomForestClassifier(
                n_estimators=50,
                max_depth=8,
                random_state=42
            )
        
        model.fit(X_train_scaled, y_train)
        
        # Evaluar
        y_pred = model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        logger.info(f"Modelo entrenado - Accuracy: {accuracy:.4f}")
        
        # Guardar modelo
        model_filename = f"plant_{plant_id}_{model_type}_{datetime.now().strftime('%Y%m%d_%H%M')}.joblib"
        model_path = os.path.join(self.model_dir, model_filename)
        
        joblib.dump({
            'model': model,
            'scaler': scaler,
            'features': feature_columns,
            'accuracy': accuracy,
            'trained_at': datetime.now().isoformat()
        }, model_path)
        
        # Guardar en base de datos
        self.save_model_to_db(plant_id, model_type, accuracy, model_filename)
        
        return {
            'accuracy': float(accuracy),
            'model_path': model_path,
            'samples_used': len(df)
        }
    
    def save_model_to_db(self, plant_id, model_type, accuracy, filename):
        """
        Guarda información del modelo en la base de datos
        """
        from main.models import MLModel
        
        # Desactivar modelos anteriores para esta planta
        MLModel.objects.filter(plant_id=plant_id, is_active=True).update(is_active=False)
        
        # Crear nuevo registro
        MLModel.objects.create(
            name=f"Modelo {model_type} Planta {plant_id}",
            plant_id=plant_id,
            model_type=model_type.upper(),
            accuracy=accuracy,
            model_file=filename,
            is_active=True
        )
    
    def predecir_proximo_riego(self, plant_id, current_data=None):
        """
        Predice cuándo será necesario el próximo riego
        """
        try:
            # Cargar el modelo más reciente
            model_info = self.load_latest_model(plant_id)
            if not model_info:
                return self.get_fallback_prediction(plant_id)
            
            model = model_info['model']
            scaler = model_info['scaler']
            features = model_info['features']
            
            # Preparar datos actuales
            if current_data is None:
                current_data = self.get_current_plant_data(plant_id)
            
            # Crear características para predicción
            now = datetime.now()
            prediction_features = {
                'temperature': current_data.get('temperature', 22),
                'humidity': current_data.get('humidity', 50),
                'soil_moisture': current_data.get('soil_moisture', 35),
                'hour_sin': np.sin(2 * np.pi * now.hour / 24),
                'hour_cos': np.cos(2 * np.pi * now.hour / 24),
                'day_sin': np.sin(2 * np.pi * now.weekday() / 7),
                'day_cos': np.cos(2 * np.pi * now.weekday() / 7),
                'humidity_ma_6h': current_data.get('humidity_ma', 50),
                'temp_ma_6h': current_data.get('temperature_ma', 22)
            }
            
            # Convertir a array
            X = np.array([[prediction_features[col] for col in features]])
            X_scaled = scaler.transform(X)
            
            # Predecir
            needs_water_prob = model.predict_proba(X_scaled)[0][1]
            
            # Calcular hora recomendada
            if needs_water_prob > 0.7:
                # Urgente: en las próximas 2 horas
                recommended_time = (now + timedelta(hours=1)).strftime('%H:%M')
                duration = 60  # 60 segundos
            elif needs_water_prob > 0.4:
                # En las próximas 6 horas
                recommended_time = (now + timedelta(hours=4)).strftime('%H:%M')
                duration = 45
            else:
                # No urgente, mañana temprano
                tomorrow = now + timedelta(days=1)
                recommended_time = tomorrow.replace(hour=9, minute=0).strftime('%H:%M')
                duration = 30
            
            return {
                'hora_recomendada': recommended_time,
                'probabilidad': float(needs_water_prob),
                'duracion_recomendada': duration,
                'confianza': float(model_info.get('accuracy', 0.7)),
                'modelo_usado': model_info.get('model_type', 'random_forest')
            }
            
        except Exception as e:
            logger.error(f"Error en predicción para planta {plant_id}: {str(e)}")
            return self.get_fallback_prediction(plant_id)
    
    def load_latest_model(self, plant_id):
        """
        Carga el modelo más reciente para una planta
        """
        from main.models import MLModel
        
        try:
            model_record = MLModel.objects.filter(
                plant_id=plant_id, 
                is_active=True
            ).order_by('-last_trained').first()
            
            if not model_record:
                return None
            
            model_path = os.path.join(self.model_dir, model_record.model_file)
            if not os.path.exists(model_path):
                return None
            
            loaded_data = joblib.load(model_path)
            
            return {
                'model': loaded_data['model'],
                'scaler': loaded_data['scaler'],
                'features': loaded_data['features'],
                'accuracy': loaded_data['accuracy'],
                'model_type': model_record.model_type
            }
            
        except Exception as e:
            logger.error(f"Error cargando modelo: {str(e)}")
            return None
    
    def get_current_plant_data(self, plant_id):
        """
        Obtiene datos actuales de la planta desde la BD
        """
        from main.models import SensorReading
        
        latest = SensorReading.objects.filter(
            plant_id=plant_id
        ).order_by('-reading_time').first()
        
        if not latest:
            return {'temperature': 22, 'humidity': 50, 'soil_moisture': 35}
        
        # Calcular promedios móviles
        from django.db.models import Avg
        from django.utils import timezone
        from datetime import timedelta
        
        six_hours_ago = timezone.now() - timedelta(hours=6)
        
        avg_data = SensorReading.objects.filter(
            plant_id=plant_id,
            reading_time__gte=six_hours_ago
        ).aggregate(
            avg_temp=Avg('temperature'),
            avg_humidity=Avg('humidity')
        )
        
        return {
            'temperature': latest.temperature,
            'humidity': latest.humidity,
            'soil_moisture': latest.soil_moisture,
            'temperature_ma': avg_data['avg_temp'] or latest.temperature,
            'humidity_ma': avg_data['avg_humidity'] or latest.humidity
        }
    
    def get_fallback_prediction(self, plant_id):
        """
        Predicción por defecto cuando no hay modelo entrenado
        """
        # Lógica simple basada en hora del día y día de la semana
        now = datetime.now()
        hour = now.hour
        
        if hour < 12:
            recommended = "09:00"
            prob = 0.6
        elif hour < 18:
            recommended = "16:00"
            prob = 0.5
        else:
            recommended = "08:00"  # mañana
            prob = 0.7
        
        return {
            'hora_recomendada': recommended,
            'probabilidad': prob,
            'duracion_recomendada': 40,
            'confianza': 0.5,
            'modelo_usado': 'fallback'
        }
    
    def generar_recomendaciones_personalizadas(self, plant_id):
        """
        Genera recomendaciones basadas en patrones históricos
        """
        try:
            # Analizar patrones históricos
            df = self.load_training_data(plant_id, days_history=60)
            if df.empty:
                return ["No hay suficientes datos históricos para recomendaciones"]
            
            recommendations = []
            
            # Análisis por día de la semana
            if 'day_of_week' in df.columns:
                weekday_stats = df.groupby('day_of_week')['soil_moisture'].mean()
                driest_day = weekday_stats.idxmin()
                days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
                
                if driest_day < len(days):
                    recommendations.append(
                        f"Esta planta tiende a secarse más los {days[int(driest_day)]}"
                    )
            
            # Análisis por hora del día
            if 'hour_of_day' in df.columns:
                hour_stats = df.groupby('hour_of_day')['soil_moisture'].mean()
                optimal_hour = hour_stats.idxmax()
                recommendations.append(
                    f"Hora óptima de riego: {int(optimal_hour)}:00"
                )
            
            # Recomendaciones estacionales
            month = datetime.now().month
            if month in [12, 1, 2]:  # Invierno
                recommendations.append("Reducir frecuencia de riego en invierno")
            elif month in [6, 7, 8]:  # Verano
                recommendations.append("Aumentar frecuencia de riego en verano")
            
            # Recomendación basada en temperatura
            avg_temp = df['temperature'].mean()
            if avg_temp > 30:
                recommendations.append("Temperatura alta: considerar riego más frecuente")
            elif avg_temp < 15:
                recommendations.append("Temperatura baja: reducir riego")
            
            return recommendations[:5]  # Máximo 5 recomendaciones
            
        except Exception as e:
            logger.error(f"Error generando recomendaciones: {str(e)}")
            return ["Analizando patrones..."]
    
    def evaluar_eficiencia_modelos(self):
        """
        Evalúa y compara todos los modelos entrenados
        """
        from main.models import MLModel
        
        models = MLModel.objects.filter(is_active=True)
        results = []
        
        for model in models:
            try:
                model_path = os.path.join(self.model_dir, model.model_file)
                if os.path.exists(model_path):
                    loaded = joblib.load(model_path)
                    
                    results.append({
                        'plant_id': model.plant_id,
                        'model_type': model.model_type,
                        'accuracy': model.accuracy,
                        'last_trained': model.last_trained,
                        'samples_used': loaded.get('samples', 0) if isinstance(loaded, dict) else 0
                    })
            except Exception as e:
                logger.error(f"Error evaluando modelo {model.id}: {str(e)}")
        
        # Ordenar por accuracy
        results.sort(key=lambda x: x['accuracy'], reverse=True)
        
        # Generar recomendaciones de mejora
        recommendations = []
        if results:
            best = results[0]
            worst = results[-1]
            
            if best['accuracy'] - worst['accuracy'] > 0.2:
                recommendations.append(
                    f"Considerar reentrenar modelo de planta {worst['plant_id']} "
                    f"(accuracy: {worst['accuracy']:.2f})"
                )
            
            if len([r for r in results if r['accuracy'] < 0.7]) > 0:
                recommendations.append(
                    f"{len([r for r in results if r['accuracy'] < 0.7])} modelos "
                    "necesitan mejora (accuracy < 70%)"
                )
        
        return {
            'total_modelos': len(results),
            'mejor_accuracy': results[0]['accuracy'] if results else 0,
            'peor_accuracy': results[-1]['accuracy'] if results else 0,
            'accuracy_promedio': np.mean([r['accuracy'] for r in results]) if results else 0,
            'recomendaciones': recommendations
        }
    
    def batch_predict_all_plants(self):
        """
        Predice necesidades de riego para todas las plantas
        """
        from main.models import Plant
        
        plants = Plant.objects.all()
        predictions = []
        
        for plant in plants:
            pred = self.predecir_proximo_riego(plant.id)
            pred['plant_id'] = plant.id
            pred['plant_name'] = plant.name
            predictions.append(pred)
            
            # Actualizar último registro de sensor con predicción
            latest = SensorReading.objects.filter(
                plant_id=plant.id
            ).order_by('-reading_time').first()
            
            if latest:
                latest.predicted_watering = pred['probabilidad'] > 0.5
                latest.watering_needed_probability = pred['probabilidad']
                latest.save()
        
        return predictions


# Instancia global del predictor
predictor = PlantPredictor()