import { useEffect } from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  Users,
  Key,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppointmentSettings from "@/components/settings/AppointmentSettings";
import { useHospitalSettings } from "@/hooks/settings_hook/use-hospital-settings"
import EmailConfiguration from "@/components/settings/EmailConfiguration";
import CategoryManagement from "@/components/settings/CategoryManagement";
import SupplierManagement from "@/components/settings/SupplierManagement";

const defaultHospitalSettings = {
  name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  license: "",
  director: "",
  capacity: 0,
  founded: "",
};

const Settings = () => {
  const { toast } = useToast();
  const { settings: hospitalSettingsRaw, setSettings: setHospitalSettings, loadSettings, saveSettings, loading } = useHospitalSettings();
  const hospitalSettings = hospitalSettingsRaw || defaultHospitalSettings;

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    labResultsReady: true,
    criticalAlerts: true,
    systemUpdates: false,
    maintenanceAlerts: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordPolicy: "strong",
    sessionTimeout: "30",
    twoFactorAuth: false,
    loginAttempts: "5",
    dataRetention: "7",
    backupFrequency: "daily"
  });

  const [systemSettings, setSystemSettings] = useState({
    timezone: "Asia/Kolkata",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    currency: "INR",
    theme: "light"
  });

  const handleSaveSettings = (section: string) => {
    // Simulate saving with delay
    setTimeout(() => {
      toast({
        title: "Settings Saved",
        description: `${section} settings have been updated successfully.`,
      });
    }, 500);
  };

  const handleFormSubmit = async (e: React.FormEvent, section: string) => {
    e.preventDefault();
    if (section === "Hospital") {
      await saveSettings(hospitalSettings!);
      toast({
        title: "Settings Saved",
        description: "Hospital settings have been updated successfully.",
      });
    } else {
      handleSaveSettings(section);
    }
  };

  // Prevent rendering until hospitalSettings is loaded
  if (loading || !hospitalSettings) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500 mx-auto"></div>
        <span className="ml-4 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
        <p className="text-gray-600">Configure hospital and system preferences</p>
      </div>

      <Tabs defaultValue="hospital" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="hospital">Hospital</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="hospital" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Hospital Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hospitalName">Hospital Name</Label>
                  <Input
                    id="hospitalName"
                    value={hospitalSettings.name}
                    onChange={(e) => setHospitalSettings({...hospitalSettings, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    value={hospitalSettings.license}
                    onChange={(e) => setHospitalSettings({...hospitalSettings, license: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={hospitalSettings.phone}
                    onChange={(e) => setHospitalSettings({...hospitalSettings, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={hospitalSettings.email}
                    onChange={(e) => setHospitalSettings({...hospitalSettings, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={hospitalSettings.website}
                    onChange={(e) => setHospitalSettings({...hospitalSettings, website: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Bed Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={hospitalSettings.capacity}
                    onChange={(e) => setHospitalSettings({...hospitalSettings, capacity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={hospitalSettings.address}
                  onChange={(e) => setHospitalSettings({...hospitalSettings, address: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>
              <form onSubmit={(e) => handleFormSubmit(e, "Hospital")}>
                <Button className="w-full">
                  Save Hospital Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, emailNotifications: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, smsNotifications: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Appointment Reminders</Label>
                    <p className="text-sm text-gray-500">Send reminders to patients</p>
                  </div>
                  <Switch
                    checked={notificationSettings.appointmentReminders}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, appointmentReminders: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lab Results Ready</Label>
                    <p className="text-sm text-gray-500">Notify when lab results are available</p>
                  </div>
                  <Switch
                    checked={notificationSettings.labResultsReady}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, labResultsReady: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Critical Alerts</Label>
                    <p className="text-sm text-gray-500">Emergency and critical patient alerts</p>
                  </div>
                  <Switch
                    checked={notificationSettings.criticalAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, criticalAlerts: checked})
                    }
                  />
                </div>
              </div>
              <form onSubmit={(e) => handleFormSubmit(e, "Notification")}>
                <Button className="w-full">
                  Save Notification Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passwordPolicy">Password Policy</Label>
                  <Select value={securitySettings.passwordPolicy} onValueChange={(value) => 
                    setSecuritySettings({...securitySettings, passwordPolicy: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (6+ characters)</SelectItem>
                      <SelectItem value="strong">Strong (8+ with special chars)</SelectItem>
                      <SelectItem value="very-strong">Very Strong (12+ complex)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Select value={securitySettings.sessionTimeout} onValueChange={(value) => 
                    setSecuritySettings({...securitySettings, sessionTimeout: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                  <Select value={securitySettings.loginAttempts} onValueChange={(value) => 
                    setSecuritySettings({...securitySettings, loginAttempts: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                      <SelectItem value="10">10 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dataRetention">Data Retention (years)</Label>
                  <Select value={securitySettings.dataRetention} onValueChange={(value) => 
                    setSecuritySettings({...securitySettings, dataRetention: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 years</SelectItem>
                      <SelectItem value="7">7 years</SelectItem>
                      <SelectItem value="10">10 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Require 2FA for all users</p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) => 
                    setSecuritySettings({...securitySettings, twoFactorAuth: checked})
                  }
                />
              </div>
              <form onSubmit={(e) => handleFormSubmit(e, "Security")}>
                <Button className="w-full">
                  Save Security Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={systemSettings.timezone} onValueChange={(value) => 
                    setSystemSettings({...systemSettings, timezone: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={systemSettings.language} onValueChange={(value) => 
                    setSystemSettings({...systemSettings, language: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="mr">Marathi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={systemSettings.dateFormat} onValueChange={(value) => 
                    setSystemSettings({...systemSettings, dateFormat: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={systemSettings.currency} onValueChange={(value) => 
                    setSystemSettings({...systemSettings, currency: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <form onSubmit={(e) => handleFormSubmit(e, "System")}>
                <Button className="w-full">
                  Save System Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentSettings />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="space-y-8">
            <CategoryManagement />
            <SupplierManagement />
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Third-Party Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">ABHA Integration</h3>
                      <p className="text-sm text-gray-500">Ayushman Bharat Health Account integration</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Lab Equipment API</h3>
                      <p className="text-sm text-gray-500">Connect with lab equipment for automatic results</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Payment Gateway</h3>
                      <p className="text-sm text-gray-500">Razorpay integration for online payments</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">SMS Gateway</h3>
                      <p className="text-sm text-gray-500">SMS notifications and reminders</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              <form onSubmit={(e) => handleFormSubmit(e, "Integration")}>
                <Button className="w-full">
                  Save Integration Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <EmailConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

