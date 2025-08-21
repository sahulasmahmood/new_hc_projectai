
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Stethoscope, 
  Users, 
  Calendar, 
  FileText, 
  Activity,
  UserCheck,
  CreditCard,
  Package,
  Building,
  FlaskConical,
  Pill,
  Siren,
  BarChart3,
  LogOut,
  Menu,
  X,
  Settings,
  UserCog
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Stethoscope, label: "Symptoms", path: "/symptoms" },
    { icon: Users, label: "Patients", path: "/patients" },
    { icon: Calendar, label: "Appointments", path: "/appointments" },
    { icon: FileText, label: "Reports", path: "/reports" },
   /*  { icon: Activity, label: "Health Metrics", path: "/metrics" }, */
    { icon: UserCheck, label: "Staff", path: "/staff" },
    { icon: CreditCard, label: "Billing", path: "/billing" },
    { icon: Package, label: "Inventory", path: "/inventory" },
/*     { icon: Building, label: "Ward Management", path: "/ward-management" }, */
  /*   { icon: FlaskConical, label: "Laboratory", path: "/laboratory" }, */
/*     { icon: Pill, label: "Pharmacy", path: "/pharmacy" }, */
    { icon: Siren, label: "Emergency", path: "/emergency" },
/*     { icon: BarChart3, label: "Analytics", path: "/analytics" }, */
    { icon: UserCog, label: "User Management", path: "/user-management" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const handleLogout = () => {
    // Clear any stored user data
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    
    // Navigate to login page
    navigate("/login", { replace: true });
  };

  return (
    <Card className={`${isCollapsed ? 'w-16' : 'w-64'} h-screen bg-white border-r border-gray-200 transition-all duration-300 rounded-none flex flex-col`}>
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-medical-600">HealthCare AI</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          const handleNavClick = (e: React.MouseEvent) => {
            // Check if there's unsaved prescription data
            const hasUnsavedData = localStorage.getItem('prescription_unsaved') === 'true';
            
            if (hasUnsavedData && !isActive) {
              e.preventDefault();
              const confirmed = window.confirm(
                'You have unsaved prescription data. Are you sure you want to leave? Your work will be lost.'
              );
              if (confirmed) {
                localStorage.removeItem('prescription_unsaved');
                navigate(item.path);
              }
            }
          };
          
          return (
            <Link key={item.path} to={item.path} onClick={handleNavClick}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'} ${
                  isActive ? 'bg-medical-500 text-white' : 'hover:bg-medical-50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <Button
          onClick={handleLogout}
          variant="outline"
          className={`w-full ${isCollapsed ? 'px-2' : 'px-4'} border-red-200 text-red-600 hover:bg-red-50`}
        >
          <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </Card>
  );
};

export default Sidebar;
