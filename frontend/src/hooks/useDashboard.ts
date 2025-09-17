import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const useDashboardStats = (refreshKey: number = 0) => {
  return useQuery({
    queryKey: ['dashboard-stats', refreshKey],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });
};

export const useAppointmentTrends = (refreshKey: number = 0) => {
  return useQuery({
    queryKey: ['appointment-trends', refreshKey],
    queryFn: async () => {
      const response = await api.get('/dashboard/appointment-trends');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePatientGrowth = (refreshKey: number = 0) => {
  return useQuery({
    queryKey: ['patient-growth', refreshKey],
    queryFn: async () => {
      const response = await api.get('/dashboard/patient-growth');
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useRevenueTrends = (refreshKey: number = 0) => {
  return useQuery({
    queryKey: ['revenue-trends', refreshKey],
    queryFn: async () => {
      const response = await api.get('/dashboard/revenue-trends');
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useRecentActivities = (refreshKey: number = 0) => {
  return useQuery({
    queryKey: ['recent-activities', refreshKey],
    queryFn: async () => {
      const response = await api.get('/dashboard/recent-activities');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // 1 minute
  });
};

export const useLowStockAlerts = (refreshKey: number = 0) => {
  return useQuery({
    queryKey: ['low-stock-alerts', refreshKey],
    queryFn: async () => {
      const response = await api.get('/dashboard/low-stock-alerts');
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useUpcomingAppointments = (refreshKey: number = 0) => {
  return useQuery({
    queryKey: ['upcoming-appointments', refreshKey],
    queryFn: async () => {
      const response = await api.get('/dashboard/upcoming-appointments');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  });
};