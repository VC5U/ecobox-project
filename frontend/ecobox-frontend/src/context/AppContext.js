import React, { createContext, useState, useContext, useCallback } from 'react';
import { dashboardService, plantasService } from '../services/plantasService';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [plantas, setPlantas] = useState([]);
  const [sensores, setSensores] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getDashboard();
      setDashboardData(data);
      return data;
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlantas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await plantasService.getPlantas();
      setPlantas(data);
      return data;
    } catch (error) {
      console.error('Error cargando plantas:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    plantas,
    sensores,
    dashboardData,
    loading,
    loadDashboard,
    loadPlantas
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};