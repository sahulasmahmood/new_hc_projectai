import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StaffStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const StaffStatusBadge: React.FC<StaffStatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on duty':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'off duty':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'on break':
      case 'break':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'on leave':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'emergency leave':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'late':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'extended shift':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-base px-4 py-2';
      default:
        return 'text-sm px-3 py-1';
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} ${getSizeClasses()} inline-flex items-center`}>
      <span className="mr-1.5 h-2 w-2 rounded-full bg-current opacity-75"></span>
      {status}
    </Badge>
  );
};

export default StaffStatusBadge;
