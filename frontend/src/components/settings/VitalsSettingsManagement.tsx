import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Activity, Save, RotateCcw, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

interface VitalsSetting {
    id: number;
    vitalType: string;
    name: string;
    unit: string;
    minNormal: number | null;
    maxNormal: number | null;
    minCritical: number | null;
    maxCritical: number | null;
    isActive: boolean;
    notes: string | null;
}

const VitalsSettingsManagement = () => {
    const [settings, setSettings] = useState<VitalsSetting[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<number | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get("/vitals-settings");
            setSettings(response.data);
        } catch (error) {
            console.error("Error fetching vitals settings:", error);
            toast({
                title: "Error",
                description: "Failed to load vitals settings",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const validateRanges = (setting: VitalsSetting): string[] => {
        const errors: string[] = [];
        
        // Check if normal range is valid
        if (setting.minNormal !== null && setting.maxNormal !== null) {
            if (setting.minNormal >= setting.maxNormal) {
                errors.push("Normal minimum must be less than normal maximum");
            }
        }
        
        // Check if critical range is valid
        if (setting.minCritical !== null && setting.maxCritical !== null) {
            if (setting.minCritical >= setting.maxCritical) {
                errors.push("Critical minimum must be less than critical maximum");
            }
        }
        
        // Check proper sequence: Critical Low < Normal Min < Normal Max < Critical High
        if (setting.minCritical !== null && setting.minNormal !== null) {
            if (setting.minCritical >= setting.minNormal) {
                errors.push("Critical minimum must be lower than normal minimum");
            }
        }
        
        if (setting.maxNormal !== null && setting.maxCritical !== null) {
            if (setting.maxNormal >= setting.maxCritical) {
                errors.push("Normal maximum must be lower than critical maximum");
            }
        }
        
        // Clinical validation for specific vitals
        if (setting.vitalType === 'temperature') {
            if (setting.minNormal !== null && setting.minNormal < 90) {
                errors.push("Body temperature below 90°F is not clinically viable");
            }
            if (setting.maxNormal !== null && setting.maxNormal > 110) {
                errors.push("Body temperature above 110°F is not clinically viable");
            }
        }
        
        if (setting.vitalType === 'heartRate') {
            if (setting.minNormal !== null && setting.minNormal < 30) {
                errors.push("Heart rate below 30 bpm is not clinically viable");
            }
            if (setting.maxNormal !== null && setting.maxNormal > 200) {
                errors.push("Heart rate above 200 bpm is not clinically viable");
            }
        }
        
        if (setting.vitalType === 'oxygenSaturation') {
            if (setting.minNormal !== null && setting.minNormal < 70) {
                errors.push("Oxygen saturation below 70% is not clinically viable");
            }
            if (setting.maxNormal !== null && setting.maxNormal > 100) {
                errors.push("Oxygen saturation cannot exceed 100%");
            }
        }
        
        return errors;
    };

    const handleUpdate = async (id: number, updatedData: Partial<VitalsSetting>) => {
        try {
            setSaving(id);
            const setting = settings.find(s => s.id === id);
            if (!setting) return;

            const newSetting = { ...setting, ...updatedData };
            const validationErrors = validateRanges(newSetting);
            
            if (validationErrors.length > 0) {
                toast({
                    title: "Validation Error",
                    description: validationErrors.join(". "),
                    variant: "destructive",
                });
                setSaving(null);
                return;
            }

            const response = await api.put(`/vitals-settings/${id}`, newSetting);

            setSettings(settings.map(s => s.id === id ? response.data : s));

            toast({
                title: "Success",
                description: "Vitals setting updated successfully",
            });
        } catch (error: any) {
            console.error("Error updating vitals setting:", error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update vitals setting",
                variant: "destructive",
            });
        } finally {
            setSaving(null);
        }
    };

    const handleResetToDefaults = async () => {
        try {
            setLoading(true);
            const response = await api.post("/vitals-settings/reset");
            setSettings(response.data);

            toast({
                title: "Success",
                description: "Vitals settings reset to defaults",
            });
        } catch (error) {
            console.error("Error resetting vitals settings:", error);
            toast({
                title: "Error",
                description: "Failed to reset vitals settings",
                variant: "destructive",
            });
            throw error; // Re-throw for modal to handle
        } finally {
            setLoading(false);
        }
    };

    const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

    const handleFieldChange = (id: number, field: keyof VitalsSetting, value: any) => {
        const updatedSettings = settings.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        );
        setSettings(updatedSettings);
        
        // Real-time validation
        const updatedSetting = updatedSettings.find(s => s.id === id);
        if (updatedSetting) {
            const errors = validateRanges(updatedSetting);
            setValidationErrors(prev => ({
                ...prev,
                [id]: errors
            }));
        }
    };

    if (loading && settings.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center py-8">
                        <Activity className="h-6 w-6 animate-pulse mr-2" />
                        <span>Loading vitals settings...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-600" />
                                Vitals Normal Ranges Configuration
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Configure normal and critical ranges for vital signs based on healthcare standards.
                                These ranges are used throughout the system for vitals recording and alerts.
                            </CardDescription>
                        </div>
                        <DeleteConfirmModal
                            title="Reset Vitals Settings"
                            itemName="Settings"
                            description="All vitals settings will be reset to healthcare standard default values. Your current custom settings will be overwritten. This action cannot be undone."
                            onConfirm={handleResetToDefaults}
                            icon="warning"
                            confirmText="Reset"
                            confirmVariant="destructive"
                            trigger={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={loading}
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reset to Defaults
                                </Button>
                            }
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {settings.map((setting) => (
                            <Card key={setting.id} className="border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-lg">{setting.name}</CardTitle>
                                            <span className="text-sm text-gray-500">({setting.unit})</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor={`active-${setting.id}`} className="text-sm">Active</Label>
                                                <Switch
                                                    id={`active-${setting.id}`}
                                                    checked={setting.isActive}
                                                    onCheckedChange={(checked) =>
                                                        handleUpdate(setting.id, { isActive: checked })
                                                    }
                                                />
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdate(setting.id, setting)}
                                                disabled={saving === setting.id}
                                            >
                                                <Save className="h-4 w-4 mr-2" />
                                                {saving === setting.id ? "Saving..." : "Save"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Normal Range */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-green-700 font-semibold">
                                                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                                Normal Range
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`min-normal-${setting.id}`}>Minimum</Label>
                                                    <Input
                                                        id={`min-normal-${setting.id}`}
                                                        type="number"
                                                        step="0.1"
                                                        value={setting.minNormal ?? ""}
                                                        onChange={(e) =>
                                                            handleFieldChange(setting.id, "minNormal",
                                                                e.target.value ? parseFloat(e.target.value) : null)
                                                        }
                                                        placeholder="Min normal"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`max-normal-${setting.id}`}>Maximum</Label>
                                                    <Input
                                                        id={`max-normal-${setting.id}`}
                                                        type="number"
                                                        step="0.1"
                                                        value={setting.maxNormal ?? ""}
                                                        onChange={(e) =>
                                                            handleFieldChange(setting.id, "maxNormal",
                                                                e.target.value ? parseFloat(e.target.value) : null)
                                                        }
                                                        placeholder="Max normal"
                                                    />
                                                </div>
                                            </div>
                                            {setting.minNormal !== null && setting.maxNormal !== null && (
                                                <div className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                                                    Normal: {setting.minNormal} - {setting.maxNormal} {setting.unit}
                                                </div>
                                            )}
                                        </div>

                                        {/* Critical Range */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-red-700 font-semibold">
                                                <AlertCircle className="h-4 w-4" />
                                                Critical Range
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`min-critical-${setting.id}`}>Minimum</Label>
                                                    <Input

                                                        id={`min-critical-${setting.id}`}
                                                        type="number"
                                                        step="0.1"
                                                        value={setting.minCritical ?? ""}
                                                        onChange={(e) =>
                                                            handleFieldChange(setting.id, "minCritical",
                                                                e.target.value ? parseFloat(e.target.value) : null)
                                                        }
                                                        placeholder="Min critical"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`max-critical-${setting.id}`}>Maximum</Label>
                                                    <Input
                                                        id={`max-critical-${setting.id}`}
                                                        type="number"
                                                        step="0.1"
                                                        value={setting.maxCritical ?? ""}
                                                        onChange={(e) =>
                                                            handleFieldChange(setting.id, "maxCritical",
                                                                e.target.value ? parseFloat(e.target.value) : null)
                                                        }
                                                        placeholder="Max critical"
                                                    />
                                                </div>
                                            </div>
                                            {setting.minCritical !== null && setting.maxCritical !== null && (
                                                <div className="text-sm text-gray-600 bg-red-50 p-2 rounded">
                                                    Critical: Below {setting.minCritical} or Above {setting.maxCritical} {setting.unit}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="mt-4 space-y-2">
                                        <Label htmlFor={`notes-${setting.id}`}>Clinical Notes & Guidelines</Label>
                                        <Textarea
                                            id={`notes-${setting.id}`}
                                            value={setting.notes ?? ""}
                                            onChange={(e) => handleFieldChange(setting.id, "notes", e.target.value)}
                                            placeholder="Add clinical notes or guidelines for this vital sign..."
                                            rows={2}
                                            className="resize-none"
                                        />
                                    </div>

                                    {/* Validation Errors */}
                                    {validationErrors[setting.id] && validationErrors[setting.id].length > 0 && (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-red-800">Validation Errors:</p>
                                                    <ul className="text-sm text-red-700 space-y-1">
                                                        {validationErrors[setting.id].map((error, index) => (
                                                            <li key={index} className="flex items-start gap-1">
                                                                <span className="text-red-600">•</span>
                                                                <span>{error}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="text-blue-900 text-base">About Vitals Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-800 space-y-2">
                        <p>
                            <strong>Normal Range:</strong> Values within this range are considered healthy and will be displayed with a green indicator.
                        </p>
                        <p>
                            <strong>Critical Range:</strong> Values outside this range require immediate attention and will trigger alerts.
                        </p>
                        <p>
                            <strong>Healthcare Standards:</strong> Default values follow WHO and standard medical guidelines for adult patients.
                            Adjust ranges based on your facility's protocols and patient demographics.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="text-green-900 text-base">✅ Correct Range Logic</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-green-800 space-y-3">
                        <div className="font-medium">Ranges must follow this sequence:</div>
                        <div className="bg-white p-3 rounded border space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                                <div className="w-3 h-3 bg-red-600 rounded"></div>
                                <span className="font-mono">Critical Low</span>
                                <span className="text-gray-500">&lt;</span>
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span className="font-mono">Normal Min</span>
                                <span className="text-gray-500">&lt;</span>
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span className="font-mono">Normal Max</span>
                                <span className="text-gray-500">&lt;</span>
                                <div className="w-3 h-3 bg-red-600 rounded"></div>
                                <span className="font-mono">Critical High</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-2">
                                Example for Temperature: 94°F &lt; 97°F &lt; 99°F &lt; 106°F
                            </div>
                        </div>
                        <p className="text-xs">
                            <strong>Why:</strong> This ensures no overlapping ranges and proper clinical interpretation.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default VitalsSettingsManagement;
