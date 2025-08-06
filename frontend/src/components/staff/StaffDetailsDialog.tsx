
import React from "react";
import { StaffMember } from "@/types/staff";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Award,
  BookOpen,
  DollarSign,
  Pencil,
} from "lucide-react";

interface StaffDetailsDialogProps {
  staff: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (staff: StaffMember) => void;
}

const StaffDetailsDialog = ({ staff, open, onOpenChange, onEdit }: StaffDetailsDialogProps) => {
  if (!staff) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "on duty":
        return "bg-green-100 text-green-800";
      case "off duty":
        return "bg-red-100 text-red-800";
      case "break":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-medical-500" />
            Staff Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-medium">{staff.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Role</div>
                  <div className="font-medium">{staff.role}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Department</div>
                  <div className="font-medium">{staff.department}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <Badge className={getStatusColor(staff.status)}>
                    {staff.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-4">
                {staff.phone && (
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{staff.phone}</span>
                    </div>
                  </div>
                )}
                {staff.email && (
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{staff.email}</span>
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600">Location</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{staff.department}</span>
                  </div>
                </div>
                {staff.shift && (
                  <div>
                    <div className="text-sm text-gray-600">Shift</div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{staff.shift}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
              <div className="space-y-4">
                {staff.qualification && (
                  <div>
                    <div className="text-sm text-gray-600">Qualification</div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{staff.qualification}</span>
                    </div>
                  </div>
                )}
                {staff.experience && (
                  <div>
                    <div className="text-sm text-gray-600">Experience</div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{staff.experience}</span>
                    </div>
                  </div>
                )}
                {staff.consultationFee && (
                  <div>
                    <div className="text-sm text-gray-600">Consultation Fee</div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{staff.consultationFee}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => onEdit(staff)}
            className="bg-medical-500 hover:bg-medical-600"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaffDetailsDialog;
