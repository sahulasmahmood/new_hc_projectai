
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";
import AIAgentToggle from "@/components/ai/AIAgentToggle";

const AppLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <AIAgentToggle />
      <Toaster />
    </div>
  );
};

export default AppLayout;
