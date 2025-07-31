
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CreditCard, Phone, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ABHAModalProps {
  trigger: React.ReactNode;
  patientId?: number;
  existingABHA?: string;
}

const ABHAModal = ({ trigger, patientId, existingABHA }: ABHAModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Form states
  const [createForm, setCreateForm] = useState({
    aadhaar: "",
    mobile: "",
    otp: ""
  });
  
  const [linkForm, setLinkForm] = useState({
    abhaId: "",
    otp: ""
  });

  const handleCreateABHA = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "ABHA ID Created Successfully",
        description: "Your ABHA ID: 12-3456-7890-1234",
      });
      setIsLoading(false);
      setIsOpen(false);
    }, 2000);
  };

  const handleLinkABHA = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "ABHA ID Linked Successfully",
        description: "Patient profile updated with ABHA ID",
      });
      setIsLoading(false);
      setIsOpen(false);
    }, 1500);
  };

  const handleSendOTP = (type: "create" | "link") => {
    toast({
      title: "OTP Sent",
      description: "Please check your mobile for the verification code",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            ABHA Integration
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create ABHA</TabsTrigger>
            <TabsTrigger value="link">Link ABHA</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Create New ABHA ID</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aadhaar">Aadhaar Number</Label>
                  <Input
                    id="aadhaar"
                    placeholder="Enter 12-digit Aadhaar number"
                    value={createForm.aadhaar}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, aadhaar: e.target.value }))}
                    maxLength={12}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mobile"
                      placeholder="Enter mobile number"
                      value={createForm.mobile}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, mobile: e.target.value }))}
                      maxLength={10}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => handleSendOTP("create")}
                      disabled={!createForm.mobile || createForm.mobile.length !== 10}
                    >
                      Send OTP
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-otp">OTP</Label>
                  <Input
                    id="create-otp"
                    placeholder="Enter OTP"
                    value={createForm.otp}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, otp: e.target.value }))}
                    maxLength={6}
                  />
                </div>
                
                <Button 
                  onClick={handleCreateABHA} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading || !createForm.otp}
                >
                  {isLoading ? "Creating ABHA ID..." : "Create ABHA ID"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Link Existing ABHA ID</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="abha-id">ABHA ID</Label>
                  <Input
                    id="abha-id"
                    placeholder="Enter 14-digit ABHA ID"
                    value={linkForm.abhaId}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, abhaId: e.target.value }))}
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => handleSendOTP("link")}
                  disabled={!linkForm.abhaId}
                  className="w-full"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Send Verification OTP
                </Button>
                
                <div className="space-y-2">
                  <Label htmlFor="link-otp">OTP</Label>
                  <Input
                    id="link-otp"
                    placeholder="Enter OTP"
                    value={linkForm.otp}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, otp: e.target.value }))}
                    maxLength={6}
                  />
                </div>
                
                <Button 
                  onClick={handleLinkABHA} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading || !linkForm.otp}
                >
                  {isLoading ? "Linking ABHA ID..." : "Link ABHA ID"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="text-xs text-gray-500 text-center">
          ABHA ID is issued by National Health Authority, Government of India
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ABHAModal;
