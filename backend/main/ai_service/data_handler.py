# main/ai_service/data_handler.py
import pandas as pd
from datetime import datetime, timedelta
from django.db import connection
import logging

logger = logging.getLogger(__name__)

class DataHandler:
    """
    Maneja la extracción y preparación de datos para ML
    """
    
    def __init__(self):
        self.cache = {}
    
    def get_plant_training_data(self, plant_id, days=30):
        """
        Obtiene datos estructurados para entrenamiento
        """
        cache_key = f"plant_{plant_id}_{days}"
        
        if cache_key in self.cache:
            if datetime.now() - self.cache[cache_key]['timestamp'] < timedelta(minutes=30):
                return self.cache[cache_key]['data']
        
        query = """
        SELECT 
            sr.reading_time,
            sr.temperature,
            sr.humidity,
            sr.soil_moisture,
            sr.light_intensity,
            EXTRACT(HOUR FROM sr.reading_time) as hour,
            EXTRACT(DOW FROM sr.reading_time) as day_of_week,
            EXTRACT(MONTH FROM sr.reading_time) as month,
            w.watering_time as last_watering,
            w.duration as watering_duration
        FROM main_sensorreading sr
        LEFT JOIN main_wateringlevel w 
            ON sr.plant_id = w.plant_id 
            AND DATE(sr.reading_time) = DATE(w.watering_time)
            AND w.watering_time >= sr.reading_time - INTERVAL '24 hours'
        WHERE sr.plant_id = %s
        AND sr.reading_time >= NOW() - INTERVAL '%s days'
        ORDER BY sr.reading_time
        """
        
        with connection.cursor() as cursor:
            cursor.execute(query, [plant_id, days])
            columns = [col[0] for col in cursor.description]
            data = cursor.fetchall()
        
        df = pd.DataFrame(data, columns=columns)
        
        # Cachear resultados
        self.cache[cache_key] = {
            'data': df,
            'timestamp': datetime.now()
        }
        
        return df
    
    def generate_features(self, df):
        """
        Genera características adicionales para ML
        """
        if df.empty:
            return df
        
        # Características de tiempo
        df['hour_sin'] = pd.Series(np.sin(2 * np.pi * df['hour'] / 24))
        df['hour_cos'] = pd.Series(np.cos(2 * np.pi * df['hour'] / 24))
        
        # Características de tendencia
        df['temp_trend'] = df['temperature'].diff().fillna(0)
        df['humidity_trend'] = df['humidity'].diff().fillna(0)
        
        # Interacciones
        df['temp_humidity_interaction'] = df['temperature'] * df['humidity'] / 100
        
        # Indicador de último riego
        df['hours_since_watering'] = df.apply(
            lambda row: (row['reading_time'] - row['last_watering']).total_seconds() / 3600 
            if pd.notnull(row['last_watering']) else 24,
            axis=1
        )
        
        return df