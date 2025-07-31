
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldX } from "lucide-react";

interface ABHAStatusProps {
  abhaId?: string;
  verified?: boolean;
  className?: string;
}

const ABHAStatus = ({ abhaId, verified = false, className = "" }: ABHAStatusProps) => {
  if (!abhaId) {
    return (
      <Badge variant="outline" className={`text-gray-600 ${className}`}>
        <ShieldX className="h-3 w-3 mr-1" />
        No ABHA ID
      </Badge>
    );
  }

  return (
    <Badge 
      className={`${verified ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} ${className}`}
    >
      {verified ? (
        <ShieldCheck className="h-3 w-3 mr-1" />
      ) : (
        <Shield className="h-3 w-3 mr-1" />
      )}
      ABHA: {abhaId}
    </Badge>
  );
};

export default ABHAStatus;
