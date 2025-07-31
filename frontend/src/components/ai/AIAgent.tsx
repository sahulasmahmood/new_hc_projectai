
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, X, Minimize2, Maximize2, Stethoscope, Brain, FileText } from "lucide-react";

interface AIAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  category?: "diagnosis" | "treatment" | "general" | "emergency";
}

const AIAgent = ({ isOpen, onClose, onMinimize, isMinimized }: AIAgentProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: "Hello! I'm your medical AI assistant. I can help with diagnostic suggestions, treatment recommendations, and clinical decision support. How can I assist you today?",
      timestamp: new Date(),
      category: "general"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const medicalKnowledge = {
    symptoms: {
      "fever": {
        causes: ["Viral infection", "Bacterial infection", "Inflammatory conditions"],
        recommendations: ["Monitor temperature", "Ensure hydration", "Consider antipyretics", "Seek medical attention if >102°F"]
      },
      "chest pain": {
        causes: ["Cardiac issues", "Pulmonary embolism", "Musculoskeletal", "GERD"],
        recommendations: ["Immediate ECG", "Cardiac enzymes", "Chest X-ray", "Consider emergency evaluation"]
      },
      "headache": {
        causes: ["Tension headache", "Migraine", "Cluster headache", "Secondary causes"],
        recommendations: ["Assess severity and pattern", "Neurological examination", "Consider imaging if red flags"]
      }
    },
    emergencyKeywords: ["chest pain", "difficulty breathing", "severe headache", "stroke", "heart attack", "emergency"]
  };

  const quickSuggestions = [
    "Suggest differential diagnosis for chest pain",
    "Treatment options for hypertension",
    "Drug interactions with warfarin",
    "Signs of sepsis to monitor"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = async (userMessage: string) => {
    const messageLower = userMessage.toLowerCase();
    let response = "";
    let category: Message["category"] = "general";

    // Check for emergency keywords
    if (medicalKnowledge.emergencyKeywords.some(keyword => messageLower.includes(keyword))) {
      category = "emergency";
      response = "⚠️ This appears to be a potential emergency situation. Please ensure immediate medical evaluation is considered. ";
    }

    // Check for symptom-based queries
    for (const [symptom, data] of Object.entries(medicalKnowledge.symptoms)) {
      if (messageLower.includes(symptom)) {
        category = "diagnosis";
        response += `For ${symptom}, consider these possibilities:\n\n`;
        response += `**Potential Causes:**\n${data.causes.map(cause => `• ${cause}`).join('\n')}\n\n`;
        response += `**Clinical Recommendations:**\n${data.recommendations.map(rec => `• ${rec}`).join('\n')}\n\n`;
        break;
      }
    }

    // Default responses for common queries
    if (!response) {
      if (messageLower.includes("diagnosis")) {
        category = "diagnosis";
        response = "I can help with differential diagnosis. Please provide specific symptoms, patient history, and examination findings for more targeted suggestions.";
      } else if (messageLower.includes("treatment") || messageLower.includes("medication")) {
        category = "treatment";
        response = "For treatment recommendations, I need more details about the condition, patient demographics, allergies, and current medications. Always verify dosages and contraindications.";
      } else if (messageLower.includes("drug interaction")) {
        category = "treatment";
        response = "Drug interactions are critical to check. Please specify the medications in question. I recommend using clinical pharmacy resources for comprehensive interaction checking.";
      } else {
        response = "I'm here to assist with medical queries. You can ask about symptoms, differential diagnosis, treatment options, drug interactions, or clinical guidelines. How can I help?";
      }
    }

    response += "\n\n*Note: This AI assistance is for educational and decision support purposes only. Always use clinical judgment and consult current guidelines.*";

    return { content: response, category };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiResponse = await generateAIResponse(inputMessage);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponse.content,
        timestamp: new Date(),
        category: aiResponse.category
      };

      setMessages(prev => [...prev, aiMessage]);

      if (aiResponse.category === "emergency") {
        toast({
          title: "Emergency Alert",
          description: "Potential emergency situation detected. Ensure immediate evaluation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("AI response error:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "diagnosis": return <Brain className="h-4 w-4" />;
      case "treatment": return <Stethoscope className="h-4 w-4" />;
      case "emergency": return <span className="text-red-500">⚠️</span>;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "diagnosis": return "bg-blue-100 text-blue-800";
      case "treatment": return "bg-green-100 text-green-800";
      case "emergency": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'top-4 right-4'} z-50 transition-all duration-300`}>
      <Card className={`${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'} shadow-xl border-2 border-medical-200`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-medical-600">
              <Bot className="h-5 w-5" />
              {isMinimized ? "Medical AI" : "Medical AI Assistant"}
            </CardTitle>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onMinimize}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex flex-col h-[520px]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 bg-gray-50 rounded">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === "user" 
                      ? "bg-medical-500 text-white" 
                      : "bg-white border shadow-sm"
                  }`}>
                    {message.type === "ai" && message.category && (
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(message.category)}
                        <Badge className={getCategoryColor(message.category)}>
                          {message.category}
                        </Badge>
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      message.type === "user" ? "text-medical-100" : "text-gray-500"
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm p-3 rounded-lg">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-medical-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-medical-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-medical-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {quickSuggestions.slice(0, 2).map((suggestion, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    className="text-xs h-6"
                    onClick={() => setInputMessage(suggestion)}
                  >
                    {suggestion.length > 25 ? `${suggestion.substring(0, 25)}...` : suggestion}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about symptoms, diagnosis, treatments..."
                className="text-sm"
                disabled={isTyping}
              />
              <Button 
                size="sm"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-medical-500 hover:bg-medical-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default AIAgent;
