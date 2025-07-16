import React from 'react';
import { Image as ImageIcon } from 'lucide-react';


interface PictureCounterProps {
  count: number;
  className?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

const PictureCounter: React.FC<PictureCounterProps> = ({ count, className = '', Icon = ImageIcon }) => (
  <div className={`bg-black bg-opacity-60 rounded-lg px-2 py-1 flex items-center gap-1 text-white text-xs font-medium shadow ${className}`}>
    <Icon className="w-4 h-4 mr-1" />
    <span>{count}</span>
  </div>
);

export default PictureCounter;
