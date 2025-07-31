import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mail, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const emailProviders = [
  { label: "Gmail", value: "gmail", host: "smtp.gmail.com", port: "587" },
  {
    label: "Outlook/Office365",
    value: "outlook",
    host: "smtp.office365.com",
    port: "587",
  },
  {
    label: "Yahoo Mail",
    value: "yahoo",
    host: "smtp.mail.yahoo.com",
    port: "587",
  },
  { label: "Custom SMTP", value: "custom", host: "", port: "" },
];

interface EmailProviderInstructionsProps {
  selectedProvider: string;
}

const EmailProviderInstructions: React.FC<EmailProviderInstructionsProps> = ({ selectedProvider }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const instructions = {
    gmail: {
      title: "Gmail Setup Guide",
      steps: [
        {
          title: "1. Enable 2-Step Verification",
          detail:
            "Go to Google Account Security settings and enable 2-Step Verification",
        },
        {
          title: "2. Generate App Password",
          detail:
            "In Google Account → Security → App Passwords, generate a new 16-character password",
        },
        {
          title: "3. Configuration Details",
          detail:
            "Use smtp.gmail.com as host, 587 as port, your Gmail address as username, and the App Password as password",
        },
      ],
    },
    outlook: {
      title: "Outlook/Office365 Setup Guide",
      steps: [
        {
          title: "1. Enable 2-Step Verification",
          detail:
            "Access Microsoft Account Security settings to enable 2-Step Verification",
        },
        {
          title: "2. Create App Password",
          detail:
            "Generate an App Password from Microsoft Account Security settings",
        },
        {
          title: "3. Configuration Details",
          detail:
            "Use smtp.office365.com as host, 587 as port, complete email address as username",
        },
      ],
    },
    yahoo: {
      title: "Yahoo Mail Setup Guide",
      steps: [
        {
          title: "1. Security Setup",
          detail: "Enable 2-Step Verification in Yahoo Account Security",
        },
        {
          title: "2. Generate Password",
          detail: "Create an App Password from Yahoo Account Security settings",
        },
        {
          title: "3. Configuration Details",
          detail:
            "Use smtp.mail.yahoo.com as host, 587 as port, full Yahoo email as username",
        },
      ],
    },
  };

  if (!selectedProvider || selectedProvider === "custom") return null;
  const guide = instructions[selectedProvider as keyof typeof instructions];

  return (
    <div className="mt-4 mb-6 transition-all duration-300 ease-in-out">
      <div className="max-w-full lg:w-2/3 mx-auto bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm">
        <div
          className="bg-blue-200 p-4 rounded-t-lg flex justify-between items-center cursor-pointer hover:bg-blue-300 transition-colors duration-200"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <h3 className="text-blue-900 font-medium text-lg">{guide.title}</h3>
          </div>
          <span className="text-blue-600 text-sm">
            {isExpanded ? "Hide Details" : "Show Details"}
          </span>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-6 space-y-6">
            {guide.steps.map((step, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-4 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-medium">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium text-blue-800 text-base mb-2">
                    {step.title}
                  </h4>
                  <p className="text-blue-600 text-sm leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmailConfiguration: React.FC = () => {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState("custom");
  const [formData, setFormData] = useState({
    smtpPort: "",
    smtpUsername: "",
    smtpPassword: "",
    senderEmail: "",
    smtpHost: "",
  });
  const [testData, setTestData] = useState({
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmailConfig = async () => {
      try {
        setLoading(true);
        const response = await api.get("/settings/email-configuration");
        if (response.data.success && response.data.emailConfig) {
          setFormData(response.data.emailConfig);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load email configuration");
        } else {
          setError("Failed to load email configuration");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmailConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
    const provider = emailProviders.find((p) => p.value === value);
    if (provider && value !== "custom") {
      setFormData((prev) => ({
        ...prev,
        smtpHost: provider.host,
        smtpPort: provider.port,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      const response = await api.post("/settings/email-configuration", formData);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Email configuration saved successfully",
        });
      }
    } catch (err: unknown) {
      let errorMessage = "Failed to save settings";
      type ErrorWithResponse = { response?: { data?: { message?: string } } };
      if (err && typeof err === "object" && "response" in err) {
        const errorObj = err as ErrorWithResponse;
        if (errorObj.response?.data?.message) {
          errorMessage = errorObj.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testData.email || !testData.email.includes("@")) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setTestLoading(true);
      setError(null);
      const response = await api.put("/settings/email-configuration", {
        testEmail: testData.email,
        message: testData.message,
      });
      if (response.data.success) {
        setError(null);
        toast({
          title: "Success",
          description: "Test email sent successfully",
        });
      }
    } catch (err: unknown) {
      let errorMessage = "Failed to send test email";
      type ErrorWithResponseDetails = { response?: { data?: { message?: string; details?: string } } };
      if (err && typeof err === "object" && "response" in err) {
        const errorObj = err as ErrorWithResponseDetails;
        if (errorObj.response?.data?.message) {
          errorMessage = errorObj.response.data.message;
        } else if (errorObj.response?.data?.details) {
          errorMessage = errorObj.response.data.details;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Email Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Label className="w-full md:w-1/2">Email Provider</Label>
              <Select value={selectedProvider} onValueChange={handleProviderChange}>
                <SelectTrigger className="w-full md:w-1/3">
                  <SelectValue placeholder="Select email provider" />
                </SelectTrigger>
                <SelectContent>
                  {emailProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <EmailProviderInstructions selectedProvider={selectedProvider} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={formData.smtpHost}
                  onChange={handleChange}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  value={formData.smtpPort}
                  onChange={handleChange}
                  placeholder="587"
                  type="number"
                />
              </div>
              <div>
                <Label htmlFor="smtpUsername">SMTP Username</Label>
                <Input
                  id="smtpUsername"
                  value={formData.smtpUsername}
                  onChange={handleChange}
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input
                  id="smtpPassword"
                  value={formData.smtpPassword}
                  onChange={handleChange}
                  type="password"
                  placeholder="Enter SMTP Password"
                />
              </div>
              <div>
                <Label htmlFor="senderEmail">Sender Email</Label>
                <Input
                  id="senderEmail"
                  value={formData.senderEmail}
                  onChange={handleChange}
                  placeholder="noreply@example.com"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Send Test Message</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-email">Test Email</Label>
                <Input
                  id="test-email"
                  value={testData.email}
                  onChange={(e) =>
                    setTestData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <Label htmlFor="test-message">Message</Label>
                <Input
                  id="test-message"
                  value={testData.message}
                  onChange={(e) =>
                    setTestData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Write your test message"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleTestEmail}
                disabled={testLoading}
                variant="outline"
              >
                {testLoading ? "Sending..." : "Send Test Email"}
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saveLoading}>
              {saveLoading ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmailConfiguration;