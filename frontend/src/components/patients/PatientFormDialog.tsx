import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Upload, FileText, X, File, Image, FileImage, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useRef } from "react";

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  condition: string;
  allergies: string[];
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  abhaId?: string;
  abhaVerified?: boolean;
  status: string;
  medicalReportCount?: number; // Use count from backend
  emergencyContacts?: EmergencyContact[]; // Add emergency contacts
}

interface EmergencyContact {
  id?: number;
  name: string;
  relationship: string;
  phone: string;
  isPrimary?: boolean;
}

interface PatientFormData {
  name: string;
  age: string;
  gender: string;
  phone: string;
  phoneRelationship: string;
  email: string;
  condition: string;
  allergies: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  emergencyContacts: EmergencyContact[];
}

interface PatientFormDialogProps {
  trigger?: React.ReactNode;
  patient?: Patient;
  onSuccess?: () => void;
}

const PatientFormDialog = ({ trigger, patient, onSuccess }: PatientFormDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  
  // Initialize form data - will be populated when dialog opens
  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    age: "",
    gender: "",
    phone: "",
    phoneRelationship: "",
    email: "",
    condition: "",
    allergies: "",
    emergencyContact: "",
    emergencyPhone: "",
    address: "",
    emergencyContacts: []
  });

  const [phoneExists, setPhoneExists] = useState(false);
  const [existingPatients, setExistingPatients] = useState<any[]>([]);

  const [newEmergencyContact, setNewEmergencyContact] = useState<EmergencyContact>({ 
    name: "", 
    relationship: "", 
    phone: "" 
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [medicalReport, setMedicalReport] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pendingReports, setPendingReports] = useState<{ file: File; note: string }[]>([]);
  const [currentReportFile, setCurrentReportFile] = useState<File | null>(null);
  const [currentReportNote, setCurrentReportNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddReport = () => {
    if (currentReportFile) {
      setPendingReports(prev => [...prev, { file: currentReportFile, note: currentReportNote }]);
      setCurrentReportFile(null);
      setCurrentReportNote("");
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePendingReport = (idx: number) => {
    setPendingReports(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, image, or Word document.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    } else {
      setFilePreview(null);
    }
    setCurrentReportFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileNameFromPath = (path: string) => {
    return path.split('/').pop() || path.split('\\').pop() || 'Unknown file';
  };

  const getFileTypeFromPath = (path: string) => {
    const extension = path.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(extension || '')) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else {
      return 'document';
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Check if user has a file selected but not added to pending reports
    if (currentReportFile && pendingReports.length === 0) {
      toast({
        title: "File Not Added",
        description: "You have a file selected but not added. Click 'Add Report' to include it, or remove the file to continue.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user has a file selected along with pending reports
    if (currentReportFile && pendingReports.length > 0) {
      toast({
        title: "File Not Added",
        description: "You have an additional file selected. Click 'Add Report' to include it, or remove the file to continue.",
        variant: "destructive",
      });
      return;
    }

    // Auto-add emergency contact if filled but not added
    let finalEmergencyContacts = [...formData.emergencyContacts];
    if (newEmergencyContact.name.trim() && newEmergencyContact.phone.trim() && /^\d+$/.test(newEmergencyContact.phone.trim())) {
      finalEmergencyContacts.push({
        ...newEmergencyContact,
        phone: newEmergencyContact.phone.trim(),
        isPrimary: finalEmergencyContacts.length === 0
      });
      toast({
        title: "Emergency Contact Added",
        description: "Your filled emergency contact has been automatically added.",
      });
    }
    
    setIsLoading(true);

    try {
      // Prepare data for API - filter out empty values for FormData
      const apiData: Record<string, any> = {};
      
      // Only add non-empty values
      if (formData.name) apiData.name = formData.name;
      if (formData.age) apiData.age = parseInt(formData.age);
      if (formData.gender) apiData.gender = formData.gender;
      if (formData.phone) apiData.phone = formData.phone;
      if (formData.phoneRelationship) apiData.phoneRelationship = formData.phoneRelationship;
      if (formData.email) apiData.email = formData.email;
      if (formData.condition) apiData.condition = formData.condition;
      if (formData.address) apiData.address = formData.address;
      if (formData.emergencyContact) apiData.emergencyContact = formData.emergencyContact;
      if (formData.emergencyPhone) apiData.emergencyPhone = formData.emergencyPhone;
      
      // Handle allergies
      if (formData.allergies) {
        apiData.allergies = typeof formData.allergies === 'string' 
          ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean)
          : formData.allergies;
      }
      
      // Include emergency contacts
      apiData.emergencyContacts = finalEmergencyContacts;

      let response;
      if (patient) {
        // Update existing patient with optional multiple file uploads
        const form = new FormData();
        Object.entries(apiData).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') return; // Skip empty values
          if (key === 'emergencyContacts') {
            // Send emergency contacts as JSON string
            form.append(key, JSON.stringify(value));
          } else if (Array.isArray(value)) {
            if (value.length > 0) {
              value.forEach((v, i) => form.append(`${key}[${i}]`, v));
            }
          } else {
            form.append(key, String(value));
          }
        });
        pendingReports.forEach((report, idx) => {
          form.append('medicalReports', report.file);
          form.append('medicalReportNotes', report.note);
        });
        response = await api.put(`/patients/${patient.id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const fileMessage = pendingReports.length > 0 
          ? ` ${pendingReports.length} medical report(s) uploaded.`
          : '';
        toast({
          title: "Patient Updated",
          description: `${formData.name} has been updated successfully.${fileMessage}`,
        });
      } else {
        // Create new patient with multiple file uploads
        const form = new FormData();
        Object.entries(apiData).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') return; // Skip empty values
          if (key === 'emergencyContacts') {
            // Send emergency contacts as JSON string
            form.append(key, JSON.stringify(value));
          } else if (Array.isArray(value)) {
            if (value.length > 0) {
              value.forEach((v, i) => form.append(`${key}[${i}]`, v));
            }
          } else {
            form.append(key, String(value));
          }
        });
        pendingReports.forEach((report, idx) => {
          form.append('medicalReports', report.file);
          form.append('medicalReportNotes', report.note);
        });
        response = await api.post('/patients', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const fileMessage = pendingReports.length > 0 
          ? ` ${pendingReports.length} medical report(s) uploaded.`
          : '';
        toast({
          title: "Patient Added",
          description: `${formData.name} has been added successfully.${fileMessage}`,
        });
      }
      setIsLoading(false);
      setIsOpen(false);
      // Reset form after successful submission
      if (!patient) {
        resetForm();
      }
      onSuccess?.(); // Trigger refresh of patients list
    } catch (error: Error | unknown) {
      console.error('Error saving patient:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to save patient";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const checkPhoneExists = async (phone: string) => {
    if (phone.length === 10 && /^\d{10}$/.test(phone)) {
      try {
        const response = await api.get(`/patients/search/by-phone?phone=${phone}`);
        if (response.data && response.data.length > 0) {
          // Filter out current patient if editing
          const others = patient ? response.data.filter((p: any) => p.id !== patient.id) : response.data;
          if (others.length > 0) {
            setPhoneExists(true);
            setExistingPatients(others);
          } else {
            setPhoneExists(false);
            setExistingPatients([]);
          }
        } else {
          setPhoneExists(false);
          setExistingPatients([]);
        }
      } catch (error) {
        // Phone doesn't exist
        setPhoneExists(false);
        setExistingPatients([]);
      }
    } else {
      setPhoneExists(false);
      setExistingPatients([]);
    }
  };

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      validateForm(updated);
      
      // Check phone number for duplicates
      if (field === 'phone') {
        checkPhoneExists(value);
      }
      
      return updated;
    });
  };

  const validateForm = (data = formData) => {
    const errors: {[key: string]: string} = {};
    if (!data.name.trim() || data.name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
    const ageNum = Number(data.age);
    if (!data.age.trim() || isNaN(ageNum) || ageNum <= 0 || ageNum > 150) errors.age = "Age must be between 1 and 150.";
    if (!data.gender) errors.gender = "Gender is required.";
    if (!data.phone.trim() || !/^\d{10}$/.test(data.phone.trim())) errors.phone = "Valid 10-digit phone number is required.";
    if (data.email && (data.email.length < 6 || !/^\S+@\S+\.\S+$/.test(data.email))) errors.email = "Enter a valid email address (min 6 chars).";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      gender: "",
      phone: "",
      phoneRelationship: "",
      email: "",
      condition: "",
      allergies: "",
      emergencyContact: "",
      emergencyPhone: "",
      address: "",
      emergencyContacts: []
    });
    setNewEmergencyContact({ name: "", relationship: "", phone: "" });
    setMedicalReport(null);
    setFilePreview(null);
    setPendingReports([]);
    setCurrentReportFile(null);
    setCurrentReportNote("");
    setFormErrors({});
    setPhoneExists(false);
    setExistingPatients([]);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Populate form data when opening
      if (patient) {
        // Editing existing patient
        setFormData({
          name: patient.name || "",
          age: patient.age?.toString() || "",
          gender: patient.gender || "",
          phone: patient.phone || "",
          phoneRelationship: (patient as any).phoneRelationship || "",
          email: patient.email || "",
          condition: patient.condition || "",
          allergies: patient.allergies?.join(", ") || "",
          emergencyContact: patient.emergencyContact || "",
          emergencyPhone: patient.emergencyPhone || "",
          address: patient.address || "",
          emergencyContacts: patient.emergencyContacts || []
        });
      }
      // If adding new patient, keep existing form data (don't reset)
    }
    // Don't reset on close - only reset on explicit cancel or successful submit
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-medical-500 hover:bg-medical-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-medical-500" />
            {patient ? "Edit Patient" : "Add New Patient"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter full name"
                required
              />
              {formErrors.name && <div className="text-xs text-red-600 mt-1">{formErrors.name}</div>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                placeholder="Enter age"
                required
                min="0"
              />
              {formErrors.age && <div className="text-xs text-red-600 mt-1">{formErrors.age}</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.gender && <div className="text-xs text-red-600 mt-1">{formErrors.gender}</div>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
                required
              />
              {formErrors.phone && <div className="text-xs text-red-600 mt-1">{formErrors.phone}</div>}
            </div>
          </div>

          {/* Phone duplicate warning - outside grid to prevent layout issues */}
          {phoneExists && existingPatients.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  This phone number is already used by:
                </span>
              </div>
              <div className="space-y-1 ml-6">
                {existingPatients.map((p: any) => (
                  <div key={p.id} className="text-xs text-yellow-700">
                    • {p.name} ({p.visibleId}) {p.phoneRelationship && `- ${p.phoneRelationship}`}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="phoneRelationship" className="text-xs text-yellow-800">
                  Specify relationship (e.g., Father, Mother, Guardian)
                </Label>
                <Select 
                  value={formData.phoneRelationship} 
                  onValueChange={(value) => handleInputChange("phoneRelationship", value)}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Son">Son</SelectItem>
                    <SelectItem value="Daughter">Daughter</SelectItem>
                    <SelectItem value="Brother">Brother</SelectItem>
                    <SelectItem value="Sister">Sister</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
            />
            {formErrors.email && <div className="text-xs text-red-600 mt-1">{formErrors.email}</div>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Primary Condition</Label>
            <Input
              id="condition"
              value={formData.condition}
              onChange={(e) => handleInputChange("condition", e.target.value)}
              placeholder="Enter primary condition"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Input
              id="allergies"
              value={formData.allergies}
              onChange={(e) => handleInputChange("allergies", e.target.value)}
              placeholder="Enter allergies (comma separated)"
            />
          </div>

          {/* Emergency Contacts Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Emergency Contacts</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newEmergencyContact.name.trim() && newEmergencyContact.phone.trim() && /^\d+$/.test(newEmergencyContact.phone.trim())) {
                    setFormData(prev => ({
                      ...prev,
                      emergencyContacts: [...prev.emergencyContacts, {
                        ...newEmergencyContact,
                        phone: newEmergencyContact.phone.trim(),
                        isPrimary: prev.emergencyContacts.length === 0
                      }]
                    }));
                    setNewEmergencyContact({ name: "", relationship: "", phone: "" });
                  } else {
                    toast({
                      title: "Invalid Information",
                      description: "Please enter valid name, relationship, and numeric phone number.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!newEmergencyContact.name.trim() || !newEmergencyContact.phone.trim() || !/^\d+$/.test(newEmergencyContact.phone.trim())}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Contact
              </Button>
            </div>

            {/* Add New Emergency Contact Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Contact Name *</Label>
                <Input
                  placeholder="Full name"
                  value={newEmergencyContact.name}
                  onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Relationship</Label>
                <Select 
                  value={newEmergencyContact.relationship} 
                  onValueChange={(value) => setNewEmergencyContact(prev => ({ ...prev, relationship: value }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Son">Son</SelectItem>
                    <SelectItem value="Daughter">Daughter</SelectItem>
                    <SelectItem value="Brother">Brother</SelectItem>
                    <SelectItem value="Sister">Sister</SelectItem>
                    <SelectItem value="Friend">Friend</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Phone Number *</Label>
                <Input
                  placeholder="Numbers only"
                  value={newEmergencyContact.phone}
                  onChange={(e) => {
                    // Only allow numeric input
                    const value = e.target.value.replace(/\D/g, '');
                    setNewEmergencyContact(prev => ({ ...prev, phone: value }));
                  }}
                  className="h-9"
                  maxLength={15}
                />
              </div>
            </div>

            {/* Existing Emergency Contacts */}
            {formData.emergencyContacts.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Current Emergency Contacts</Label>
                <div className="space-y-2">
                  {formData.emergencyContacts.map((contact, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      {contact.isPrimary && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Primary</Badge>
                      )}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">{contact.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {contact.relationship || 'No relationship specified'}
                        </div>
                        <div className="text-sm font-mono text-gray-800">
                          {contact.phone}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
                          }));
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.emergencyContacts.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No emergency contacts added yet. Use the form above to add contacts.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter full address"
              rows={3}
            />
          </div>

         {/* Medical History/Reports Upload (Add Patient only) */}
         <div className="space-y-2">
           <Label htmlFor="medicalReport">Upload Medical Reports (optional, one by one)</Label>
           {patient && typeof patient.medicalReportCount === 'number' && (
             <div className="flex flex-col items-center justify-center mb-2">
               <FileText className="h-8 w-8 text-blue-600 mb-1" />
               <span className="text-blue-900 font-medium text-base">{patient.medicalReportCount} Medical Report{patient.medicalReportCount === 1 ? '' : 's'} already uploaded</span>
               <span className="text-xs text-gray-500">You can add more by uploading below</span>
             </div>
           )}
           <div
             className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 ${isDragOver ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' : 'border-gray-300'}`}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
             {...(!currentReportFile ? { onClick: () => fileInputRef.current?.click() } : {})}
           >
             {!currentReportFile ? (
               <>
                 <Upload className="h-12 w-12 text-gray-400 mb-4 mx-auto" />
                 <p className="text-sm text-gray-600 mb-2">
                   <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop a file
                 </p>
                 <p className="text-xs text-gray-500">
                   PDF, images, Word docs (max 5MB)
                 </p>
               </>
             ) : (
               <div className="flex flex-col items-center">
                 {filePreview && currentReportFile.type.startsWith('image/') ? (
                   <img src={filePreview} alt="Preview" className="h-20 w-20 object-cover rounded border mb-2" />
                 ) : (
                   <FileText className="h-8 w-8 text-blue-500 mb-2" />
                 )}
                 <span className="text-sm font-medium text-gray-900 mb-1">{currentReportFile.name}</span>
                 <span className="text-xs text-gray-500 mb-2">{formatFileSize(currentReportFile.size)}</span>
                 <Input
                   className="mb-2"
                   placeholder="Add a note or type (optional)"
                   value={currentReportNote}
                   onChange={e => setCurrentReportNote(e.target.value)}
                 />
                 <div className="flex gap-2">
                   <Button type="button" size="sm" onClick={handleAddReport}>Add File</Button>
                   <Button type="button" size="sm" variant="outline" onClick={() => { setCurrentReportFile(null); setFilePreview(null); setCurrentReportNote(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Cancel</Button>
                 </div>
               </div>
             )}
           </div>
           <input
             id="medicalReport"
             type="file"
             accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.bmp,.tiff,.gif"
             ref={fileInputRef}
             onChange={e => handleFileSelect(e.target.files?.[0] || null)}
             className="hidden"
           />
           {/* Pending uploads list */}
           {pendingReports.length > 0 && (
             <div className="mt-4">
               <Label>Pending Reports:</Label>
               <ul className="space-y-2 mt-2">
                 {pendingReports.map((report, idx) => (
                   <li key={idx} className="flex items-center bg-gray-50 border rounded p-2">
                     <FileText className="h-5 w-5 text-blue-500 mr-2" />
                     <span className="font-medium text-gray-900 mr-2">{report.file.name}</span>
                     <span className="text-xs text-gray-500 mr-2">{formatFileSize(report.file.size)}</span>
                     {report.note && <span className="text-xs text-blue-600 mr-2">({report.note})</span>}
                     <Button type="button" size="icon" variant="ghost" onClick={() => handleRemovePendingReport(idx)}><X className="h-4 w-4" /></Button>
                   </li>
                 ))}
               </ul>
             </div>
           )}
         </div>

          {/* Warning for unaddded files */}
          {currentReportFile && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">
                  File selected but not added
                </span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Click "Add File" to include this file, or "Cancel" to remove it before saving.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!patient) {
                  resetForm();
                }
                setIsOpen(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || Object.keys(formErrors).length > 0}
              className="bg-medical-500 hover:bg-medical-600"
            >
              {isLoading ? "Saving..." : patient ? "Update Patient" : "Add Patient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PatientFormDialog;
