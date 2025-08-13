import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Upload, FileText, X, File, Image, FileImage, AlertTriangle } from "lucide-react";
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
}

interface PatientFormData {
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  condition: string;
  allergies: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
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
  
  const [formData, setFormData] = useState<PatientFormData>({
    name: patient?.name || "",
    age: patient?.age?.toString() || "",
    gender: patient?.gender || "",
    phone: patient?.phone || "",
    email: patient?.email || "",
    condition: patient?.condition || "",
    allergies: patient?.allergies?.join(", ") || "",
    emergencyContact: patient?.emergencyContact || "",
    emergencyPhone: patient?.emergencyPhone || "",
    address: patient?.address || ""
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
    
    setIsLoading(true);

    try {
      // Prepare data for API
      const apiData = {
        ...formData,
        age: parseInt(formData.age),
        // Only split allergies if it's a string, otherwise keep as is
        allergies: typeof formData.allergies === 'string' 
          ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean)
          : formData.allergies
      };

      let response;
      if (patient) {
        // Update existing patient with optional multiple file uploads
        const form = new FormData();
        Object.entries(apiData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v, i) => form.append(`${key}[${i}]`, v));
          } else {
            form.append(key, value as string);
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
          if (Array.isArray(value)) {
            value.forEach((v, i) => form.append(`${key}[${i}]`, v));
          } else {
            form.append(key, value as string);
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
      setMedicalReport(null);
      setFilePreview(null);
      setPendingReports([]);
      setCurrentReportFile(null);
      setCurrentReportNote("");
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

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      validateForm(updated);
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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setMedicalReport(null);
      setFilePreview(null);
    }
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                placeholder="Emergency contact name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency Phone</Label>
              <Input
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                placeholder="Emergency phone number"
              />
            </div>
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
              onClick={() => setIsOpen(false)}
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
