
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Heart, Thermometer, Weight, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const HealthMetrics = () => {
  const vitalSigns = [
    { title: "Heart Rate", value: "72 BPM", icon: Heart, color: "text-red-500", trend: "+2%" },
    { title: "Blood Pressure", value: "120/80", icon: Activity, color: "text-blue-500", trend: "-1%" },
    { title: "Temperature", value: "98.6°F", icon: Thermometer, color: "text-orange-500", trend: "0%" },
    { title: "Weight", value: "154 lbs", icon: Weight, color: "text-green-500", trend: "-0.5%" },
  ];

  const heartRateData = [
    { time: "00:00", rate: 65 },
    { time: "04:00", rate: 62 },
    { time: "08:00", rate: 72 },
    { time: "12:00", rate: 78 },
    { time: "16:00", rate: 75 },
    { time: "20:00", rate: 68 },
    { time: "24:00", rate: 64 },
  ];

  const bloodPressureData = [
    { date: "Mon", systolic: 120, diastolic: 80 },
    { date: "Tue", systolic: 118, diastolic: 78 },
    { date: "Wed", systolic: 122, diastolic: 82 },
    { date: "Thu", systolic: 119, diastolic: 79 },
    { date: "Fri", systolic: 121, diastolic: 81 },
    { date: "Sat", systolic: 117, diastolic: 77 },
    { date: "Sun", systolic: 120, diastolic: 80 },
  ];

  const weightData = [
    { week: "Week 1", weight: 156 },
    { week: "Week 2", weight: 155.5 },
    { week: "Week 3", weight: 154.8 },
    { week: "Week 4", weight: 154.2 },
    { week: "Week 5", weight: 154 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Health Metrics</h1>
        </div>
        <Button className="bg-medical-500 hover:bg-medical-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Reading
        </Button>
      </div>

      {/* Vital Signs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vitalSigns.map((vital, index) => {
          const Icon = vital.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`h-6 w-6 ${vital.color}`} />
                  <span className={`text-sm font-medium ${
                    vital.trend.startsWith('+') ? 'text-red-500' : 
                    vital.trend.startsWith('-') ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {vital.trend}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{vital.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{vital.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Heart Rate (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heartRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[60, 85]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="rate" stroke="#EF4444" fill="#FEE2E2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Blood Pressure (Weekly)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bloodPressureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[70, 130]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="systolic" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="diastolic" stroke="#60A5FA" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weight Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Weight className="h-5 w-5 text-green-500" />
            Weight Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[150, 160]} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#10B981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Health Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI Health Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800">Positive Trend</h4>
            <p className="text-sm text-green-700">Your weight loss progress is on track. Keep maintaining your current routine.</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800">Recommendation</h4>
            <p className="text-sm text-blue-700">Your heart rate variability looks good. Consider adding more cardio exercises.</p>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800">Monitor</h4>
            <p className="text-sm text-yellow-700">Blood pressure readings show slight elevation. Schedule a follow-up if trend continues.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthMetrics;
