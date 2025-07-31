
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Calendar } from "lucide-react";
import AIAppointmentBot from "./AIAppointmentBot";

const AIAgentToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={handleToggle}
          className="fixed bottom-6 right-6 z-40 bg-medical-500 hover:bg-medical-600 text-white shadow-lg rounded-full w-16 h-16 p-0 flex flex-col items-center justify-center"
          size="lg"
        >
          <Bot className="h-5 w-5" />
          <Calendar className="h-3 w-3 mt-0.5" />
        </Button>
      )}
      
      <AIAppointmentBot 
        isOpen={isOpen}
        onClose={handleClose}
        onMinimize={handleMinimize}
        isMinimized={isMinimized}
      />
    </>
  );
};

export default AIAgentToggle;
