import React from 'react';

interface StaffStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const StaffStatusBadge: React.FC<StaffStatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Duty':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Off Duty':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'On Break':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'On Leave':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Emergency Leave':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Late':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Extended Shift':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${getStatusColor(
        status
      )} ${getSizeClasses()}`}
    >
      <span className="mr-1.5 h-2 w-2 rounded-full bg-current opacity-75"></span>
      {status}
    </span>
  );
};

export default StaffStatusBadge;
