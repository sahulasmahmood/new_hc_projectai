import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface VitalsSetting {
  id: number;
  vitalType: string;
  name: string;
  unit: string;
  minNormal: number | null;
  maxNormal: number | null;
  minCritical: number | null;
  maxCritical: number | null;
  isActive: boolean;
  notes: string | null;
}

export interface VitalsSettings {
  bloodPressureSys?: VitalsSetting;
  bloodPressureDia?: VitalsSetting;
  heartRate?: VitalsSetting;
  temperature?: VitalsSetting;
  respiratoryRate?: VitalsSetting;
  oxygenSaturation?: VitalsSetting;
  weight?: VitalsSetting;
  height?: VitalsSetting;
}

export const useVitalsSettings = () => {
  const [settings, setSettings] = useState<VitalsSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vitals-settings');
      const settingsArray: VitalsSetting[] = response.data;
      
      // Convert array to object keyed by vitalType
      const settingsObj: VitalsSettings = {};
      settingsArray.forEach(setting => {
        settingsObj[setting.vitalType as keyof VitalsSettings] = setting;
      });
      
      setSettings(settingsObj);
      setError(null);
    } catch (err) {
      console.error('Error fetching vitals settings:', err);
      setError('Failed to load vitals settings');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (
    value: number | null | undefined,
    vitalType: keyof VitalsSettings
  ): 'normal' | 'low' | 'high' | 'critical' | 'unknown' => {
    if (value === null || value === undefined) return 'unknown';
    
    const setting = settings[vitalType];
    if (!setting || !setting.isActive) return 'unknown';

    // Check critical ranges first
    if (setting.minCritical !== null && value < setting.minCritical) return 'critical';
    if (setting.maxCritical !== null && value > setting.maxCritical) return 'critical';

    // Check normal ranges
    if (setting.minNormal !== null && value < setting.minNormal) return 'low';
    if (setting.maxNormal !== null && value > setting.maxNormal) return 'high';

    return 'normal';
  };

  const getBloodPressureStatus = (
    systolic: number | null | undefined,
    diastolic: number | null | undefined
  ): 'normal' | 'low' | 'high' | 'critical' | 'unknown' => {
    if (systolic === null || systolic === undefined || 
        diastolic === null || diastolic === undefined) {
      return 'unknown';
    }

    const sysStatus = getStatus(systolic, 'bloodPressureSys');
    const diaStatus = getStatus(diastolic, 'bloodPressureDia');

    // If either is critical, return critical
    if (sysStatus === 'critical' || diaStatus === 'critical') return 'critical';
    
    // If either is high, return high
    if (sysStatus === 'high' || diaStatus === 'high') return 'high';
    
    // If either is low, return low
    if (sysStatus === 'low' || diaStatus === 'low') return 'low';
    
    // Both are normal
    if (sysStatus === 'normal' && diaStatus === 'normal') return 'normal';
    
    return 'unknown';
  };

  const getNormalRangeText = (vitalType: keyof VitalsSettings): string => {
    const setting = settings[vitalType];
    if (!setting || !setting.isActive) return 'N/A';

    if (setting.minNormal !== null && setting.maxNormal !== null) {
      return `${setting.minNormal}-${setting.maxNormal} ${setting.unit}`;
    }
    
    if (setting.minNormal !== null) {
      return `≥${setting.minNormal} ${setting.unit}`;
    }
    
    if (setting.maxNormal !== null) {
      return `≤${setting.maxNormal} ${setting.unit}`;
    }

    return 'N/A';
  };

  const getBloodPressureRangeText = (): string => {
    const sysSetting = settings.bloodPressureSys;
    const diaSetting = settings.bloodPressureDia;
    
    if (!sysSetting || !diaSetting || !sysSetting.isActive || !diaSetting.isActive) {
      return 'N/A';
    }

    if (sysSetting.minNormal !== null && sysSetting.maxNormal !== null &&
        diaSetting.minNormal !== null && diaSetting.maxNormal !== null) {
      return `${sysSetting.minNormal}/${diaSetting.minNormal}-${sysSetting.maxNormal}/${diaSetting.maxNormal} mmHg`;
    }

    return 'N/A';
  };

  return {
    settings,
    loading,
    error,
    getStatus,
    getBloodPressureStatus,
    getNormalRangeText,
    getBloodPressureRangeText,
    refetch: fetchSettings
  };
};
