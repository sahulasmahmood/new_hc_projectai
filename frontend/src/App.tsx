
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Symptoms from "./pages/Symptoms";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientExam from "./pages/PatientExam";
import Appointments from "./pages/Appointments";
import Reports from "./pages/Reports";
/* import HealthMetrics from "./pages/HealthMetrics"; */
import Staff from "./pages/Staff";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
/* import WardManagement from "./pages/WardManagement"; */
/* import Laboratory from "./pages/Laboratory"; */
/* import Pharmacy from "./pages/Pharmacy"; */
import Emergency from "./pages/Emergency";
/* import Analytics from "./pages/Analytics"; */
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<AppLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="symptoms" element={<Symptoms />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patient-exam" element={<PatientExam />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="reports" element={<Reports />} />
{/*               <Route path="metrics" element={<HealthMetrics />} /> */}
              <Route path="staff" element={<Staff />} />
              <Route path="billing" element={<Billing />} />
              <Route path="inventory" element={<Inventory />} />
          {/*     <Route path="ward-management" element={<WardManagement />} /> */}
        {/*       <Route path="laboratory" element={<Laboratory />} /> */}
           {/*    <Route path="pharmacy" element={<Pharmacy />} /> */}
              <Route path="emergency" element={<Emergency />} />
           {/*    <Route path="analytics" element={<Analytics />} /> */}
              <Route path="user-management" element={<UserManagement />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
