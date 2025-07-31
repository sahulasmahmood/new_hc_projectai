
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Heart, Mail, Lock } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email && password) {
      toast({
        title: "Login successful",
        description: "Welcome to HealthCare AI!",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 to-medical-100 p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white/80 backdrop-blur-lg border border-gray-100 rounded-xl shadow-lg animate-fadeIn">
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-medical-500" />
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">HealthCare AI</h2>
          </div>
          <p className="text-gray-500">Sign in to your account</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-medical-500 hover:bg-medical-600 text-white">
            Sign In
          </Button>
        </form>
        <div className="text-center">
          <button
            onClick={() => navigate("/signup")}
            className="text-medical-600 hover:text-medical-700 text-sm transition-colors"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </Card>
    </div>
  );
}
