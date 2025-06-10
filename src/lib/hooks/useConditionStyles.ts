import { useMemo } from 'react';
import { CheckCircle, Award, BarChart } from 'lucide-react';

/**
 * A custom hook that returns styling and icon information for product conditions
 */
export function useConditionStyles(condition: string) {
  return useMemo(() => {
    // Default values
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';
    let Icon = BarChart;
    
    // Match condition to appropriate styling
    switch(condition) {
      case 'New':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        Icon = CheckCircle;
        break;
      case 'Like New':
        bgColor = 'bg-teal-100';
        textColor = 'text-teal-800';
        Icon = Award;
        break;
      case 'Good':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        Icon = BarChart;
        break;
      case 'Fair':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        Icon = BarChart;
        break;
      case 'Poor':
        bgColor = 'bg-orange-100';
        textColor = 'text-orange-800';
        Icon = BarChart;
        break;
      default:
        // Use defaults for unknown conditions
        break;
    }
    
    return {
      className: `${bgColor} ${textColor}`,
      Icon
    };
  }, [condition]);
} 