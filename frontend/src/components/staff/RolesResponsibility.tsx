import React, { useState, useEffect } from "react";
import { Trash2, Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
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

export default function RolesResponsibility() {
  const { toast } = useToast();
  const [role, setRole] = useState("");
  const [permissionsState, setPermissionsState] = useState<Record<string, Record<string, boolean>>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/staff/roles-permissions');
      if (response.data.success) {
        setRoles(response.data.roles);
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

  const handleDelete = async (roleId: number) => {
    try {
      await api.delete('/staff/roles-permissions', {
        data: { id: roleId }
      });
      toast({
        title: "Success",
        description: "Role deleted successfully"
      });
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive"
      });
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
          <h2 className="text-lg font-bold mb-4 text-gray-900">
            Permissions
          </h2>
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
                  <tr key={role.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-700">{index + 1}</td>
                    <td className="p-3 text-sm text-gray-700 font-medium">{role.role}</td>
                    <td className="p-3 text-sm text-gray-700">
                      <div className="max-w-md">
                        {role.permissions.map((permission) => (
                          <div key={permission.page} className="mb-1 text-sm">
                            <span className="font-medium">{permission.page}:</span>{" "}
                            <span className="text-medical-600">
                              {Object.entries(permission.actions)
                                .filter(([, value]) => value)
                                .map(([key]) => key)
                                .join(", ")}
                            </span>
                          </div>
                        ))}
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(role.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}