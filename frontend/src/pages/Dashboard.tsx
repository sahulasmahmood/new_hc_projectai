
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Heart, 
  DollarSign, 
  AlertTriangle, 
  Package, 
  UserCheck,
  Clock,
  Bell,
  RefreshCw
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { useState } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { QuickSummary } from "@/components/dashboard/QuickSummary";
import {
  useDashboardStats,
  useAppointmentTrends,
  usePatientGrowth,
  useRevenueTrends,
  useRecentActivities,
  useLowStockAlerts,
  useUpcomingAppointments
} from "@/hooks/useDashboard";

const Dashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch dashboard data using custom hooks
  const { data: stats, isLoading: statsLoading } = useDashboardStats(refreshKey);
  const { data: appointmentTrends, isLoading: trendsLoading } = useAppointmentTrends(refreshKey);
  const { data: patientGrowth, isLoading: growthLoading } = usePatientGrowth(refreshKey);
  const { data: revenueTrends, isLoading: revenueLoading } = useRevenueTrends(refreshKey);
  const { data: recentActivities, isLoading: activitiesLoading } = useRecentActivities(refreshKey);
  const { data: lowStockAlerts, isLoading: stockLoading } = useLowStockAlerts(refreshKey);
  const { data: upcomingAppointments, isLoading: upcomingLoading } = useUpcomingAppointments(refreshKey);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const dashboardCards = [
    { 
      title: "Total Patients", 
      value: stats?.data?.totalPatients || 0, 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      trend: stats?.data?.trends?.patients ? `${stats.data.trends.patients > 0 ? '+' : ''}${stats.data.trends.patients}%` : undefined,
      trendUp: (stats?.data?.trends?.patients || 0) >= 0
    },
    { 
      title: "Today's Appointments", 
      value: stats?.data?.todayAppointments || 0, 
      icon: Calendar, 
      color: "text-green-600", 
      bg: "bg-green-50",
      trend: stats?.data?.trends?.appointments ? `${stats.data.trends.appointments > 0 ? '+' : ''}${stats.data.trends.appointments}%` : undefined,
      trendUp: (stats?.data?.trends?.appointments || 0) >= 0
    },
    { 
      title: "Monthly Revenue", 
      value: formatCurrency(stats?.data?.monthlyRevenue || 0), 
      icon: DollarSign, 
      color: "text-purple-600", 
      bg: "bg-purple-50",
      trend: stats?.data?.trends?.revenue ? `${stats.data.trends.revenue > 0 ? '+' : ''}${stats.data.trends.revenue}%` : undefined,
      trendUp: (stats?.data?.trends?.revenue || 0) >= 0
    },
    { 
      title: "Pending Bills", 
      value: stats?.data?.pendingBills || 0, 
      icon: AlertTriangle, 
      color: "text-orange-600", 
      bg: "bg-orange-50",
      trend: stats?.data?.trends?.bills ? `${stats.data.trends.bills > 0 ? '+' : ''}${stats.data.trends.bills}%` : undefined,
      trendUp: (stats?.data?.trends?.bills || 0) <= 0 // For bills, negative trend is good
    },
    { 
      title: "Low Stock Items", 
      value: stats?.data?.lowStockItems || 0, 
      icon: Package, 
      color: "text-red-600", 
      bg: "bg-red-50"
      // No trend for stock items as it's more of an alert
    },
    { 
      title: "Active Staff", 
      value: stats?.data?.activeStaff || 0, 
      icon: UserCheck, 
      color: "text-indigo-600", 
      bg: "bg-indigo-50"
      // No trend for active staff as it's current status
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Healthcare Dashboard</h1>
          <div className="flex items-center space-x-2 text-medical-600">
            <Heart className="h-6 w-6" />
            <span className="text-sm font-medium">AI-Powered Healthcare</span>
          </div>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={statsLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {dashboardCards.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
            trend={stat.trend}
            trendUp={stat.trendUp}
            isLoading={statsLoading}
          />
        ))}
      </div>

      {/* Weekly Appointments Chart */}
      <div className="grid grid-cols-1 gap-6">
        <ChartCard
          title="Weekly Appointments"
          icon={Calendar}
          isLoading={trendsLoading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appointmentTrends?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="appointments" fill="#4FD1C5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <QuickSummary 
            data={stats?.data || {}}
            isLoading={statsLoading}
          />
        </div>
        <div className="lg:col-span-3">
          <ChartCard
            title="Revenue Trends (6 Months)"
            icon={DollarSign}
            isLoading={revenueLoading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrends?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Patient Growth and Activities Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Patient Growth (6 Months)"
            icon={TrendingUp}
            isLoading={growthLoading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patientGrowth?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="patients" 
                  stroke="#4FD1C5" 
                  fill="#4FD1C5" 
                  fillOpacity={0.3}
                  strokeWidth={3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-medical-500" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed 
              activities={recentActivities?.data || []}
              isLoading={activitiesLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Upcoming Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsPanel
              type="stock"
              title="Low Stock Alerts"
              items={lowStockAlerts?.data || []}
              isLoading={stockLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsPanel
              type="appointments"
              title="Upcoming Appointments"
              items={upcomingAppointments?.data || []}
              isLoading={upcomingLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
