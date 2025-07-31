import { useState, useCallback } from "react";
import api from "@/lib/api";

export interface HospitalSettings {
  id?: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  license?: string;
  director?: string;
  capacity?: number;
  founded?: string;
}

export function useHospitalSettings() {
  const [settings, setSettings] = useState<HospitalSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/settings/hospital-settings");
      setSettings(res.data || {});
    } catch (err) {
      setError("Failed to load hospital settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: HospitalSettings) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/settings/hospital-settings", newSettings);
      setSettings(res.data);
      return true;
    } catch (err) {
      setError("Failed to save hospital settings");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { settings, setSettings, loading, error, loadSettings, saveSettings };
}