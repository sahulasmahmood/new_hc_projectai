import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MedicineSearch from "@/components/prescription/MedicineSearch";
import api from "@/lib/api";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Doctor {
  id: number;
  name: string;
  qualification?: string;
  role: string;
  digitalSignature?: string;
}

interface EditingMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionFormProps {
  patientId: string;
  patientName: string;
  appointmentId?: string;
  onSave?: (prescriptionData: unknown) => void;
}

const PrescriptionForm = ({ patientId, patientName, appointmentId, onSave }: PrescriptionFormProps) => {
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [investigations, setInvestigations] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [advice, setAdvice] = useState("");
  const [hospitalInfo, setHospitalInfo] = useState<{
    name?: string;
    phone?: string;
    license?: string;
    address?: string;
  } | null>(null);
  const [loadingHospitalInfo, setLoadingHospitalInfo] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [editingMedication, setEditingMedication] = useState<EditingMedication | null>(null);
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: ""
  });

  // Fetch hospital information and doctors
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hospital info
        const hospitalResponse = await api.get('/settings/hospital-settings');
        setHospitalInfo(hospitalResponse.data);
      } catch (error) {
        console.error('Error fetching hospital settings:', error);
        setHospitalInfo({
          name: "MEDICAL CLINIC",
          phone: "Emergency: Not Configured",
          license: "Please configure in Hospital Settings"
        });
      } finally {
        setLoadingHospitalInfo(false);
      }

      try {
        // Fetch doctors
        const doctorsResponse = await api.get('/prescriptions/doctors');
        setDoctors(doctorsResponse.data);
        // Don't auto-select - force user to choose for security
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchData();
  }, []);

  const addMedication = () => {
    if (!newMedication.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter medication name",
        variant: "destructive"
      });
      return;
    }

    const medication: Medication = {
      id: Date.now().toString(),
      name: newMedication.name,
      dosage: newMedication.dosage || "As directed",
      frequency: newMedication.frequency || "As needed",
      duration: newMedication.duration || "As prescribed"
    };

    setMedications([...medications, medication]);
    setNewMedication({ name: "", dosage: "", frequency: "", duration: "" });
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(med => med.id !== id));
  };

  const editMedication = (medication: Medication) => {
    setEditingMedication(medication);
    setNewMedication({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      duration: medication.duration
    });
  };

  const updateMedication = () => {
    if (!editingMedication || !newMedication.name.trim()) return;

    setMedications(medications.map(med => 
      med.id === editingMedication.id 
        ? {
            ...med,
            name: newMedication.name,
            dosage: newMedication.dosage || "As directed",
            frequency: newMedication.frequency || "As needed",
            duration: newMedication.duration || "As prescribed"
          }
        : med
    ));

    setEditingMedication(null);
    setNewMedication({ name: "", dosage: "", frequency: "", duration: "" });
  };

  const cancelEdit = () => {
    setEditingMedication(null);
    setNewMedication({ name: "", dosage: "", frequency: "", duration: "" });
  };

  const handleSave = async () => {
    // Validate doctor selection - MANDATORY for security
    if (!selectedDoctorId) {
      toast({
        title: "Doctor Selection Required",
        description: "Please select an attending doctor before saving the prescription. This is required for security and legal compliance.",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedDoctor = doctors.find(d => d.id.toString() === selectedDoctorId);
      
      if (!selectedDoctor) {
        toast({
          title: "Invalid Doctor Selection",
          description: "Please select a valid doctor from the list.",
          variant: "destructive"
        });
        return;
      }
      
      const prescriptionData = {
        patientId: parseInt(patientId),
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
        chiefComplaint,
        medications,
        investigations,
        doctorNotes,
        advice,
        doctorId: parseInt(selectedDoctorId),
        doctorName: selectedDoctor.name
      };

      const response = await api.post('/prescriptions', prescriptionData);

      if (onSave) {
        onSave(response.data);
      }

      toast({
        title: "✅ Prescription Saved Successfully",
        description: "Prescription has been saved and consultation completed. The patient's consultation status has been updated.",
        duration: 5000
      });

      // Clear form after successful save
      setChiefComplaint("");
      setMedications([]);
      setInvestigations("");
      setDoctorNotes("");
      setAdvice("");
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast({
        title: "Error",
        description: "Failed to save prescription. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-2 border-gray-300">
        <CardContent className="p-8">
        {/* Hospital Header */}
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          {loadingHospitalInfo ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {hospitalInfo?.name?.toUpperCase() || "MEDICAL CLINIC"}
              </h1>
              <div className="text-xs text-gray-600">
                <div className="flex flex-wrap justify-center gap-2">
                  {hospitalInfo?.phone && (
                    <span>Emergency: {hospitalInfo.phone}</span>
                  )}
                  {hospitalInfo?.phone && hospitalInfo?.license && <span>|</span>}
                  {hospitalInfo?.license && (
                    <span>Lic. No.: {hospitalInfo.license}</span>
                  )}
                  {(!hospitalInfo?.phone && !hospitalInfo?.license) && (
                    <span className="text-orange-600">Please configure Hospital Information in Settings</span>
                  )}
                </div>
                {hospitalInfo?.address && (
                  <div className="mt-1 text-xs text-gray-500">
                    {hospitalInfo.address}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Patient Info */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold">Patient: {patientName}</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-gray-600">ID: {patientId}</p>
              {appointmentId && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  Active Consultation
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Doctor Selection - MANDATORY */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attending Doctor: <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 block mt-1">Required for prescription security and legal compliance</span>
          </label>
          {loadingDoctors ? (
            <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
          ) : doctors.length === 0 ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              No doctors available. Please add doctors to staff before creating prescriptions.
            </div>
          ) : (
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger className={`w-full ${!selectedDoctorId ? 'border-red-300' : ''}`}>
                <SelectValue placeholder="⚠️ Select attending doctor (Required)" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{doctor.name}</span>
                      {doctor.qualification && (
                        <span className="text-xs text-gray-500">{doctor.qualification}</span>
                      )}
                      {doctor.digitalSignature && (
                        <span className="text-xs text-green-600">✓ Digital signature available</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Chief Complaints & Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chief Complaints & Diagnosis:
            </label>
            <Textarea
              placeholder="Enter chief complaints and diagnosis (e.g., fever, cold, headache...)"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="min-h-[70px] border-gray-300"
            />
          </div>

          {/* Medication */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medication:
            </label>
            
            {/* Medication Table */}
            <div className="border border-gray-300 rounded mb-3">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Medicine Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Dosage</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Frequency</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Duration</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((med) => (
                    <tr key={med.id} className="border-t border-gray-200">
                      <td className="px-3 py-2 text-sm">{med.name}</td>
                      <td className="px-3 py-2 text-sm">{med.dosage}</td>
                      <td className="px-3 py-2 text-sm">{med.frequency}</td>
                      <td className="px-3 py-2 text-sm">{med.duration}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editMedication(med)}
                            className="text-blue-600 hover:text-blue-700 h-6 w-6 p-0"
                            title="Edit medicine"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMedication(med.id)}
                            className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                            title="Remove medicine"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {medications.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-gray-500 text-sm">
                        No medications added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Medicine Search & Add Form */}
            <div className="p-4 bg-gray-50 rounded border">
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  🔍 Search Items from Inventory
                </label>
                <MedicineSearch
                  onSelectMedicine={(item) => {
                    // Only set the item name, doctor customizes the rest
                    setNewMedication({
                      name: item.name,
                      dosage: "",
                      frequency: "",
                      duration: ""
                    });
                  }}
                  placeholder="Type item name (medicines, syringes, devices, etc.)..."
                  doctorId={selectedDoctorId}
                />
              </div>
              
              {/* Medicine Details Form - Doctor Customizes Everything */}
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  {editingMedication ? '✏️ Editing Medicine' : '📝 Enter Medicine Details'}
                </div>
                <div className={`grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded ${
                  editingMedication ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                }`}>
                  <Input
                    placeholder="Medicine name"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Dosage (e.g., 500mg)"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Frequency (e.g., Twice daily)"
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                    className="text-sm"
                  />
                  <div className="flex gap-1">
                    <Input
                      placeholder="Duration (e.g., 5 days)"
                      value={newMedication.duration}
                      onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
                      className="text-sm"
                    />
                    <div className="flex gap-1">
                      <Button 
                        onClick={editingMedication ? updateMedication : addMedication} 
                        size="sm" 
                        className="px-3"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {editingMedication ? 'Update' : 'Add'}
                      </Button>
                      {editingMedication && (
                        <Button 
                          onClick={cancelEdit} 
                          variant="outline" 
                          size="sm" 
                          className="px-2"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  💡 Search to find any item from inventory (medicines, syringes, devices, etc.), then enter your custom dosage, frequency, and duration
                </div>
              </div>
            </div>
          </div>

          {/* Investigations / Lab Tests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investigations / Lab Tests:
            </label>
            <Textarea
              placeholder="Enter lab tests or investigations (e.g., blood test, X-ray...)"
              value={investigations}
              onChange={(e) => setInvestigations(e.target.value)}
              className="min-h-[60px] border-gray-300"
            />
          </div>

          {/* Doctor Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor Notes:
            </label>
            <Textarea
              placeholder="Enter doctor notes (e.g., drink hot water, rest...)"
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              className="min-h-[60px] border-gray-300"
            />
          </div>

          {/* Advice & Follow-Up */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advice & Follow-Up:
            </label>
            <Textarea
              placeholder="Enter advice and follow-up instructions (e.g., come next day...)"
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="min-h-[60px] border-gray-300"
            />
          </div>
        </div>

        {/* Signature Section */}
        {selectedDoctorId && (
          <div className="flex justify-between items-end mt-6 pt-4 border-t border-gray-300">
            <div>
              <div className="text-sm text-gray-600 mb-1">Doctor Signature:</div>
              {(() => {
                const selectedDoctor = doctors.find(d => d.id.toString() === selectedDoctorId);
                if (selectedDoctor?.digitalSignature && selectedDoctor.digitalSignature.startsWith('data:image')) {
                  return (
                    <div className="space-y-2">
                      <img 
                        src={selectedDoctor.digitalSignature} 
                        alt="Doctor Signature" 
                        className="h-12 border border-gray-200 bg-white rounded"
                      />
                      <div className="text-xs text-green-600">✓ Digital signature</div>
                    </div>
                  );
                } else if (selectedDoctor) {
                  return (
                    <div className="italic text-base font-medium">
                      {selectedDoctor.qualification 
                        ? `${selectedDoctor.name}, ${selectedDoctor.qualification}`
                        : selectedDoctor.name}
                    </div>
                  );
                }
                return (
                  <span className="text-red-500 text-sm not-italic">
                    ⚠️ Please select a doctor above
                  </span>
                );
              })()}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Date:</div>
              <div className="font-medium">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-center mt-6">
          <Button 
            onClick={handleSave}
            className={`px-8 py-2 ${selectedDoctorId ? 'bg-medical-500 hover:bg-medical-600' : 'bg-gray-400 cursor-not-allowed'}`}
            size="lg"
            disabled={!selectedDoctorId || doctors.length === 0}
          >
            {!selectedDoctorId ? '⚠️ Select Doctor First' : 'Save Prescription'}
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default PrescriptionForm;