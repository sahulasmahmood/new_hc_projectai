import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, User, Phone, Activity, Siren, Heart, Zap, ArrowRightLeft, Calendar, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import axios from "axios";
import { useVitalsSettings } from "@/hooks/useVitalsSettings";

const statusOptions = [
  "Waiting",
  "In Treatment",
  "Discharged"
];

// Define EmergencyCase type
interface EmergencyCase {
  id: number;
  caseId: string;
  patientId: number;
  patientName: string;
  age: number;
  gender: string;
  phone: string;
  chiefComplaint: string;
  triagePriority: string;
  assignedTo: string;
  status: string;
  arrivalTime: string;
  vitals: {
    bp: string;
    pulse: string;
    temp: string;
    spo2: string;
  };
  // Transfer information
  transferStatus?: string;
  transferTo?: string;
  transferReason?: string;
  transferNotes?: string;
  transferTime?: string;
}

const transferHospitals = [
  { value: "GH", label: "Government Hospital" },
  { value: "Private", label: "Private Hospital" },
  { value: "Other", label: "Other" },
];

const Emergency = () => {
  // Use dynamic vitals settings
  const { 
    getBloodPressureStatus, 
    getStatus, 
    getNormalRangeText,
    getBloodPressureRangeText 
  } = useVitalsSettings();
  
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [emergencyCases, setEmergencyCases] = useState<EmergencyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    patientName: '',
    age: '',
    gender: '',
    phone: '',
    chiefComplaint: '',
    triagePriority: '',
    bp: '',
    pulse: '',
    temp: '',
    spo2: '',
    assignedTo: '',
    status: '',
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusCaseId, setStatusCaseId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [fullChartOpen, setFullChartOpen] = useState(false);
  const [fullChartCase, setFullChartCase] = useState<EmergencyCase | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferCase, setTransferCase] = useState<EmergencyCase | null>(null);
  const [transferHospital, setTransferHospital] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [vitalsDialogOpen, setVitalsDialogOpen] = useState(false);
  const [vitalsCase, setVitalsCase] = useState<EmergencyCase | null>(null);
  const [vitalsBP, setVitalsBP] = useState("");
  const [vitalsPulse, setVitalsPulse] = useState("");
  const [vitalsTemp, setVitalsTemp] = useState("");
  const [vitalsSpO2, setVitalsSpO2] = useState("");
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [vitalsError, setVitalsError] = useState<string | null>(null);
  // Date range functionality (like billing)
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [dateRange, setDateRange] = useState({
    startDate: getToday(),
    endDate: getToday()
  });
  const [isCustomRangeSelected, setIsCustomRangeSelected] = useState(false);

  // Quick date selector functions
  const setDateRangeQuick = (type: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    switch (type) {
      case 'today':
        setDateRange({
          startDate: formatDate(today),
          endDate: formatDate(today)
        });
        setIsCustomRangeSelected(false);
        break;
      case 'yesterday':
        setDateRange({
          startDate: formatDate(yesterday),
          endDate: formatDate(yesterday)
        });
        setIsCustomRangeSelected(false);
        break;
      case 'last7days':
        setDateRange({
          startDate: formatDate(last7Days),
          endDate: formatDate(today)
        });
        setIsCustomRangeSelected(false);
        break;
      case 'thismonth':
        setDateRange({
          startDate: formatDate(thisMonthStart),
          endDate: formatDate(today)
        });
        setIsCustomRangeSelected(false);
        break;
      case 'clear':
        setDateRange({
          startDate: "",
          endDate: ""
        });
        setIsCustomRangeSelected(false);
        break;
      case 'custom':
        setIsCustomRangeSelected(true);
        break;
    }
  };

  // Get user-friendly date range description
  const getDateRangeDescription = () => {
    if (!dateRange.startDate && !dateRange.endDate) {
      return "All Time";
    }
    
    const today = getToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (dateRange.startDate === today && dateRange.endDate === today) {
      return "Today";
    }
    
    if (dateRange.startDate === yesterdayStr && dateRange.endDate === yesterdayStr) {
      return "Yesterday";
    }
    
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate).toLocaleDateString();
      const end = new Date(dateRange.endDate).toLocaleDateString();
      
      if (start === end) {
        return start;
      }
      return `${start} - ${end}`;
    }
    
    return "Custom Range";
  };

  // Get current date range type for dropdown selection
  const getCurrentDateRangeType = () => {
    // If custom is explicitly selected, return custom
    if (isCustomRangeSelected) {
      return "custom";
    }
    
    if (!dateRange.startDate && !dateRange.endDate) {
      return "clear";
    }
    
    const today = getToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last7DaysStr = last7Days.toISOString().split('T')[0];
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    const thisMonthStartStr = thisMonthStart.toISOString().split('T')[0];
    
    if (dateRange.startDate === today && dateRange.endDate === today) {
      return "today";
    }
    
    if (dateRange.startDate === yesterdayStr && dateRange.endDate === yesterdayStr) {
      return "yesterday";
    }
    
    if (dateRange.startDate === last7DaysStr && dateRange.endDate === today) {
      return "last7days";
    }
    
    if (dateRange.startDate === thisMonthStartStr && dateRange.endDate === today) {
      return "thismonth";
    }
    
    return "custom";
  };


  const [transferDetailsDialogOpen, setTransferDetailsDialogOpen] = useState(false);
  const [selectedTransferCase, setSelectedTransferCase] = useState<EmergencyCase | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedPriority !== "all") params.append("priority", selectedPriority);
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);
      
      const url = params.toString() ? `/emergency?${params.toString()}` : "/emergency";
      const res = await api.get(url);
      setEmergencyCases(res.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch emergency cases");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [selectedStatus, selectedPriority, dateRange]);

  // Helper to handle form input changes
  const handleRegisterInput = (field: string, value: string) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  };

  // POST new emergency case
  const handleRegisterCase = async () => {
    // Frontend validation for required fields
    if (!registerForm.patientName || !registerForm.age || !registerForm.gender || !registerForm.phone) {
      setRegisterError('Please fill all required fields: Name, Age, Gender, and Phone.');
      return;
    }
    // Numeric age validation
    const ageNum = Number(registerForm.age);
    if (!Number.isInteger(ageNum) || ageNum <= 0) {
      setRegisterError('Age must be a positive integer.');
      return;
    }
    // Phone validation (at least 10 digits, numbers only)
    const phoneDigits = registerForm.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setRegisterError('Phone number must be at least 10 digits.');
      return;
    }
    // Triage priority validation
    if (!registerForm.triagePriority) {
      setRegisterError('Please select a triage priority.');
      return;
    }
    setRegisterLoading(true);
    setRegisterError(null);
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timeStr = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
      // Call atomic registration endpoint
      await api.post('/emergency/register', {
        patient: {
          name: registerForm.patientName,
          age: ageNum,
          gender: registerForm.gender,
          phone: registerForm.phone,
          status: 'Active',
          allergies: [],
          createdFromEmergency: true,
        },
        appointment: {
          date: now.toISOString().split('T')[0],
          time: timeStr,
          type: 'Emergency',
          duration: '30',
          status: 'Confirmed',
          notes: `Auto-created for emergency (${registerForm.triagePriority})`,
        },
        emergencyCase: {
          chiefComplaint: registerForm.chiefComplaint,
          arrivalTime: now.toISOString(),
          triagePriority: registerForm.triagePriority,
          assignedTo: registerForm.assignedTo || 'Unassigned',
          status: registerForm.status || 'Waiting',
          vitals: {
            bp: registerForm.bp,
            pulse: registerForm.pulse,
            temp: registerForm.temp,
            spo2: registerForm.spo2,
          },
        },
      });
      setRegisterDialogOpen(false);
      setRegisterForm({
        patientName: '', age: '', gender: '', phone: '', chiefComplaint: '', triagePriority: '', bp: '', pulse: '', temp: '', spo2: '', assignedTo: '', status: '',
      });
      fetchCases();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response && err.response.data && err.response.data.error) {
        setRegisterError(err.response.data.error);
      } else if (err instanceof Error) {
        setRegisterError(err.message);
      } else {
        setRegisterError('Failed to register emergency case and appointment');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const triageProtocols = [
    {
      priority: "Critical",
      color: "Red",
      description: "Life-threatening conditions",
      examples: ["Cardiac arrest", "Severe trauma", "Respiratory failure", "Stroke"],
      waitTime: "Immediate"
    },
    {
      priority: "High",
      color: "Orange",
      description: "Urgent conditions",
      examples: ["Chest pain", "Severe bleeding", "High fever", "Fractures"],
      waitTime: "10-15 minutes"
    },
    {
      priority: "Medium",
      color: "Yellow",
      description: "Semi-urgent conditions",
      examples: ["Moderate pain", "Vomiting", "Minor burns", "Sprains"],
      waitTime: "30-60 minutes"
    },
    {
      priority: "Low",
      color: "Green",
      description: "Non-urgent conditions",
      examples: ["Minor cuts", "Cold symptoms", "Prescription refills"],
      waitTime: "1-2 hours"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Treatment": return "bg-blue-100 text-blue-800";
      case "Waiting": return "bg-yellow-100 text-yellow-800";
      case "Discharged": return "bg-green-100 text-green-800";
      case "Transferred": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleOpenStatusDialog = (caseId: number, currentStatus: string) => {
    setStatusCaseId(caseId);
    setNewStatus(currentStatus);
    setStatusDialogOpen(true);
    setStatusError(null);
  };

  const handleUpdateStatus = async () => {
    if (!statusCaseId || !newStatus) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      await api.put(`/emergency/${statusCaseId}`, { status: newStatus });
      setStatusDialogOpen(false);
      fetchCases();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setStatusError(err.message);
      } else {
        setStatusError("Failed to update status");
      }
    } finally {
      setStatusLoading(false);
    }
  };

  const handleOpenFullChart = (case_: EmergencyCase) => {
    setFullChartCase(case_);
    setFullChartOpen(true);
  };

  // Helper functions for vitals - now using dynamic settings
  const getBPStatus = (bp: string) => {
    if (!bp) return 'unknown';
    const parts = bp.split('/').map(Number);
    if (parts.length === 1 || !parts[1]) {
      // Single value provided (systolic only)
      return getStatus(parts[0], 'bloodPressureSys');
    }
    // Both systolic and diastolic
    const [sys, dia] = parts;
    return getBloodPressureStatus(sys, dia);
  };
  
  const getPulseStatus = (pulse: string) => {
    const p = Number(pulse);
    if (!p) return 'unknown';
    return getStatus(p, 'heartRate');
  };
  
  const getTempStatus = (temp: string) => {
    const t = parseFloat(temp);
    if (!t) return 'unknown';
    return getStatus(t, 'temperature');
  };
  
  const getSpO2Status = (spo2: string) => {
    const s = Number(spo2.replace('%', ''));
    if (!s) return 'unknown';
    return getStatus(s, 'oxygenSaturation');
  };

  const handleOpenTransferDialog = (case_: EmergencyCase) => {
    setTransferCase(case_);
    setTransferHospital("");
    setTransferReason("");
    setTransferNotes("");
    setTransferError(null);
    setTransferDialogOpen(true);
  };

  const handleTransferCase = async () => {
    if (!transferHospital || !transferReason) {
      setTransferError("Please select a hospital and enter a reason.");
      return;
    }
    setTransferLoading(true);
    setTransferError(null);
    try {
      await api.put(`/emergency/${transferCase?.id}/transfer`, {
        transferTo: transferHospital,
        transferReason,
        transferNotes,
      });
      setTransferDialogOpen(false);
      setTransferCase(null);
      fetchCases();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTransferError(err.message);
      } else {
        setTransferError("Failed to transfer case");
      }
    } finally {
      setTransferLoading(false);
    }
  };

  const handleViewTransferDetails = (case_: EmergencyCase) => {
    setSelectedTransferCase(case_);
    setTransferDetailsDialogOpen(true);
  };

  const handleOpenVitalsDialog = (case_: EmergencyCase) => {
    setVitalsCase(case_);
    setVitalsBP(case_.vitals.bp || "");
    setVitalsPulse(case_.vitals.pulse || "");
    setVitalsTemp(case_.vitals.temp || "");
    setVitalsSpO2(case_.vitals.spo2 || "");
    setVitalsError(null);
    setVitalsDialogOpen(true);
  };

  const handleUpdateVitals = async () => {
    setVitalsLoading(true);
    setVitalsError(null);
    try {
      await api.put(`/emergency/${vitalsCase?.id}`, {
        vitals: {
          bp: vitalsBP,
          pulse: vitalsPulse,
          temp: vitalsTemp,
          spo2: vitalsSpO2,
        },
      });
       // Also save to patient vitals history for medical records
      if (vitalsCase?.patientId) {
        // Parse blood pressure
        const bpParts = vitalsBP.split('/');
        const systolic = bpParts[0] ? parseInt(bpParts[0]) : null;
        const diastolic = bpParts[1] ? parseInt(bpParts[1]) : null;
        
        // Parse other vitals
        const heartRate = vitalsPulse ? parseInt(vitalsPulse) : null;
        const temperature = vitalsTemp ? parseFloat(vitalsTemp) : null;
        const oxygenSaturation = vitalsSpO2 ? parseInt(vitalsSpO2.replace('%', '')) : null;

        const vitalsPayload = {
          patientId: vitalsCase.patientId,
          appointmentId: null, // Emergency vitals don't have specific appointment
          bloodPressureSys: systolic,
          bloodPressureDia: diastolic,
          heartRate: heartRate,
          temperature: temperature,
          respiratoryRate: null,
          oxygenSaturation: oxygenSaturation,
          weight: null,
          height: null,
          recordedBy: "Emergency Staff",
          notes: `Emergency vitals recorded for case ${vitalsCase.caseId}`
        };

        try {
          // Save to patient vitals history
          await api.post("/vitals", vitalsPayload);
        } catch (vitalsError) {
          console.error('Error saving vitals to patient history:', vitalsError);
          // Don't throw error here - we still want to update the emergency case
        }
      }
      setVitalsDialogOpen(false);
      setVitalsCase(null);
      fetchCases();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setVitalsError(err.message);
      } else {
        setVitalsError("Failed to update vitals");
      }
    } finally {
      setVitalsLoading(false);
    }
  };

  // Cases are now filtered on the backend
  const filteredCases = emergencyCases;

  // Helper to format ISO string to local date/time string
  function formatLocalDateTime(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  return (
    <div className="p-6 space-y-6">
      {loading && <div>Loading emergency cases...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Siren className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold text-gray-900">Emergency Department</h1>
        </div>
        <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-500 hover:bg-red-600">
              <Plus className="h-4 w-4 mr-2" />
              New Emergency Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register Emergency Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Patient Name <span className="text-red-500">*</span></label>
                  <Input placeholder="Patient Name" value={registerForm.patientName} onChange={e => handleRegisterInput('patientName', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Age <span className="text-red-500">*</span></label>
                  <Input placeholder="Age" type="number" value={registerForm.age} onChange={e => handleRegisterInput('age', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Gender <span className="text-red-500">*</span></label>
                  <Select value={registerForm.gender} onValueChange={v => handleRegisterInput('gender', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></label>
                  <Input placeholder="Phone Number" value={registerForm.phone} onChange={e => handleRegisterInput('phone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Chief Complaint <span className="text-red-500">*</span></label>
                <Textarea placeholder="Describe the main symptoms or condition..." value={registerForm.chiefComplaint} onChange={e => handleRegisterInput('chiefComplaint', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Triage Priority <span className="text-red-500">*</span></label>
                <Select value={registerForm.triagePriority} onValueChange={v => handleRegisterInput('triagePriority', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical (Red)</SelectItem>
                    <SelectItem value="High">High (Orange)</SelectItem>
                    <SelectItem value="Medium">Medium (Yellow)</SelectItem>
                    <SelectItem value="Low">Low (Green)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Input placeholder="BP" value={registerForm.bp} onChange={e => handleRegisterInput('bp', e.target.value)} />
                  <div className="text-xs text-gray-500 mt-1">BP (mmHg), normal: {getBloodPressureRangeText()}</div>
                </div>
                <div>
                  <Input placeholder="Pulse" value={registerForm.pulse} onChange={e => handleRegisterInput('pulse', e.target.value)} />
                  <div className="text-xs text-gray-500 mt-1">Pulse (bpm), normal:<br /> 60–100</div>
                </div>
                <div>
                  <Input placeholder="Temperature" value={registerForm.temp} onChange={e => handleRegisterInput('temp', e.target.value)} />
                  <div className="text-xs text-gray-500 mt-1">Temp (°F or °C), normal: 97.0–99.0°F</div>
                </div>
                <div>
                  <Input placeholder="SpO₂" value={registerForm.spo2} onChange={e => handleRegisterInput('spo2', e.target.value)} />
                  <div className="text-xs text-gray-500 mt-1">Oxygen Saturation (%), normal: 95–100%</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>Cancel</Button>
                <Button className="bg-red-500 hover:bg-red-600" onClick={handleRegisterCase} disabled={registerLoading}>
                  {registerLoading ? 'Registering...' : 'Register Case'}
                </Button>
              </div>
              {registerError && <div className="text-red-500 text-sm">{registerError}</div>}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Emergency Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {emergencyCases.filter(c => c.triagePriority === "Critical").length}
            </div>
            <div className="text-sm text-gray-600">Critical Cases</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {emergencyCases.filter(c => c.triagePriority === "High").length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {emergencyCases.filter(c => c.status === "In Treatment").length}
            </div>
            <div className="text-sm text-gray-600">In Treatment</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {emergencyCases.filter(c => c.status === "Waiting").length}
            </div>
            <div className="text-sm text-gray-600">Waiting</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Cases</TabsTrigger>
          <TabsTrigger value="triage">Triage Protocols</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Waiting">Waiting</SelectItem>
                    <SelectItem value="In Treatment">In Treatment</SelectItem>
                    <SelectItem value="Discharged">Discharged</SelectItem>
                    <SelectItem value="Transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>

                <Calendar className="h-4 w-4 text-gray-500" />
                <Label className="text-sm font-medium">Date Range:</Label>
                <Select 
                  value={getCurrentDateRangeType()} 
                  onValueChange={(value) => setDateRangeQuick(value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">📅 Today</SelectItem>
                    <SelectItem value="yesterday">📅 Yesterday</SelectItem>
                    <SelectItem value="last7days">📅 Last 7 Days</SelectItem>
                    <SelectItem value="thismonth">📅 This Month</SelectItem>
                    <SelectItem value="clear">📅 All Time</SelectItem>
                    <SelectItem value="custom">📅 Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Custom Date Range Inputs */}
                {isCustomRangeSelected && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="w-36"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="w-36"
                    />
                  </div>
                )}

                <div className="ml-auto text-sm text-gray-600">
                  Showing: {getDateRangeDescription()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Cases */}
          {filteredCases.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Siren className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Emergency Cases
                </h3>
                <p className="text-gray-600 mb-4">
                  {emergencyCases.length === 0 
                    ? "No emergency cases have been registered yet. Click 'New Emergency Case' to register the first case."
                    : "No emergency cases found matching your current filters. Try adjusting the status, priority, or date range filters."
                  }
                </p>
                <div className="flex justify-center gap-3">
                  <Button 
                    className="bg-red-500 hover:bg-red-600"
                    onClick={() => setRegisterDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Emergency Case
                  </Button>
                  {selectedPriority !== "all" && (
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedPriority("all")}
                    >
                      Show All Priorities
                    </Button>
                  )}

                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredCases.map((case_) => (
                <Card key={case_.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="font-semibold text-lg">{case_.caseId}</div>
                          <Badge className={getPriorityColor(case_.triagePriority)}>
                            {case_.triagePriority}
                          </Badge>
                          <Badge className={getStatusColor(case_.status)}>
                            {case_.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{case_.patientName}</span>
                          <span className="text-sm text-gray-600">({case_.age}Y, {case_.gender})</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{case_.phone}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{formatLocalDateTime(case_.arrivalTime)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Assigned to: {case_.assignedTo}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Chief Complaint:</div>
                      <div className="text-sm bg-gray-50 p-3 rounded-lg">{case_.chiefComplaint}</div>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Heart className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium">BP</span>
                        </div>
                        <div className="text-sm font-semibold">{case_.vitals.bp}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Activity className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium">Pulse</span>
                        </div>
                        <div className="text-sm font-semibold">{case_.vitals.pulse}</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span className="text-xs font-medium">Temp</span>
                        </div>
                        <div className="text-sm font-semibold">{case_.vitals.temp}</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Activity className="h-4 w-4 text-purple-600" />
                          <span className="text-xs font-medium">SpO2</span>
                        </div>
                        <div className="text-sm font-semibold">{case_.vitals.spo2}</div>
                      </div>
                    </div>

                    {/* Transfer Status Display */}
                    {case_.transferStatus === 'Transferred' && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-100 text-blue-800">Transferred</Badge>
                          <span className="text-sm text-blue-700 font-medium">
                            to {case_.transferTo}
                          </span>
                        </div>
                        <div className="text-xs text-blue-600">
                          <div>Reason: {case_.transferReason}</div>
                          {case_.transferTime && (
                            <div>Time: {new Date(case_.transferTime).toLocaleString()}</div>
                          )}
                          {case_.transferNotes && (
                            <div>Notes: {case_.transferNotes}</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      {/* Go to Appointment button for Waiting/In Treatment cases */}
                      {(case_.status === 'Waiting' || case_.status === 'In Treatment') && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/appointments?patientId=${case_.patientId}`} className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Go to Appointment
                          </a>
                        </Button>
                      )}
                      
                      {/* Only show Update Status if not transferred */}
                      {case_.transferStatus !== 'Transferred' && (
                        <Button size="sm" className="bg-medical-500 hover:bg-medical-600" onClick={() => handleOpenStatusDialog(case_.id, case_.status)}>
                          Update Status
                        </Button>
                      )}
                      
                      <Button variant="outline" size="sm" onClick={() => handleOpenFullChart(case_)}>
                        View Full Chart
                      </Button>
                      
                      {/* Transfer/View Transfer button logic */}
                      {case_.transferStatus === 'Transferred' ? (
                        <Button variant="outline" size="sm" onClick={() => handleViewTransferDetails(case_)}>
                          View Transfer Details
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleOpenTransferDialog(case_)}>
                          Transfer
                        </Button>
                      )}
                      
                      {/* Only show Add/Update Vitals if not transferred */}
                      {case_.transferStatus !== 'Transferred' && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenVitalsDialog(case_)}>
                          Add/Update Vitals
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="triage">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {triageProtocols.map((protocol, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${
                      protocol.color === "Red" ? "bg-red-500" :
                      protocol.color === "Orange" ? "bg-orange-500" :
                      protocol.color === "Yellow" ? "bg-yellow-500" :
                      "bg-green-500"
                    }`}></div>
                    <span>{protocol.priority} Priority</span>
                    <Badge variant="outline">{protocol.color}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-medium text-sm mb-2">Description:</div>
                    <div className="text-sm text-gray-600">{protocol.description}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm mb-2">Common Examples:</div>
                    <div className="space-y-1">
                      {protocol.examples.map((example, idx) => (
                        <div key={idx} className="text-sm bg-gray-50 px-2 py-1 rounded">
                          • {example}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Wait Time:</span>
                    <span>{protocol.waitTime}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Emergency Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateStatus} disabled={statusLoading || !newStatus} className="bg-blue-500 hover:bg-blue-600">
                {statusLoading ? "Updating..." : "Update"}
              </Button>
            </div>
            {statusError && <div className="text-red-500 text-sm">{statusError}</div>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={fullChartOpen} onOpenChange={setFullChartOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Full Chart - {fullChartCase?.caseId}</DialogTitle>
          </DialogHeader>
          {fullChartCase && (
            <div className="space-y-6">
              <div className="mb-2">
                <div className="font-semibold">{fullChartCase.patientName} ({fullChartCase.age}Y, {fullChartCase.gender})</div>
              </div>
              {/* Color Legend */}
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-green-500"></span><span className="text-xs text-gray-700">Normal</span></div>
                <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-red-500"></span><span className="text-xs text-gray-700">High</span></div>
                <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-yellow-500"></span><span className="text-xs text-gray-700">Low/Abnormal</span></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BP */}
                <div className="p-4 rounded shadow bg-white border">
                  <div className="font-medium mb-1">Blood Pressure (BP)</div>
                  <div className="flex items-center gap-2">
                    <div className={`text-lg font-bold ${getBPStatus(fullChartCase.vitals.bp)==='normal' ? 'text-green-600' : getBPStatus(fullChartCase.vitals.bp)==='high' ? 'text-red-600' : 'text-yellow-600'}`}>{fullChartCase.vitals.bp}</div>
                    <span className="text-xs text-gray-500">Normal: {getBloodPressureRangeText()}</span>
                  </div>
                  <div className="h-2 w-full rounded bg-gray-200 mt-2">
                    <div className={`h-2 rounded ${getBPStatus(fullChartCase.vitals.bp)==='normal' ? 'bg-green-500' : getBPStatus(fullChartCase.vitals.bp)==='high' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{width:'100%'}}></div>
                  </div>
                </div>
                {/* Pulse */}
                <div className="p-4 rounded shadow bg-white border">
                  <div className="font-medium mb-1">Pulse</div>
                  <div className="flex items-center gap-2">
                    <div className={`text-lg font-bold ${getPulseStatus(fullChartCase.vitals.pulse)==='normal' ? 'text-green-600' : getPulseStatus(fullChartCase.vitals.pulse)==='high' ? 'text-red-600' : 'text-yellow-600'}`}>{fullChartCase.vitals.pulse}</div>
                    <span className="text-xs text-gray-500">Normal: {getNormalRangeText('heartRate')}</span>
                  </div>
                  <div className="h-2 w-full rounded bg-gray-200 mt-2">
                    <div className={`h-2 rounded ${getPulseStatus(fullChartCase.vitals.pulse)==='normal' ? 'bg-green-500' : getPulseStatus(fullChartCase.vitals.pulse)==='high' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{width:'100%'}}></div>
                  </div>
                </div>
                {/* Temp */}
                <div className="p-4 rounded shadow bg-white border">
                  <div className="font-medium mb-1">Temperature</div>
                  <div className="flex items-center gap-2">
                    <div className={`text-lg font-bold ${getTempStatus(fullChartCase.vitals.temp)==='normal' ? 'text-green-600' : getTempStatus(fullChartCase.vitals.temp)==='high' ? 'text-red-600' : 'text-yellow-600'}`}>{fullChartCase.vitals.temp}</div>
                    <span className="text-xs text-gray-500">Normal: {getNormalRangeText('temperature')}</span>
                  </div>
                  <div className="h-2 w-full rounded bg-gray-200 mt-2">
                    <div className={`h-2 rounded ${getTempStatus(fullChartCase.vitals.temp)==='normal' ? 'bg-green-500' : getTempStatus(fullChartCase.vitals.temp)==='high' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{width:'100%'}}></div>
                  </div>
                </div>
                {/* SpO2 */}
                <div className="p-4 rounded shadow bg-white border">
                  <div className="font-medium mb-1">SpO2</div>
                  <div className="flex items-center gap-2">
                    <div className={`text-lg font-bold ${getSpO2Status(fullChartCase.vitals.spo2)==='normal' ? 'text-green-600' : 'text-yellow-600'}`}>{fullChartCase.vitals.spo2}</div>
                    <span className="text-xs text-gray-500">Normal: {getNormalRangeText('oxygenSaturation')}</span>
                  </div>
                  <div className="h-2 w-full rounded bg-gray-200 mt-2">
                    <div className={`h-2 rounded ${getSpO2Status(fullChartCase.vitals.spo2)==='normal' ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width:'100%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Emergency Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Destination Hospital</label>
              <Select value={transferHospital} onValueChange={setTransferHospital}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  {transferHospitals.map((hosp) => (
                    <SelectItem key={hosp.value} value={hosp.value}>{hosp.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason for Transfer</label>
              <Textarea placeholder="Enter reason for transfer..." value={transferReason} onChange={e => setTransferReason(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Additional Notes (optional)</label>
              <Textarea placeholder="Any additional notes..." value={transferNotes} onChange={e => setTransferNotes(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleTransferCase} disabled={transferLoading || !transferHospital || !transferReason} className="bg-blue-500 hover:bg-blue-600">
                {transferLoading ? "Transferring..." : "Transfer"}
              </Button>
            </div>
            {transferError && <div className="text-red-500 text-sm">{transferError}</div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Vitals Dialog */}
      <Dialog open={vitalsDialogOpen} onOpenChange={setVitalsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add/Update Vitals</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="BP (e.g. 120/80)" value={vitalsBP} onChange={e => setVitalsBP(e.target.value)} />
              <div className="text-xs text-gray-500 mt-1">Normal: {getBloodPressureRangeText()}</div>
              <Input placeholder="Pulse (bpm)" value={vitalsPulse} onChange={e => setVitalsPulse(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Temperature (°F or °C)" value={vitalsTemp} onChange={e => setVitalsTemp(e.target.value)} />
              <Input placeholder="SpO2 (%)" value={vitalsSpO2} onChange={e => setVitalsSpO2(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setVitalsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateVitals} disabled={vitalsLoading} className="bg-blue-500 hover:bg-blue-600">
                {vitalsLoading ? "Saving..." : "Save Vitals"}
              </Button>
            </div>
            {vitalsError && <div className="text-red-500 text-sm">{vitalsError}</div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Details Dialog */}
      <Dialog open={transferDetailsDialogOpen} onOpenChange={setTransferDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              Transfer Details
            </DialogTitle>
          </DialogHeader>
          {selectedTransferCase && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-blue-100 text-blue-800">
                    {selectedTransferCase.caseId}
                  </Badge>
                  <span className="font-medium">{selectedTransferCase.patientName}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Transferred to:</span>
                    <div className="mt-1">
                      <Badge className="bg-green-100 text-green-800">
                        {selectedTransferCase.transferTo}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Transfer Time:</span>
                    <div className="text-gray-600">
                      {selectedTransferCase.transferTime ? 
                        new Date(selectedTransferCase.transferTime).toLocaleString() : 
                        'N/A'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Reason:</span>
                    <div className="text-gray-600">{selectedTransferCase.transferReason}</div>
                  </div>
                  
                  {selectedTransferCase.transferNotes && (
                    <div>
                      <span className="font-medium text-gray-700">Notes:</span>
                      <div className="text-gray-600">{selectedTransferCase.transferNotes}</div>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium text-gray-700">Original Complaint:</span>
                    <div className="text-gray-600">{selectedTransferCase.chiefComplaint}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setTransferDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Emergency;
