import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', width, height, circle = false, style = {} }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200/80 dark:bg-gray-700/60 ${className}`}
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : undefined,
        ...style,
      }}
    />
  );
}

export default Skeleton;
