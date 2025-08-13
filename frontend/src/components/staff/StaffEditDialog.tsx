import React, { useEffect, useState, useCallback, useRef } from "react";
import { StaffMember } from "@/types/staff";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import SignaturePad from "@/components/ui/signature-pad";
import api from "@/lib/api";

interface StaffEditDialogProps {
  staff: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

interface Department {
  id: number;
  name: string;
}

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

interface Role {
  id: number;
  role: string;
}

interface StaffSettings {
  departments: Department[];
  shifts: Shift[];
  roles: Role[];
}

// Initial form data - moved outside component to avoid dependency issues
const initialFormData = {
  name: "",
  role: "",
  departmentId: undefined,
  shiftId: undefined,
  gender: "",
  dateOfBirth: "",
  dateOfHiring: "",
  qualification: "",
  experience: "",
  phone: "",
  email: "",
  status: "",
  shift: "",
  weekOff: "",
  consultationFee: "",
};

const StaffEditDialog = ({
  staff,
  open,
  onOpenChange,
  onSave,
}: StaffEditDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<StaffSettings>({
    roles: [],
    departments: [],
    shifts: [],
  });

  const [formData, setFormData] =
    useState<Partial<StaffMember>>(initialFormData);
  
  // Refs for focus management
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset form data helper function - memoized to avoid dependency issues
  const resetFormData = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  useEffect(() => {
    if (staff) {
      setFormData(staff);
    } else {
      // Reset form for new staff
      resetFormData();
    }
  }, [staff, resetFormData]);

  // Only reset form when switching between staff members or when explicitly needed
  // Don't reset when dialog just opens/closes to preserve user input

  // Modern focus management - only auto-focus for new staff creation
  useEffect(() => {
    if (open && !staff && firstInputRef.current) {
      // Small delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, staff]);

  // Prevent auto-focus on edit mode by managing dialog focus
  useEffect(() => {
    if (open && staff && dialogRef.current) {
      // Focus the dialog container instead of any input
      const timer = setTimeout(() => {
        dialogRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, staff]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [departmentsRes, shiftsRes, rolesRes] = await Promise.all([
          api.get("/staff/departments"),
          api.get("/staff/shifts"),
          api.get("/staff/roles"),
        ]);

        setSettings({
          departments: departmentsRes.data.departments || [],
          shifts: shiftsRes.data.shifts || [],
          roles: rolesRes.data.roles || [],
        });
      } catch (error) {
        console.error("Error fetching staff settings:", error);
        toast({
          title: "Error",
          description: "Failed to load staff settings",
          variant: "destructive",
        });
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation for required fields
    if (!formData.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Full Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.role) {
      toast({
        title: "Validation Error",
        description: "Role is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.departmentId) {
      toast({
        title: "Validation Error",
        description: "Department is required",
        variant: "destructive",
      });
      return;
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number if provided (basic validation)
    if (
      formData.phone &&
      !/^[\d\s\-+()]{10,}$/.test(formData.phone.replace(/\s/g, ""))
    ) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid phone number (minimum 10 digits)",
        variant: "destructive",
      });
      return;
    }

    // Validate consultation fee if provided (should be numeric)
    if (
      formData.consultationFee &&
      !/^\d+(\.\d{1,2})?$/.test(formData.consultationFee)
    ) {
      toast({
        title: "Validation Error",
        description: "Consultation fee should be a valid number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        departmentId: formData.departmentId,
        shiftId: formData.shiftId || null,
        dateOfBirth: formData.dateOfBirth || null,
        dateOfHiring: formData.dateOfHiring || null,
      };

      if (staff) {
        // Update existing staff member
        await api.put(`/staff/${staff.id}`, submitData);
        toast({
          title: "Success",
          description: "Staff member updated successfully",
        });
      } else {
        // Create new staff member
        await api.post("/staff", submitData);
        toast({
          title: "Success",
          description: "Staff member created successfully",
        });
        // Reset form data after successful creation
        resetFormData();
      }
      onSave();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error saving staff member:", error);
      const axiosError = error as { response?: { data?: { error?: string } } };
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.error || "Failed to save staff member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof StaffMember,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearForm = () => {
    resetFormData();
    toast({
      title: "Form Cleared",
      description: "All form data has been cleared",
    });
    // Focus back to first input after clearing
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
  };

  // Helper function to convert 24h time to 12h format with AM/PM
  const formatTimeTo12Hour = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const syntheticEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent<Element>;
      handleSubmit(syntheticEvent);
    }
    // Escape to close (already handled by Dialog, but good to be explicit)
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={dialogRef}
        className="max-w-3xl max-h-[90vh] overflow-y-auto focus:outline-none"
        tabIndex={-1}
        onOpenAutoFocus={(e) => {
          // Prevent default auto-focus behavior when editing staff
          if (staff) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {staff ? "Edit Staff Member" : "Add New Staff Member"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    ref={firstInputRef}
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter full name"
                    required
                    autoFocus={false}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.roles.map((role) => (
                        <SelectItem key={role.role} value={role.role}>
                          {role.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.departmentId?.toString()}
                    onValueChange={(value) =>
                      handleChange("departmentId", parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || undefined}
                    onValueChange={(value) => handleChange("status", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="On Duty">On Duty</SelectItem>
                      <SelectItem value="Off Duty">Off Duty</SelectItem>
                      <SelectItem value="Break">Break</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender || undefined}
                    onValueChange={(value) => handleChange("gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift">Shift</Label>
                  <Select
                    value={formData.shiftId?.toString() || undefined}
                    onValueChange={(value) =>
                      handleChange(
                        "shiftId",
                        value === "none" ? undefined : parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.shifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id.toString()}>
                          {shift.name} ({formatTimeTo12Hour(shift.startTime)} - {formatTimeTo12Hour(shift.endTime)})
                        </SelectItem>
                      ))}
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal & Work Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Personal & Work Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={
                      formData.dateOfBirth
                        ? formData.dateOfBirth.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleChange("dateOfBirth", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfHiring">Date of Hiring</Label>
                  <Input
                    id="dateOfHiring"
                    type="date"
                    value={
                      formData.dateOfHiring
                        ? formData.dateOfHiring.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleChange("dateOfHiring", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weekOff">Week Off</Label>
                  <Select
                    value={formData.weekOff || undefined}
                    onValueChange={(value) => handleChange("weekOff", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select week off day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="Enter phone number (e.g., +91 9876543210)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e) =>
                      handleChange("qualification", e.target.value)
                    }
                    placeholder="Enter qualification"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => handleChange("experience", e.target.value)}
                    placeholder="Enter experience"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultationFee">Consultation Fee (₹)</Label>
                  <Input
                    id="consultationFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.consultationFee}
                    onChange={(e) =>
                      handleChange("consultationFee", e.target.value)
                    }
                    placeholder="Enter consultation fee in rupees"
                  />
                </div>
              </div>

              {/* Digital Signature Section - Only for Doctors */}
              {(formData.role?.toLowerCase().includes('doctor') || 
                formData.role?.toLowerCase().includes('physician') || 
                formData.role?.toLowerCase().includes('md')) && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Digital Signature for Prescriptions
                  </h4>
                  <div className="space-y-4">
                    <p className="text-xs text-gray-600">
                      Draw your signature below. This will appear on all prescriptions you create.
                      For security and legal compliance, ensure your signature is clear and professional.
                    </p>
                    
                    <div className="flex justify-center">
                      <SignaturePad
                        value={formData.digitalSignature}
                        onChange={(signature) => handleChange("digitalSignature", signature)}
                        width={350}
                        height={150}
                      />
                    </div>
                    
                    {formData.digitalSignature && (
                      <div className="text-center">
                        <div className="text-xs text-green-600 mb-2">
                          ✓ Digital signature saved
                        </div>
                        <div className="text-xs text-gray-500">
                          This signature will be used on all prescriptions
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <div>
              {!staff && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearForm}
                  disabled={loading}
                >
                  Clear Form
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={loading}
              >
                {loading ? "Saving..." : staff ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StaffEditDialog;
