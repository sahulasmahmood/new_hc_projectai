import React, { useState, useEffect } from "react";
import { Trash2, Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import api from "@/lib/api";

const permissions = [
  "Dashboard",
  "Patients",
  "Appointments",
  "Staff",
  "Billing",
  "Inventory",
  "Reports",
  "Emergency",
  "User Management",
  "Settings"
];

const actions = ["View", "Create", "Edit", "Delete"];

interface Permission {
  page: string;
  url: string;
  actions: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
}

interface Role {
  id: number;
  role: string;
  permissions: Permission[];
}

interface StaffMember {
  id: number;
  name: string;
  employeeId: string;
  status: string;
}

export default function RolesResponsibility() {
  const { toast } = useToast();
  const [role, setRole] = useState("");
  const [permissionsState, setPermissionsState] = useState<Record<string, Record<string, boolean>>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [staffByRole, setStaffByRole] = useState<Record<string, StaffMember[]>>({});
  const [expandedRole, setExpandedRole] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    roleId: number | null;
    roleName: string;
    warningMessage?: string;
  }>({
    roleId: null,
    roleName: "",
    warningMessage: undefined
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/staff/roles-permissions');
      if (response.data.success) {
        setRoles(response.data.roles);
        // Fetch staff for each role
        fetchStaffByRole(response.data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive"
      });
    }
  };

  const fetchStaffByRole = async (rolesList: Role[]) => {
    try {
      const staffResponse = await api.get('/staff');
      const allStaff = staffResponse.data;
      
      // Group staff by role
      const grouped: Record<string, StaffMember[]> = {};
      rolesList.forEach(role => {
        grouped[role.role] = allStaff
          .filter((staff: any) => staff.role === role.role)
          .map((staff: any) => ({
            id: staff.id,
            name: staff.name,
            employeeId: staff.employeeId,
            status: staff.status
          }));
      });
      
      setStaffByRole(grouped);
    } catch (error) {
      console.error('Error fetching staff by role:', error);
    }
  };

  const handlePermissionChange = (description: string, action: string) => {
    setPermissionsState((prev) => {
      const currentState = { ...prev };

      // If selecting any action other than View, ensure View is also selected
      if (action !== "View") {
        const newActionState = !(currentState[description]?.[action] || false);
        return {
          ...currentState,
          [description]: {
            ...currentState[description],
            [action]: newActionState,
            // Force View to be true if any other permission is being enabled
            View: newActionState
              ? true
              : // If disabling an action, keep View true if any other action is still enabled
                currentState[description]?.Create ||
                currentState[description]?.Edit ||
                currentState[description]?.Delete ||
                currentState[description]?.View,
          },
        };
      }

      // If unchecking View, uncheck all other permissions as well
      if (action === "View" && !!currentState[description]?.View) {
        return {
          ...currentState,
          [description]: {
            View: false,
            Create: false,
            Edit: false,
            Delete: false,
          },
        };
      }

      // Normal View toggle if enabling View
      return {
        ...currentState,
        [description]: {
          ...currentState[description],
          [action]: !(currentState[description]?.[action] || false),
        },
      };
    });
  };

  const handleSubmit = async () => {
    if (!role.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive"
      });
      return;
    }

    const roleData = {
      role,
      permissions: Object.entries(permissionsState).map(([page, actions]) => ({
        page,
        url: `/dashboard/${page.toLowerCase()}`,
        actions: {
          view: actions.View || false,
          add: actions.Create || false,
          edit: actions.Edit || false,
          delete: actions.Delete || false,
        },
      })),
    };

    try {
      setLoading(true);
      if (isEditing && editId) {
        await api.put('/staff/roles-permissions', {
          ...roleData,
          id: parseInt(editId),
        });
        toast({
          title: "Success",
          description: "Role updated successfully"
        });
      } else {
        await api.post('/staff/roles-permissions', roleData);
        toast({
          title: "Success",
          description: "Role added successfully"
        });
      }
      fetchRoles();
      resetForm();
    } catch (error) {
      console.error('Error submitting role:', error);
      toast({
        title: "Error",
        description: isEditing ? "Failed to update role" : "Failed to add role",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setRole(role.role);
    const editPermissions = role.permissions.reduce((acc, permission) => {
      acc[permission.page] = {
        View: permission.actions.view || false,
        Create: permission.actions.add || false,
        Edit: permission.actions.edit || false,
        Delete: permission.actions.delete || false,
      };
      return acc;
    }, {} as Record<string, Record<string, boolean>>);
    setPermissionsState(editPermissions);
    setIsEditing(true);
    setEditId(role.id.toString());
  };

  const handleDeleteClick = (roleId: number, roleName: string) => {
    setDeleteModal({
      roleId,
      roleName,
      warningMessage: undefined
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.roleId) return;

    try {
      await api.delete('/staff/roles-permissions', {
        data: { id: deleteModal.roleId }
      });
      toast({
        title: "Success",
        description: "Role deleted successfully"
      });
      fetchRoles();
      setDeleteModal({ roleId: null, roleName: "", warningMessage: undefined });
    } catch (error: any) {
      console.error('Error deleting role:', error);
      
      // Check if it's a role-in-use error
      if (error.response?.data?.staffMembers) {
        const staffCount = error.response.data.staffMembers.length;
        const staffNames = error.response.data.staffMembers.map((s: any) => s.name).join(", ");
        toast({
          title: "Cannot Delete Role",
          description: `This role is currently assigned to ${staffCount} staff member(s): ${staffNames}. Please reassign these staff members to a different role before deleting.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to delete role",
          variant: "destructive"
        });
      }
      setDeleteModal({ roleId: null, roleName: "", warningMessage: undefined });
    }
  };

  const resetForm = () => {
    setRole("");
    setPermissionsState({});
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Edit className="h-5 w-5 mr-2" />
          Roles & Responsibilities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Input */}
        <div>
          <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-700">
            Role
          </label>
          <Input
            id="role"
            placeholder="Enter role name (e.g., Doctor, Nurse, Admin)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Permissions Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Permissions
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newState = { ...permissionsState };
                  permissions.forEach(permission => {
                    newState[permission] = {
                      View: true,
                      Create: true,
                      Edit: true,
                      Delete: true
                    };
                  });
                  setPermissionsState(newState);
                }}
                className="text-xs"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newState = { ...permissionsState };
                  permissions.forEach(permission => {
                    newState[permission] = {
                      View: false,
                      Create: false,
                      Edit: false,
                      Delete: false
                    };
                  });
                  setPermissionsState(newState);
                }}
                className="text-xs"
              >
                Clear All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newState = { ...permissionsState };
                  permissions.forEach(permission => {
                    newState[permission] = {
                      View: true,
                      Create: false,
                      Edit: false,
                      Delete: false
                    };
                  });
                  setPermissionsState(newState);
                }}
                className="text-xs"
              >
                View Only
              </Button>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden border">
            <table className="w-full">
              <thead>
                <tr className="bg-medical-500">
                  <th className="p-3 text-left text-sm font-semibold text-white">
                    Module/Page
                  </th>
                  {actions.map((action) => (
                    <th
                      key={action}
                      className="p-3 text-center text-sm font-semibold text-white"
                    >
                      {action}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((description) => (
                  <tr key={description} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-700 font-medium">{description}</td>
                    {actions.map((action) => (
                      <td
                        key={`${description}-${action}`}
                        className="p-3 text-center cursor-pointer"
                        onClick={() =>
                          handlePermissionChange(description, action)
                        }
                      >
                        {permissionsState[description]?.[action] ? (
                          <Check className="w-6 h-6 text-green-500 mx-auto" />
                        ) : (
                          <div className="w-6 h-6 mx-auto border-2 border-gray-300 rounded hover:border-medical-400 transition-colors" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            className="w-48 text-white bg-medical-500 hover:bg-medical-600"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : isEditing ? "Update Role" : "Save Role"}
          </Button>
        </div>

        {/* Roles List */}
        <div>
          <h2 className="text-lg font-bold mb-4 text-gray-900">
            Roles List
          </h2>
          <div className="rounded-lg overflow-hidden border">
            <table className="w-full">
              <thead>
                <tr className="bg-medical-500">
                  <th className="p-3 text-left text-sm font-semibold text-white">No</th>
                  <th className="p-3 text-left text-sm font-semibold text-white">
                    Role
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-white">
                    Permissions
                  </th>
                  <th className="p-3 text-right text-sm font-semibold text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role, index) => (
                  <React.Fragment key={role.id}>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-700">{index + 1}</td>
                      <td className="p-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{role.role}</span>
                          {staffByRole[role.role] && staffByRole[role.role].length > 0 && (
                            <button
                              onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                              className="text-xs bg-medical-100 text-medical-700 px-2 py-1 rounded-full hover:bg-medical-200"
                            >
                              {staffByRole[role.role].length} staff
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        <div className="max-w-md">
                          {Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                            role.permissions.map((permission) => (
                              <div key={permission.page} className="mb-1 text-sm">
                                <span className="font-medium">{permission.page}:</span>{" "}
                                <span className="text-medical-600">
                                  {permission.actions && typeof permission.actions === 'object' 
                                    ? Object.entries(permission.actions)
                                        .filter(([, value]) => value)
                                        .map(([key]) => key)
                                        .join(", ")
                                    : 'No permissions'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-500 text-xs">No permissions configured</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(role)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4 text-medical-600" />
                          </Button>
                          <DeleteConfirmModal
                            title="Delete Role"
                            itemName={role.role}
                            description={`This action cannot be undone. This will permanently delete the role "${role.role}".`}
                            onConfirm={() => handleDeleteConfirm()}
                            trigger={
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClick(role.id, role.role)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                    {expandedRole === role.id && staffByRole[role.role] && staffByRole[role.role].length > 0 && (
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="p-3">
                          <div className="ml-8">
                            <div className="text-xs font-semibold text-gray-600 mb-2">Staff Members with {role.role} Role:</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {staffByRole[role.role].map((staff) => (
                                <div key={staff.id} className="flex items-center gap-2 text-xs bg-white p-2 rounded border">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{staff.name}</div>
                                    <div className="text-gray-500">{staff.employeeId}</div>
                                  </div>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    staff.status === 'On Duty' || staff.status === 'Active' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {staff.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}