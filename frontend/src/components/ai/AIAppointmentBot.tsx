import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageCircle,
} from "lucide-react";
import axios from "axios";

interface AIAppointmentBotProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: string;
  state?: string;
  availableSlots?: AppointmentSlot[];
  suggestedActions?: string[];
  urgency?: string;
  bookingData?: Record<string, unknown>;
  appointmentBooked?: boolean;
  appointmentDetails?: unknown;
  intent?: string;
  patient?: Patient;
}

interface AppointmentSlot {
  date: string;
  time: string;
  displayDate: string;
}

interface Patient {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

const AIAppointmentBot = ({
  isOpen,
  onClose,
  onMinimize,
  isMinimized,
}: AIAppointmentBotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Hello! I'm your AI appointment assistant. 👋\n\nI can help you:\n📅 **Book new appointments**\n🔄 **Reschedule existing appointments**\n❌ **Cancel appointments**\n📋 **Check available slots**\n\nWhat would you like to do today?",
      timestamp: new Date().toISOString(),
      state: "greeting",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId] = useState(`conv_${Date.now()}`);
  const [conversationState, setConversationState] = useState("greeting");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await axios.post(`${API_URL}/ai/chat/appointment`, {
        message: message.trim(),
        conversationId: conversationId,
      });

      if (response.data.success) {
        const aiMessage: Message = response.data.response;
        setMessages((prev) => [...prev, aiMessage]);

        // Handle urgent cases
        if (aiMessage.urgency === "emergency") {
          toast({
            title: "Urgent Request Detected",
            description:
              "This seems urgent. Please consider calling directly for immediate assistance.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => {
    sendMessage(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSlotSelection = async (slot: AppointmentSlot) => {
    setIsTyping(true);
    try {
      // Check slot availability first
      const response = await axios.post(
        `${API_URL}/appointments/check-availability`,
        {
          date: slot.date,
          time: slot.time,
        }
      );

      if (response.data.available) {
        // Slot is available, proceed with booking
        const confirmMessage = `I'd like to book the ${slot.time} slot on ${slot.displayDate}`;
        sendMessage(confirmMessage);
      }
    } catch (error: unknown) {
      console.error("Error checking slot availability:", error);

      // Type guard to check if error is an Axios error
      if (
        typeof error === 'object' && 
        error !== null && 
        'response' in error && 
        error.response && 
        typeof error.response === 'object' && 
        'status' in error.response
      ) {
        // Now TypeScript knows error.response exists and has status
        if (error.response.status === 409) {
          const responseData = error.response as { data?: { message?: string } };
          toast({
            title: "Slot Already Booked",
            description:
              responseData.data?.message ||
              "This time slot is already booked. Please select another time.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to check slot availability. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string, message: Message) => {
    switch (action) {
      case "select_slot":
        // Scroll to available slots
        break;
      case "book_appointment":
        sendMessage("I want to book an appointment");
        break;
      case "check_appointments":
        sendMessage("Show me available appointments");
        break;
      case "contact_staff":
        sendMessage("I need to speak with staff");
        break;
      default:
        sendMessage(action.replace("_", " "));
    }
  };

  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case "book":
        return <Calendar className="h-4 w-4 text-green-600" />;
      case "reschedule":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "cancel":
        return <X className="h-4 w-4 text-red-600" />;
      case "check":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "booking_confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Bot className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "emergency":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed ${
        isMinimized ? "bottom-4 right-4" : "top-4 right-4"
      } z-50 transition-all duration-300`}
    >
      <Card
        className={`${
          isMinimized ? "w-80 h-16" : "w-[420px] h-[700px]"
        } shadow-xl border-2 border-medical-200`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-medical-600">
              <Bot className="h-5 w-5" />
              {isMinimized
                ? "AI Appointment Assistant"
                : "AI Appointment Assistant"}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onMinimize}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? (
                  <Maximize2 className="h-3 w-3" />
                ) : (
                  <Minimize2 className="h-3 w-3" />
                )}
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
          <CardContent className="flex flex-col h-[620px]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-3 bg-gray-50 rounded-lg">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.type === "user"
                        ? "bg-medical-500 text-white rounded-lg p-3"
                        : "bg-white border shadow-sm rounded-lg p-3"
                    }`}
                  >
                    {/* AI Message Header */}
                    {message.type === "ai" && (
                      <div className="flex items-center gap-2 mb-2">
                        {getIntentIcon(message.intent)}
                        {message.intent && (
                          <Badge variant="outline" className="text-xs">
                            {message.intent}
                          </Badge>
                        )}
                        {message.urgency && message.urgency !== "low" && (
                          <Badge
                            className={`text-xs ${getUrgencyColor(
                              message.urgency
                            )}`}
                          >
                            {message.urgency}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>

                    {/* Available Slots */}
                    {message.availableSlots &&
                      message.availableSlots.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs font-medium text-gray-600">
                            Available Slots:
                          </div>
                          <div className="grid gap-2">
                            {message.availableSlots.map((slot, index) => (
                              <Button
                                key={index}
                                size="sm"
                                variant="outline"
                                className="justify-start text-left h-auto p-2"
                                onClick={() => handleSlotSelection(slot)}
                              >
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  <div>
                                    <div className="font-medium">
                                      {slot.displayDate}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {slot.time}
                                    </div>
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Patient Info */}
                    {message.patient && (
                      <div className="mt-3 p-2 bg-blue-50 rounded border">
                        <div className="text-xs font-medium text-blue-800 mb-1">
                          Patient Found:
                        </div>
                        <div className="text-xs text-blue-700">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {message.patient.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {message.patient.phone}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    {message.suggestedActions &&
                      message.suggestedActions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {message.suggestedActions.map((action, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant="ghost"
                              className="text-xs h-6 px-2 bg-gray-100 hover:bg-gray-200"
                              onClick={() => handleQuickAction(action, message)}
                            >
                              {action.replace("_", " ")}
                            </Button>
                          ))}
                        </div>
                      )}

                    {/* Timestamp */}
                    <div
                      className={`text-xs mt-2 ${
                        message.type === "user"
                          ? "text-medical-100"
                          : "text-gray-500"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-medical-500" />
                      <span className="text-sm text-gray-600">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Appointment Success/Confirmation Display */}
            {messages.length > 0 &&
              messages[messages.length - 1]?.appointmentBooked && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Appointment Booked Successfully!
                  </div>
                  <div className="text-xs text-green-700">
                    Your appointment has been confirmed and you'll receive
                    notifications shortly.
                  </div>
                </div>
              )}

            {/* Quick Suggestions */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {[
                  "Book appointment",
                  "Check availability",
                  "Reschedule appointment",
                  "Cancel appointment",
                ].map((suggestion, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    className="text-xs h-6"
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
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
                placeholder="Type your message... (e.g., 'Book me for tomorrow morning')"
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

export default AIAppointmentBot;
