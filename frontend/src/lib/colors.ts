// Reusable Color System
// This file provides consistent color utilities for the entire application

export const colors = {
  // Primary Teal Green Colors (Medical Theme)
  primary: {
    50: '#F0FDFA',   // Very light teal
    100: '#CCFBF1',  // Light teal
    200: '#99F6E4',  // Lighter teal
    300: '#5EEAD4',  // Light teal
    400: '#2DD4BF',  // Medium light teal
    500: '#4FD1C5',  // Primary teal green (your existing color)
    600: '#319795',  // Medium teal (your existing color)
    700: '#2C7A7B',  // Dark teal (your existing color)
    800: '#285E61',  // Darker teal
    900: '#234E52',  // Very dark teal
  },
  
  // Status Colors
  success: {
    light: '#DCFCE7',
    DEFAULT: '#22C55E',
    dark: '#15803D',
  },
  
  warning: {
    light: '#FEF3C7',
    DEFAULT: '#F59E0B',
    dark: '#D97706',
  },
  
  error: {
    light: '#FEE2E2',
    DEFAULT: '#EF4444',
    dark: '#DC2626',
  },
  
  info: {
    light: '#DBEAFE',
    DEFAULT: '#3B82F6',
    dark: '#1D4ED8',
  },
} as const;

// CSS Class Utilities
export const colorClasses = {
  // Primary Button Classes
  primaryButton: 'bg-primary hover:bg-primary/90 text-white',
  primaryButtonOutline: 'border-primary text-primary hover:bg-primary hover:text-white',
  
  // Background Classes
  primaryBg: 'bg-primary',
  primaryBgLight: 'bg-primary/10',
  primaryBgHover: 'hover:bg-primary/90',
  
  // Text Classes
  primaryText: 'text-primary',
  primaryTextLight: 'text-primary/70',
  primaryTextDark: 'text-primary-700',
  
  // Border Classes
  primaryBorder: 'border-primary',
  primaryBorderLight: 'border-primary/20',
  
  // Status Classes
  success: 'bg-green-500 text-white',
  successLight: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-yellow-500 text-white',
  warningLight: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  error: 'bg-red-500 text-white',
  errorLight: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-500 text-white',
  infoLight: 'bg-blue-50 text-blue-700 border-blue-200',
} as const;

// Tailwind Class Generators
export const generateColorClasses = {
  button: (variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' = 'primary') => {
    const variants = {
      primary: 'bg-primary hover:bg-primary/90 text-white',
      secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
      success: 'bg-green-500 hover:bg-green-600 text-white',
      warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      error: 'bg-red-500 hover:bg-red-600 text-white',
    };
    return variants[variant];
  },
  
  badge: (variant: 'primary' | 'success' | 'warning' | 'error' | 'info' = 'primary') => {
    const variants = {
      primary: 'bg-primary/10 text-primary border-primary/20',
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return variants[variant];
  },
  
  alert: (variant: 'primary' | 'success' | 'warning' | 'error' | 'info' = 'primary') => {
    const variants = {
      primary: 'bg-primary/10 border-l-4 border-primary text-primary-800',
      success: 'bg-green-50 border-l-4 border-green-500 text-green-800',
      warning: 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800',
      error: 'bg-red-50 border-l-4 border-red-500 text-red-800',
      info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-800',
    };
    return variants[variant];
  },
};

// Usage Examples:
/*
// In your components:
import { colorClasses, generateColorClasses } from '@/lib/colors';

// Use predefined classes
<Button className={colorClasses.primaryButton}>Save</Button>

// Use generators
<Button className={generateColorClasses.button('success')}>Success</Button>
<Badge className={generateColorClasses.badge('warning')}>Warning</Badge>

// Use Tailwind classes directly with the new color system
<div className="bg-primary text-white">Primary Background</div>
<div className="bg-medical-500 hover:bg-medical-600">Medical Green</div>
*/